import { useState } from 'react';
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
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Nav activePage="consent-events" />
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Consent & Data Events</h1>
        <a href={exportHref}>Export CSV</a>
        <table style={{ borderCollapse: 'collapse', marginTop: 16, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 4 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 4 }}>User</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Purpose</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Event</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 4 }}>{new Date(r.time).toLocaleString()}</td>
                <td style={{ padding: 4 }}>{r.user_id}</td>
                <td style={{ padding: 4 }}>{r.purpose}</td>
                <td style={{ padding: 4 }}>{r.event_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
