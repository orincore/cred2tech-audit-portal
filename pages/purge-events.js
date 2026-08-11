import { useState } from 'react';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listPurgeEvents } from '../src/db/queries';
import { maskIdentifier } from '../src/lib/mask';
import { serializeRows } from '../src/lib/serialize';
import { friendlyTableName, friendlyFieldLabel } from '../src/lib/purgeLabels';

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
                <th>Date &amp; Time</th>
                <th>Record Type</th>
                <th>Record ID</th>
                <th>Customer</th>
                <th>Data Removed</th>
                <th>Documents Deleted</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const fields = Array.isArray(r.purged_fields) ? r.purged_fields : [];
                const isSuccess = String(r.status).toUpperCase() === 'SUCCESS';
                return (
                  <tr key={r.id}>
                    <td className="col-time">{new Date(r.purged_at).toLocaleString()}</td>
                    <td>
                      <span className="record-type">{friendlyTableName(r.source_table)}</span>
                      <span className="record-type-sub">{r.source_table}</span>
                    </td>
                    <td>{r.record_id}</td>
                    <td>{r.customer_id}</td>
                    <td>
                      <div className="field-pills">
                        {fields.length === 0 && <span className="field-pill">None</span>}
                        {fields.map((f) => (
                          <span className="field-pill" key={f}>{friendlyFieldLabel(f)}</span>
                        ))}
                      </div>
                    </td>
                    <td>{r.files_deleted ? 'Yes' : 'No'}</td>
                    <td>
                      <span className={`badge ${isSuccess ? 'status-success' : 'status-failed'}`}>
                        <span className="dot" />
                        {isSuccess ? 'Completed' : 'Failed'}
                      </span>
                      {!isSuccess && r.error_message && (
                        <span className="record-type-sub">{r.error_message}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
