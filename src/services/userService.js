import api from '../api/api';

export const userService = {
  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all company users
  getUsersByCompany: async (params = {}) => {
    try {
      const response = await api.get(`/users`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post(`/users`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user (regular user only)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user (admin)
  updateUserAdmin: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}/admin`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },
};
