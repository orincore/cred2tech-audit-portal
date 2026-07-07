// pg returns TIMESTAMPTZ columns (and any other timestamp-typed column, regardless
// of its name — e.g. `time` on pm2_health/system_health, `ran_at` on backup_status)
// as native JS Date objects. Next.js's getServerSideProps requires plain
// JSON-serializable props and explicitly rejects Date instances (throws
// "Error serializing ... Date objects are not supported"), even though
// JSON.stringify/res.json() would happily coerce them via Date#toJSON. This
// walks every field on every row — not just a hardcoded `time` key — and
// converts any Date value to an ISO string so pages using getServerSideProps
// never crash once a table has real rows.
function serializeRows(rows) {
  return rows.map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value instanceof Date ? value.toISOString() : value;
    }
    return out;
  });
}

module.exports = { serializeRows };
