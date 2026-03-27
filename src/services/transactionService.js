import api from '../api/api';

const parseContentDispositionFileName = (contentDisposition) => {
  if (!contentDisposition || typeof contentDisposition !== 'string') return null;

  // RFC 5987 takes precedence when both filename and filename* are present.
  const encodedMatch = contentDisposition.match(/filename\*=([^;]+)/i);
  if (encodedMatch?.[1]) {
    const encodedValue = encodedMatch[1].trim();
    const withoutCharset = encodedValue.replace(/^UTF-8''/i, '').replace(/^"|"$/g, '');

    try {
      return decodeURIComponent(withoutCharset);
    } catch {
      return withoutCharset;
    }
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    const plainValue = plainMatch[1].trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');

    try {
      return decodeURIComponent(plainValue);
    } catch {
      return plainValue;
    }
  }

  return null;
};

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
  getTransactionDocument: async (transactionId, cacheBuster) => {
    try {
      const params = cacheBuster ? { t: cacheBuster } : {};
      const response = await api.get(`/transactions/${transactionId}/document`, {
        responseType: 'blob',
        params,
      });

      const contentType = response.headers['content-type'] || response.data?.type || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'] || '';
      const fileName = parseContentDispositionFileName(contentDisposition);

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
