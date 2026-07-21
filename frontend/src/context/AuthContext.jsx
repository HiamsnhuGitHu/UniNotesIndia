import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const hasJustLoggedIn = useRef(false);

  const login = async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    const { token: jwt, user: userDetails } = response.data;
    hasJustLoggedIn.current = true;
    setToken(jwt);
    setUser(userDetails);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userDetails));
    return response.data;
  };

  const register = async (registerData) => {
    const response = await api.post('/api/auth/register', registerData);
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('selectedUni');
    sessionStorage.removeItem('selectedBranch');
    sessionStorage.removeItem('selectedSem');
    sessionStorage.removeItem('selectedSubject');
    sessionStorage.removeItem('activeNote');
    // Soft redirect rather than hard window redirect to avoid routing loops
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        if (hasJustLoggedIn.current) {
          hasJustLoggedIn.current = false;
          return;
        }
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
    };
    fetchCurrentUser();
  }, [token]);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
