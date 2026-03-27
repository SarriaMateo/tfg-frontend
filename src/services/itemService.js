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

export const itemService = {
  // Get item by ID
  getItemById: async (itemId) => {
    try {
      const response = await api.get(`/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new item
  createItem: async (itemData) => {
    try {
      const response = await api.post(`/items`, itemData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update item
  updateItem: async (itemId, itemData) => {
    try {
      const response = await api.put(`/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete item
  deleteItem: async (itemId) => {
    try {
      await api.delete(`/items/${itemId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Upload or replace item image
  uploadItemImage: async (itemId, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/items/${itemId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete item image
  deleteItemImage: async (itemId) => {
    try {
      const response = await api.delete(`/items/${itemId}/image`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get item image binary
  getItemImage: async (itemId, cacheBuster) => {
    try {
      const params = cacheBuster ? { t: cacheBuster } : {};
      const response = await api.get(`/items/${itemId}/image`, {
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

  // List items with filters, search, sort and pagination
  listItems: async (params = {}) => {
    try {
      const response = await api.get('/items', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
