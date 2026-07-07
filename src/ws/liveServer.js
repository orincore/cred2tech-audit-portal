const { WebSocketServer } = require('ws');
const { Client } = require('pg');
const {
  listAppLogs, listServerLogs, listPm2Health, listSystemHealth,
} = require('../db/queries');

const CHANNELS = ['app_logs', 'server_logs', 'pm2_health', 'system_health'];
const LISTERS = {
  app_logs: listAppLogs,
  server_logs: listServerLogs,
  pm2_health: listPm2Health,
  system_health: listSystemHealth,
};
const RECONNECT_DELAY_MS = 3000;

function matchesFilters(row, channel, filters) {
  if (!filters) return true;
  if (channel === 'app_logs') {
    if (filters.app && row.app !== filters.app) return false;
    if (filters.level && row.level !== filters.level) return false;
  }
  if (channel === 'server_logs' && filters.source && row.source !== filters.source) return false;
  if (channel === 'pm2_health' && filters.app && row.app !== filters.app) return false;
  return true;
}

function attachWebSocketServer(httpServer, pool) {
  const wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });
  const lastIdByChannel = { app_logs: 0, server_logs: 0, pm2_health: 0, system_health: 0 };

  wss.on('connection', (ws) => {
    ws.subscriptions = {};
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'subscribe' && CHANNELS.includes(msg.channel)) {
          ws.subscriptions[msg.channel] = msg.filters || {};
        } else if (msg.type === 'unsubscribe') {
          delete ws.subscriptions[msg.channel];
        }
      } catch {
        // ignore malformed client messages
      }
    });
  });

  function broadcast(channel, rows) {
    for (const client of wss.clients) {
      if (client.readyState !== 1 /* OPEN */) continue;
      const filters = client.subscriptions && client.subscriptions[channel];
      if (!filters) continue;
      const matching = rows.filter((row) => matchesFilters(row, channel, filters));
      if (matching.length) client.send(JSON.stringify({ type: 'rows', channel, rows: matching }));
    }
  }

  async function handleNotify(channel) {
    const lister = LISTERS[channel];
    const rows = await lister(pool, { afterId: lastIdByChannel[channel], limit: 500 });
    if (!rows.length) return;
    lastIdByChannel[channel] = rows[rows.length - 1].id;
    broadcast(channel, rows);
  }

  function connectListener() {
    const listenClient = new Client({ connectionString: process.env.PORTAL_DB_URL });
    listenClient.connect()
      .then(async () => {
        for (const channel of CHANNELS) {
          await listenClient.query(`LISTEN ${channel}`);
        }
        console.log(JSON.stringify({ level: 'info', app: 'cred2tech-audit-portal', msg: 'LISTEN connection established' }));
      })
      .catch((err) => {
        console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: 'LISTEN connect failed: ' + err.message }));
        setTimeout(connectListener, RECONNECT_DELAY_MS);
      });

    listenClient.on('notification', (msg) => {
      handleNotify(msg.channel).catch((err) => {
        console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: `handleNotify(${msg.channel}) failed: ${err.message}` }));
      });
    });

    listenClient.on('error', (err) => {
      console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: 'LISTEN connection error: ' + err.message }));
    });

    listenClient.on('end', () => {
      console.error(JSON.stringify({ level: 'warn', app: 'cred2tech-audit-portal', msg: 'LISTEN connection ended, reconnecting' }));
      setTimeout(connectListener, RECONNECT_DELAY_MS);
    });

    return listenClient;
  }

  const listenClient = connectListener();

  return {
    wss,
    async stop() {
      wss.close();
      try {
        await listenClient.end();
      } catch {
        // already closed
      }
    },
  };
}

module.exports = { attachWebSocketServer, matchesFilters, CHANNELS };
