// Predefined color palette for categories (3x3 grid)
export const CATEGORY_COLORS = [
  { hex: '#D6336C', name: 'Rojo frambuesa' },
  { hex: '#E8590C', name: 'Naranja' },
  { hex: '#B08900', name: 'Mostaza' },
  { hex: '#2B8A3E', name: 'Verde' },
  { hex: '#0B7285', name: 'Cian petróleo' },
  { hex: '#364FC7', name: 'Azul intenso' },
  { hex: '#7048E8', name: 'Violeta' },
  { hex: '#A61E4D', name: 'Burdeos' },
  { hex: '#495057', name: 'Gris grafito' },
];

// Dashboard chart colors
export const DASHBOARD_COLORS = {
  // Transaction line colors - Incoming (blue)
  transactions: {
    incoming: {
      IN: '#023E8A',
      TRANSFER: '#0096C7',
      ADJUSTMENT: '#90E0EF',
    },
    outgoing: {
      OUT: '#ff4d00',
      TRANSFER: '#ff9a00',
      ADJUSTMENT: '#ffc100',
    },
  },
  // Stock status colors
  stock: {
    zero: '#FF6B6B',     // Red
    low: '#FFC107',      // Amber/Yellow
    healthy: '#51CF66',  // Green
  },
  // Transaction status colors for table rows
  transactionStatus: {
    COMPLETE: '#E8F5E9', // Light green
    PENDING: '#FFF8E1',  // Light yellow
    TRANSIT: '#E3F2FD',  // Light blue
    CANCELLED: '#F5F5F5', // Light gray
  },
  // Alert colors
  alerts: {
    zeroStock: '#FF6B6B',      // Red
    lowStock: '#FFC107',        // Amber
    pendingStale: '#FFC107',    // Amber
    transitStale: '#90CAF9',    // Light blue
  },
};

