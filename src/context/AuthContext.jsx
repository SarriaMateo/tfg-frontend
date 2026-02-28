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
    // Normalize role to uppercase
    if (userData.role) {
      userData.role = userData.role.toUpperCase();
    }
    return userData;
  };

  // Initialize from localStorage
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

  // Update API header when token changes
  useEffect(() => {
    if (token) {
      authService.setToken(token);
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      // Clear any previous session before logging in
      authService.logout();
      setUser(null);
      setToken(null);

      const { access_token, token_type } = await authService.login(
        username,
        password
      );

      // Get user information
      let userData = await authService.getMe(access_token);
      
      // Normalize user data
      userData = normalizeUserData(userData);

      // Save token and user
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
    // Normalize and update user in state and localStorage
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
