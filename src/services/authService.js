import api from '../api/api';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMe: async (token) => {
    try {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setUser: (user) => {
    // Normalizar el rol a mayúsculas antes de guardar
    const normalizedUser = {
      ...user,
      role: user.role ? user.role.toUpperCase() : user.role,
    };
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
