# cred2tech-audit-portal

Read-only, bcrypt+JWT-authenticated web portal for the CISA/CICRA IS audit. Reads
directly from `audit_logs_db` (populated by the sibling `audit-log-shipper` repo)
and pushes live updates over WebSocket via Postgres LISTEN/NOTIFY.

## Local development

1. Copy `.env.example` to `.env` and fill in `PORTAL_DB_URL` / `JWT_SECRET`.
2. `npm install`
3. `npm run dev` — boots the custom server on `PORT` (default 4000), auto-creates
   `auditor_users` / `portal_login_attempts` on first boot.
4. Create an account: `node scripts/create-auditor.js --username auditor1 --password <pass>`
5. Visit `http://localhost:4000/login`.

## Tests

`npm test` — unit tests always run; integration tests that need a real Postgres
connection read `TEST_AUDIT_DB_URL` and skip themselves if it's unset.

## Deployment

See `../nestjs-backend/docs/superpowers/plans/2026-07-07-cred2tech-audit-portal-deployment.md`
(Plan 4) for the full VPS runbook: Postgres role setup, Nginx vhost, TLS via
certbot, and PM2 process management. `ecosystem.config.js` and
`deploy/nginx-audit.cred2tech.com.conf` in this repo are the artifacts that
runbook installs.
