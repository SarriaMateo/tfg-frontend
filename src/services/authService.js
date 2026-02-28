import api from '../api/api';

const SESSION_STORAGE_CLEAR_PREFIXES = ['itemsListState:'];

const clearSessionScopedUiState = () => {
  try {
    const keysToRemove = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key && SESSION_STORAGE_CLEAR_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup errors
  }
};

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
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
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearSessionScopedUiState();
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
    // Normalize role to uppercase before saving
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
