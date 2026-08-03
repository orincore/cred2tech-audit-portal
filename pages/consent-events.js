import { useState } from 'react';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listConsentEvents } from '../src/db/queries';
import { maskIdentifier } from '../src/lib/mask';
import { serializeRows } from '../src/lib/serialize';

let sharedPool;
export const getServerSideProps = requireAuthPage(async (context) => {
  sharedPool = sharedPool || createPool();
  const { eventType, from, to } = context.query;
  const rows = await listConsentEvents(sharedPool, { eventType, from, to, limit: 200 });
  return {
    props: {
      rows: serializeRows(rows).map((r) => ({ ...r, user_id: maskIdentifier(r.user_id) })),
      filters: { eventType: eventType || '', from: from || '', to: to || '' },
    },
  };
});

export default function ConsentEvents({ rows, filters }) {
  const [form, setForm] = useState(filters);
  const exportHref = `/api/consent-events/export?${new URLSearchParams(Object.entries(form).filter(([, v]) => v)).toString()}`;

  return (
    <div className="shell">
      <Head>
        <title>Consent &amp; Data Events — Monitoring Services</title>
      </Head>
      <Nav activePage="consent-events" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">Compliance Record</p>
            <h1 className="page-title">Consent &amp; Data Events</h1>
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
                <th>User</th>
                <th>Purpose</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="col-time">{new Date(r.time).toLocaleString()}</td>
                  <td>{r.user_id}</td>
                  <td>{r.purpose}</td>
                  <td>{r.event_type}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={4}>No consent events match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
