import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { translateError } from '../utils/errorTranslator';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeUserData = (userData) => {
    // Normalizar el rol a mayúsculas
    if (userData.role) {
      userData.role = userData.role.toUpperCase();
    }
    return userData;
  };

  // Inicializar desde localStorage
  useEffect(() => {
    const storedToken = authService.getToken();
    const storedUser = authService.getUser();
    if (storedToken && storedUser) {
      const normalizedUser = normalizeUserData(storedUser);
      setToken(storedToken);
      setUser(normalizedUser);
    }
    setLoading(false);
  }, []);

  // Actualizar header de API cuando cambia el token
  useEffect(() => {
    if (token) {
      authService.setToken(token);
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      // Limpiar cualquier sesión anterior antes de hacer login
      authService.logout();
      setUser(null);
      setToken(null);

      const { access_token, token_type } = await authService.login(
        username,
        password
      );

      // Obtener información del usuario
      let userData = await authService.getMe(access_token);
      
      // Normalizar datos del usuario
      userData = normalizeUserData(userData);

      // Guardar token y usuario
      authService.setToken(access_token);
      authService.setUser(userData);

      setToken(access_token);
      setUser(userData);

      return userData;
    } catch (err) {
      const translatedError = translateError(err);
      setError(translatedError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const updateUser = (updatedUserData) => {
    // Normalizar y actualizar el usuario en el estado y localStorage
    const normalizedUser = normalizeUserData({ ...user, ...updatedUserData });
    setUser(normalizedUser);
    authService.setUser(normalizedUser);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
