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

async function listPurgeEvents(pool, { sourceTable, status, from, to, limit } = {}) {
  const clauses = [];
  const values = [];
  if (sourceTable) { values.push(sourceTable); clauses.push(`source_table = $${values.length}`); }
  if (status) { values.push(status); clauses.push(`status = $${values.length}`); }
  if (from) { values.push(from); clauses.push(`purged_at >= $${values.length}`); }
  if (to) { values.push(to); clauses.push(`purged_at <= $${values.length}`); }

  values.push(clampLimit(limit));
  const { rows } = await pool.query(
    `SELECT id, source_id, source_table, record_id, customer_id, tenant_id, purged_fields, files_deleted, status, error_message, purged_at
     FROM purge_events ${buildWhere(clauses, values)} ORDER BY id DESC LIMIT $${values.length}`,
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

// Every vhost on the VPS shares one Nginx access_log, tailed into
// server_logs with source='nginx' and the client IP under meta.ip (see
// audit-log-shipper's parsers/nginxLine.js) — so this one aggregation
// covers request volume across all production backends, not just this
// portal.
async function listIpActivity(pool, { hours = 24, limit = 200 } = {}) {
  const { rows } = await pool.query(
    `SELECT meta->>'ip' AS ip,
            COUNT(*) AS request_count,
            COUNT(*) FILTER (WHERE (meta->>'status')::int >= 400) AS error_count,
            MIN(time) AS first_seen,
            MAX(time) AS last_seen
     FROM server_logs
     WHERE source = 'nginx' AND meta ? 'ip' AND time >= now() - ($1::int * interval '1 hour')
     GROUP BY meta->>'ip'
     ORDER BY request_count DESC
     LIMIT $2`,
    [hours, clampLimit(limit)],
  );
  return rows;
}

async function listBlockedIps(pool) {
  const { rows } = await pool.query(
    `SELECT ip, reason, blocked_by, blocked_at FROM blocked_ips WHERE active = true ORDER BY blocked_at DESC`,
  );
  return rows;
}

async function blockIp(pool, { ip, reason, actor }) {
  await pool.query(
    `INSERT INTO blocked_ips (ip, reason, blocked_by, active, blocked_at, unblocked_at, unblocked_by)
     VALUES ($1, $2, $3, true, now(), NULL, NULL)
     ON CONFLICT (ip) DO UPDATE SET
       reason = EXCLUDED.reason,
       blocked_by = EXCLUDED.blocked_by,
       active = true,
       blocked_at = now(),
       unblocked_at = NULL,
       unblocked_by = NULL`,
    [ip, reason || null, actor],
  );
}

async function unblockIp(pool, { ip, actor }) {
  await pool.query(
    `UPDATE blocked_ips SET active = false, unblocked_at = now(), unblocked_by = $2 WHERE ip = $1`,
    [ip, actor],
  );
}

async function logIpBlockAudit(pool, { ip, action, reason, actor, detail }) {
  await pool.query(
    `INSERT INTO ip_block_audit_log (ip, action, reason, actor, detail) VALUES ($1, $2, $3, $4, $5)`,
    [ip, action, reason || null, actor, detail || null],
  );
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
  listConsentEvents, listPurgeEvents, listBackupStatus, rollup24h, clampLimit,
  listIpActivity, listBlockedIps, blockIp, unblockIp, logIpBlockAudit,
};
