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

export default function BackupStatus({ rows }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Nav activePage="backup-status" />
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Backup Status</h1>
        <a href="/api/backup-status/export">Export CSV</a>
        <table style={{ borderCollapse: 'collapse', marginTop: 16, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 4 }}>Ran at</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Success</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Encrypted</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 4 }}>{new Date(r.ran_at).toLocaleString()}</td>
                <td style={{ padding: 4 }}>{r.success ? 'yes' : 'no'}</td>
                <td style={{ padding: 4 }}>{r.encrypted ? 'yes' : 'no'}</td>
                <td style={{ padding: 4 }}>{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
