import api from '../api/api';

export const branchService = {
  // Get all branches
  getBranches: async (params = {}) => {
    try {
      const response = await api.get('/branches', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get branch by ID
  getBranchById: async (branchId) => {
    try {
      const response = await api.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new branch (ADMIN only)
  createBranch: async (branchData) => {
    try {
      const response = await api.post('/branches', branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update branch (ADMIN only)
  updateBranch: async (branchId, branchData) => {
    try {
      const response = await api.put(`/branches/${branchId}`, branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete branch (ADMIN only)
  deleteBranch: async (branchId) => {
    try {
      await api.delete(`/branches/${branchId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },
};
