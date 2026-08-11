// Reduces an Error to its message alone before logging (e.g. `err.message`)
// and you lose the stack trace plus, for node-postgres errors, the fields
// that actually explain WHAT went wrong (code/detail/table/constraint/etc.)
// — "permission denied for table purge_events" with no code or table name
// took a live debugging session to root-cause. Log the full shape instead.
function errorDetails(err) {
  if (!err) return { message: 'unknown error' };
  if (!(err instanceof Error)) return { message: String(err) };
  const details = { message: err.message, stack: err.stack };
  for (const key of ['code', 'detail', 'hint', 'schema', 'table', 'column', 'constraint', 'routine']) {
    if (err[key] !== undefined && err[key] !== null) details[key] = err[key];
  }
  return details;
}

module.exports = { errorDetails };
