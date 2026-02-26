import api from '../api/api';

export const categoryService = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get(`/categories`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    try {
      const response = await api.get(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    try {
      const response = await api.post(`/categories`, categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await api.put(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Assign categories to item
  assignCategoriesToItem: async (itemId, categoryIds) => {
    try {
      const normalizedIds = Array.isArray(categoryIds)
        ? categoryIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : [];
      const response = await api.post(`/items/${itemId}/categories`, normalizedIds);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get categories assigned to an item
  getItemCategories: async (itemId) => {
    try {
      const response = await api.get(`/items/${itemId}/categories`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
