/**
 * Formats a decimal number, removing trailing zeros and unnecessary decimals
 * Examples: 11.000 -> 11, 25.200 -> 25.2, 5.500 -> 5.5
 */
export const formatDecimal = (value) => {
  if (value === null || value === undefined) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  
  // Round to 3 decimal places (as per spec Decimal(10,3))
  const rounded = Math.round(num * 1000) / 1000;
  
  // Convert to string and remove trailing zeros
  const formatted = rounded.toFixed(3).replace(/\.?0+$/, '');
  
  return formatted || '0';
};

/**
 * Formats price with Euro symbol
 * Examples: 4.95 -> 4.95€, null -> -
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '-';
  const num = parseFloat(price);
  if (isNaN(num)) return '-';
  return `${num.toFixed(2)}€`;
};

/**
 * Formats unit display text
 * Examples: l -> L, ml -> mL, kg -> kg
 */
export const formatUnit = (unit) => {
  if (!unit) return unit;
  
  const unitMap = {
    l: 'L',
    ml: 'mL',
  };
  
  return unitMap[unit] || unit;
};
