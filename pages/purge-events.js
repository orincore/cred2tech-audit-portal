import { useState } from 'react';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listPurgeEvents } from '../src/db/queries';
import { maskIdentifier } from '../src/lib/mask';
import { serializeRows } from '../src/lib/serialize';

let sharedPool;
export const getServerSideProps = requireAuthPage(async (context) => {
  sharedPool = sharedPool || createPool();
  const { sourceTable, status, from, to } = context.query;
  const rows = await listPurgeEvents(sharedPool, { sourceTable, status, from, to, limit: 200 });
  return {
    props: {
      rows: serializeRows(rows).map((r) => ({ ...r, customer_id: maskIdentifier(r.customer_id) })),
      filters: { sourceTable: sourceTable || '', status: status || '', from: from || '', to: to || '' },
    },
  };
});

export default function PurgeEvents({ rows, filters }) {
  const [form, setForm] = useState(filters);
  const exportHref = `/api/purge-events/export?${new URLSearchParams(Object.entries(form).filter(([, v]) => v)).toString()}`;

  return (
    <div className="shell">
      <Head>
        <title>Data Purge Events — Monitoring Services</title>
      </Head>
      <Nav activePage="purge-events" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">Compliance Record</p>
            <h1 className="page-title">Data Purge Events</h1>
          </div>
          <div className="page-head-actions">
            <a href={exportHref} className="export-link">Export CSV</a>
          </div>
        </div>

        <div className="ledger-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source Table</th>
                <th>Record ID</th>
                <th>Customer</th>
                <th>Fields Purged</th>
                <th>Files Deleted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="col-time">{new Date(r.purged_at).toLocaleString()}</td>
                  <td>{r.source_table}</td>
                  <td>{r.record_id}</td>
                  <td>{r.customer_id}</td>
                  <td>{Array.isArray(r.purged_fields) ? r.purged_fields.join(', ') : ''}</td>
                  <td>{r.files_deleted ? 'Yes' : 'No'}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={7}>No purge events match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
