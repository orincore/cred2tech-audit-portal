import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listBackupStatus } from '../src/db/queries';
import { serializeRows } from '../src/lib/serialize';

let sharedPool;
export const getServerSideProps = requireAuthPage(async () => {
  sharedPool = sharedPool || createPool();
  const rows = await listBackupStatus(sharedPool, { limit: 200 });
  return { props: { rows: serializeRows(rows) } };
});

function YesNoSeal({ ok }) {
  return (
    <span className="badge">
      <span className={`seal ${ok ? 'status-yes' : 'status-no'}`} style={{ width: 12, height: 12 }} aria-hidden="true" />
      {ok ? 'Yes' : 'No'}
    </span>
  );
}

export default function BackupStatus({ rows }) {
  return (
    <div className="shell">
      <Head>
        <title>Backup Status — Monitoring Services</title>
      </Head>
      <Nav activePage="backup-status" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">Continuity &amp; Recovery</p>
            <h1 className="page-title">Backup Status</h1>
          </div>
          <div className="page-head-actions">
            <a href="/api/backup-status/export" className="export-link">Export CSV</a>
          </div>
        </div>

        <div className="ledger-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Ran at</th>
                <th>Success</th>
                <th>Encrypted</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="col-time">{new Date(r.ran_at).toLocaleString()}</td>
                  <td><YesNoSeal ok={r.success} /></td>
                  <td><YesNoSeal ok={r.encrypted} /></td>
                  <td>{r.detail}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={4}>No backup runs recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
