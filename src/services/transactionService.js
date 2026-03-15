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

  // Create a new transaction
  // body: { operation_type, branch_id, lines, description?, auto_complete? }
  createTransaction: async (data) => {
    try {
      const response = await api.post('/transactions', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing transaction (only PENDING)
  // body: { description?, lines?, auto_complete? }
  updateTransaction: async (transactionId, data) => {
    try {
      const response = await api.put(`/transactions/${transactionId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Complete a pending transaction
  completeTransaction: async (transactionId) => {
    try {
      const response = await api.post(`/transactions/${transactionId}/complete`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel a pending transaction
  // body: { cancel_reason? }
  cancelTransaction: async (transactionId, cancelReason) => {
    try {
      const body = cancelReason ? { cancel_reason: cancelReason } : {};
      const response = await api.post(`/transactions/${transactionId}/cancel`, body);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload or replace transaction document
  uploadTransactionDocument: async (transactionId, file) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.post(`/transactions/${transactionId}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get transaction document binary
  getTransactionDocument: async (transactionId) => {
    try {
      const response = await api.get(`/transactions/${transactionId}/document`, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] || response.data?.type || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'] || '';
      const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
      const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1].replace(/\"/g, '').trim()) : null;

      return {
        blob: response.data,
        contentType,
        fileName,
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete transaction document
  deleteTransactionDocument: async (transactionId) => {
    try {
      const response = await api.delete(`/transactions/${transactionId}/document`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
