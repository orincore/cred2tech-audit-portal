// pino's error serializer (and most services' own error-logging paths) nest
// the stack under meta.err / meta.error rather than at the top level, so
// pull it out specifically and surface it above the raw JSON dump — that's
// almost always the one thing worth reading first when debugging a failure.
function extractStack(meta) {
  if (!meta) return null;
  return meta.err?.stack || meta.error?.stack || meta.stack || null;
}

export default function LogDetailPanel({ row, messageField }) {
  const stack = extractStack(row.meta);
  const fullMessage = row[messageField];

  return (
    <div className="log-detail">
      <div className="log-detail-section">
        <span className="log-detail-label">Full message</span>
        <pre className="log-detail-pre">{fullMessage || '—'}</pre>
      </div>
      {stack && (
        <div className="log-detail-section">
          <span className="log-detail-label">Error stack</span>
          <pre className="log-detail-pre log-detail-stack">{stack}</pre>
        </div>
      )}
      <div className="log-detail-section">
        <span className="log-detail-label">Full record (meta + fields)</span>
        <pre className="log-detail-pre">{JSON.stringify(row, null, 2)}</pre>
      </div>
    </div>
  );
}
