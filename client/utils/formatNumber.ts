export const formatNumber = (value: string | number | undefined | null, decimals = 2) => {
  if (value === undefined || value === null || value === '') return '0';

  const num = typeof value === 'string' ? Number(value) : Number(value);
  if (Number.isNaN(num)) return '0';

  const fixed = num.toFixed(decimals);
  // Add thousands separators
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Trim trailing zeros in decimal portion if decimals > 0
  if (decimals > 0) {
    parts[1] = parts[1].replace(/0+$/, '');
    if (parts[1] === '') return parts[0];
  }

  return parts.join('.');
};
