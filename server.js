require('dotenv').config();
const { createServer } = require('http');
const next = require('next');
const { createPool, ensureSchema } = require('./src/db/pool');

const port = Number(process.env.PORT) || 4000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();
  const pool = createPool();
  await ensureSchema(pool);

  const server = createServer((req, res) => handle(req, res));
  server.listen(port, () => {
    console.log(JSON.stringify({ level: 'info', app: 'cred2tech-audit-portal', msg: `listening on ${port}` }));
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(JSON.stringify({ level: 'info', app: 'cred2tech-audit-portal', msg: `received ${signal}, shutting down` }));
    server.close();
    try {
      await pool.end();
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: 'pool.end failed: ' + err.message }));
    }
    process.exit(0);
  };
  ['SIGTERM', 'SIGINT'].forEach((signal) => process.on(signal, () => shutdown(signal)));
}

main().catch((err) => {
  console.error(JSON.stringify({ level: 'fatal', app: 'cred2tech-audit-portal', msg: err.message }));
  process.exit(1);
});
