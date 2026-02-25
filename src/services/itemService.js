import api from '../api/api';

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

  // Create new item with image support
  createItem: async (itemData) => {
    try {
      // itemData should be FormData object for multipart/form-data support
      const response = await api.post(`/items`, itemData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update item with image support
  updateItem: async (itemId, itemData) => {
    try {
      // itemData should be FormData object for multipart/form-data support
      const response = await api.put(`/items/${itemId}`, itemData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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

  // Get item image
  getItemImage: async (itemId) => {
    try {
      const response = await api.get(`/items/${itemId}/image`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
