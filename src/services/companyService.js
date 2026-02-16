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

  updateCompanyInfo: async (companyData) => {
    try {
      const body = {
        name: companyData.name,
        email: companyData.email
      };
      
      // NIF is only included if explicitly specified
      // If sent as null, backend will change it to null
      // If not sent, backend will not modify the NIF
      if (companyData.hasOwnProperty('nif')) {
        body.nif = companyData.nif;
      }

      const response = await api.put('/company', body);
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
