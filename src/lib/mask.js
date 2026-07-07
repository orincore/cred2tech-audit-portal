function maskIdentifier(id) {
  const str = String(id ?? '');
  if (str.length <= 4) return '*'.repeat(str.length);
  return `${str.slice(0, 2)}${'*'.repeat(str.length - 4)}${str.slice(-2)}`;
}

module.exports = { maskIdentifier };
