import api from '../api/api';

export const branchService = {
  // Obtener todas las sedes
  getBranches: async () => {
    try {
      const response = await api.get('/branches');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener sede por ID
  getBranchById: async (branchId) => {
    try {
      const response = await api.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nueva sede (solo ADMIN)
  createBranch: async (branchData) => {
    try {
      const response = await api.post('/branches', branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar sede (solo ADMIN)
  updateBranch: async (branchId, branchData) => {
    try {
      const response = await api.put(`/branches/${branchId}`, branchData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar sede (solo ADMIN)
  deleteBranch: async (branchId) => {
    try {
      await api.delete(`/branches/${branchId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },
};
