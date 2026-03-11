import api from '../api/api';

export const transactionService = {
  // Get transaction by ID
  getTransactionById: async (transactionId) => {
    try {
      const response = await api.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // List transactions with filters, sorting and pagination
  listTransactions: async (params = {}) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
