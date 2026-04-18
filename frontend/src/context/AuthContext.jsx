import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const getStoredToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (err) {
      console.error('Oturum doğrulanamadı:', err);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // rememberMe=true → localStorage (kalıcı), false → sessionStorage (sekme kapanınca siler)
  const login = async (email, password, rememberMe = true) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    if (rememberMe) {
      localStorage.setItem('token', access_token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', access_token);
      localStorage.removeItem('token');
    }
    await fetchUser();
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    fetchUser,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
