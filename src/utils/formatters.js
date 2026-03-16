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
 * Unit mappings for different display formats
 */
const UNIT_MAPPINGS = {
  // API format -> Extended Spanish format
  extended: {
    ud: 'Unidad',
    kg: 'Kilogramo',
    g: 'Gramo',
    l: 'Litro',
    ml: 'Mililitro',
    m: 'Metro',
    m2: 'Metro cuadrado',
    box: 'Caja',
    pack: 'Pack',
  },
  // API format -> Short display format
  short: {
    ud: 'ud',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'mL',
    m: 'm',
    m2: 'm²',
    box: 'caja',
    pack: 'pack',
  },
};

/**
 * Array of units for use in select dropdowns
 * Format: { value: 'api_value', label: 'Extended Spanish' }
 */
export const UNIT_OPTIONS = [
  { value: 'ud', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'm', label: 'Metro' },
  { value: 'm2', label: 'Metro cuadrado' },
  { value: 'box', label: 'Caja' },
  { value: 'pack', label: 'Pack' },
];

/**
 * Formats unit to extended Spanish format (for selects and detail pages)
 * Examples: ud -> Unidades, kg -> Kilogramos, l -> Litros
 */
export const formatUnitExtended = (unit) => {
  if (!unit) return unit;
  return UNIT_MAPPINGS.extended[unit] || unit;
};

/**
 * Formats unit to short display format (for tables and stock columns)
 * Examples: l -> L, ml -> mL, box -> caja
 */
export const formatUnitShort = (unit) => {
  if (!unit) return unit;
  return UNIT_MAPPINGS.short[unit] || unit;
};

/**
 * Formats unit for API calls (returns original value)
 * This function exists for consistency and future-proofing
 * Examples: Unidades -> ud, Litros -> l (if needed for reverse mapping)
 */
export const formatUnitForAPI = (unit) => {
  // For now, values are already in API format
  // This could be extended to handle reverse mapping if needed
  return unit;
};

/**
 * @deprecated Use formatUnitShort instead
 * Formats unit display text
 * Examples: l -> L, ml -> mL, kg -> kg
 */
export const formatUnit = (unit) => {
  return formatUnitShort(unit);
};
