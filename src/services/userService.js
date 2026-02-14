import api from '../api/api';

export const userService = {
  // Obtener usuario por ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los usuarios de una empresa
  getUsersByCompany: async () => {
    try {
      const response = await api.get(`/users`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo usuario
  createUser: async (userData) => {
    try {
      const response = await api.post(`/users`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar usuario (solo usuario normal)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar usuario (admin)
  updateUserAdmin: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}/admin`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar usuario
  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      return true;
    } catch (error) {
      throw error;
    }
  },
};
