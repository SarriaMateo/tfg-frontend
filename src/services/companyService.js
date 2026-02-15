import api from '../api/api';

export const companyService = {
  getCompanyInfo: async () => {
    try {
      const response = await api.get('/company');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBranchInfo: async (branchId) => {
    try {
      const response = await api.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCompanyBranches: async () => {
    try {
      const response = await api.get(`/branches`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createBranch: async (branchData) => {
    try {
      const response = await api.post(`/branches`, branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
