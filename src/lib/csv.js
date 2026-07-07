function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((col) => escapeCsvCell(row[col])).join(','));
  return [header, ...lines].join('\n');
}

module.exports = { toCsv, escapeCsvCell };
