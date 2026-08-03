const MAX_LIMIT = 1000;

function clampLimit(limit) {
  const n = Number(limit) || 200;
  return Math.min(Math.max(n, 1), MAX_LIMIT);
}

function buildWhere(clauses, values) {
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

async function listAppLogs(pool, { app, level, q, from, to, afterId, beforeId, limit } = {}) {
  const clauses = [];
  const values = [];
  if (app) { values.push(app); clauses.push(`app = $${values.length}`); }
  if (level) { values.push(level); clauses.push(`level = $${values.length}`); }
  // meta holds the actual request method/url/status (msg is just the generic
  // pino-http text "request completed"/"access log"), so search must cover
  // both or a query for e.g. a URL path silently matches nothing.
  if (q) { values.push(`%${q}%`); clauses.push(`(msg ILIKE $${values.length} OR meta::text ILIKE $${values.length})`); }
  if (from) { values.push(from); clauses.push(`time >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`time <= $${values.length}`); }
  if (afterId) { values.push(afterId); clauses.push(`id > $${values.length}`); }
  if (beforeId) { values.push(beforeId); clauses.push(`id < $${values.length}`); }

  const order = afterId ? 'id ASC' : 'id DESC';
  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, app, level, time, msg, meta FROM app_logs ${buildWhere(clauses, values)} ORDER BY ${order} LIMIT $${values.length}`,
    values,
  );
  return rows;
}

async function listServerLogs(pool, { source, q, from, to, afterId, beforeId, limit } = {}) {
  const clauses = [];
  const values = [];
  if (source) { values.push(source); clauses.push(`source = $${values.length}`); }
  if (q) { values.push(`%${q}%`); clauses.push(`message ILIKE $${values.length}`); }
  if (from) { values.push(from); clauses.push(`time >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`time <= $${values.length}`); }
  if (afterId) { values.push(afterId); clauses.push(`id > $${values.length}`); }
  if (beforeId) { values.push(beforeId); clauses.push(`id < $${values.length}`); }

  const order = afterId ? 'id ASC' : 'id DESC';
  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, source, time, message, meta FROM server_logs ${buildWhere(clauses, values)} ORDER BY ${order} LIMIT $${values.length}`,
    values,
  );
  return rows;
}

async function listPm2Health(pool, { app, from, to, afterId, limit } = {}) {
  const clauses = [];
  const values = [];
  if (app) { values.push(app); clauses.push(`app = $${values.length}`); }
  if (from) { values.push(from); clauses.push(`time >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`time <= $${values.length}`); }
  if (afterId) { values.push(afterId); clauses.push(`id > $${values.length}`); }

  const order = afterId ? 'id ASC' : 'id DESC';
  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, app, status, uptime_ms, restarts, cpu_pct, mem_mb, time FROM pm2_health ${buildWhere(clauses, values)} ORDER BY ${order} LIMIT $${values.length}`,
    values,
  );
  return rows;
}

async function listSystemHealth(pool, { from, to, afterId, limit } = {}) {
  const clauses = [];
  const values = [];
  if (from) { values.push(from); clauses.push(`time >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`time <= $${values.length}`); }
  if (afterId) { values.push(afterId); clauses.push(`id > $${values.length}`); }

  const order = afterId ? 'id ASC' : 'id DESC';
  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, cpu_load, mem_used_pct, disk_used_pct, net_rx_bytes, net_tx_bytes, time FROM system_health ${buildWhere(clauses, values)} ORDER BY ${order} LIMIT $${values.length}`,
    values,
  );
  return rows;
}

async function listConsentEvents(pool, { eventType, from, to, limit } = {}) {
  const clauses = [];
  const values = [];
  if (eventType) { values.push(eventType); clauses.push(`event_type = $${values.length}`); }
  if (from) { values.push(from); clauses.push(`time >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`time <= $${values.length}`); }

  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, source_id, user_id, purpose, event_type, time FROM consent_events ${buildWhere(clauses, values)} ORDER BY id DESC LIMIT $${values.length}`,
    values,
  );
  return rows;
}

async function listBackupStatus(pool, { from, to, limit } = {}) {
  const clauses = [];
  const values = [];
  if (from) { values.push(from); clauses.push(`ran_at >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`ran_at <= $${values.length}`); }

  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, source_id, ran_at, success, encrypted, detail FROM backup_status ${buildWhere(clauses, values)} ORDER BY ran_at DESC LIMIT $${values.length}`,
    values,
  );
  return rows;
}

async function rollup24h(pool) {
  const { rows } = await pool.query(`
    SELECT app,
           COUNT(*) FILTER (WHERE level = 'error' OR level = 'fatal') AS error_count
    FROM app_logs
    WHERE time >= now() - interval '24 hours'
    GROUP BY app
  `);
  const { rows: restartRows } = await pool.query(`
    SELECT app, MAX(restarts) - MIN(restarts) AS restart_count
    FROM pm2_health
    WHERE time >= now() - interval '24 hours'
    GROUP BY app
  `);
  const errorByApp = Object.fromEntries(rows.map((r) => [r.app, Number(r.error_count) || 0]));
  const restartByApp = Object.fromEntries(restartRows.map((r) => [r.app, Number(r.restart_count) || 0]));
  const apps = new Set([...Object.keys(errorByApp), ...Object.keys(restartByApp)]);
  return Array.from(apps).map((app) => ({
    app,
    errorCount: errorByApp[app] || 0,
    restartCount: restartByApp[app] || 0,
  }));
}

module.exports = {
  listAppLogs, listServerLogs, listPm2Health, listSystemHealth,
  listConsentEvents, listBackupStatus, rollup24h, clampLimit,
};
