// `<input type="datetime-local">` yields a naive string like "2026-08-03T14:30"
// with no timezone info. `new Date(...)` parses that as local wall-clock time
// (per spec, only the offset-less date-time form does this — date-only
// strings are parsed as UTC), so `.toISOString()` gives back the correct UTC
// instant. Sending the naive string straight to Postgres instead would get
// it parsed as UTC by the `time TIMESTAMPTZ` columns, silently shifting the
// query window by the browser's offset and making filtered queries return
// nothing whenever local time != UTC.
function toIsoIfDatetime(value) {
  if (!value) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function buildFilterParams(form) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    if (!value) continue;
    params.set(key, key === 'from' || key === 'to' ? toIsoIfDatetime(value) : value);
  }
  return params;
}

module.exports = { buildFilterParams, toIsoIfDatetime };
