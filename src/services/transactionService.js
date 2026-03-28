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

const EXPORT_ALLOWED_FORMATS = new Set(['csv', 'pdf']);

const normalizeExportFormat = (format) => {
  const normalizedFormat = String(format || 'csv').toLowerCase();
  return EXPORT_ALLOWED_FORMATS.has(normalizedFormat) ? normalizedFormat : 'csv';
};

const buildTransactionExportParams = (params = {}) => {
  const {
    format,
    page,
    pageSize,
    page_size,
    ...rest
  } = params;

  const normalizedParams = {
    format: normalizeExportFormat(format),
  };

  Object.entries(rest).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;

    if (key === 'order_desc') {
      if (typeof value === 'string') {
        normalizedParams.order_desc = value.toLowerCase() === 'true';
        return;
      }
      normalizedParams.order_desc = Boolean(value);
      return;
    }

    normalizedParams[key] = value;
  });

  return normalizedParams;
};

const buildExportFallbackFileName = (format) => {
  const now = new Date();
  const twoDigits = (value) => String(value).padStart(2, '0');

  const fileDate = [
    now.getFullYear(),
    twoDigits(now.getMonth() + 1),
    twoDigits(now.getDate()),
  ].join('');

  const fileTime = [
    twoDigits(now.getHours()),
    twoDigits(now.getMinutes()),
  ].join('');

  return `operaciones_${fileDate}_${fileTime}.${format}`;
};

const triggerBrowserDownload = (blob, fileName) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

const tryParseJsonBlob = async (value) => {
  if (!(value instanceof Blob)) return null;

  const contentType = String(value.type || '').toLowerCase();
  const looksLikeJson = contentType.includes('application/json') || contentType.includes('application/problem+json');
  if (!looksLikeJson) return null;

  try {
    const rawContent = await value.text();
    return JSON.parse(rawContent);
  } catch {
    return null;
  }
};

const normalizeBlobErrorResponse = async (error) => {
  if (!error?.response?.data) return error;

  const parsedData = await tryParseJsonBlob(error.response.data);
  if (parsedData) {
    error.response.data = parsedData;
  }

  return error;
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

  // Export transactions as csv or pdf using current filters (no pagination)
  exportTransactions: async (params = {}) => {
    try {
      const exportParams = buildTransactionExportParams(params);
      const response = await api.get('/transactions/export', {
        params: exportParams,
        responseType: 'blob',
      });

      const requestedFormat = exportParams.format || 'csv';
      const contentType = response.headers['content-type'] || response.data?.type || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'] || '';
      const fileName = parseContentDispositionFileName(contentDisposition) || buildExportFallbackFileName(requestedFormat);

      return {
        blob: response.data,
        contentType,
        fileName,
      };
    } catch (error) {
      throw await normalizeBlobErrorResponse(error);
    }
  },

  // Export transactions and trigger browser file download
  downloadTransactionsExport: async (params = {}) => {
    try {
      const { blob, fileName } = await transactionService.exportTransactions(params);
      triggerBrowserDownload(blob, fileName);
      return { fileName };
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
