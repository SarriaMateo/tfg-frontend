import api from '../api/api';

export const companyService = {
  getCompanyInfo: async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
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

  getCompanyBranches: async (companyId) => {
    try {
      const response = await api.get(`/branches/company/${companyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
