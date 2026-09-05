'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, setAuthToken } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to decode basic JWT claims without external library
  const parseJwt = (tokenStr) => {
    try {
      const base64Url = tokenStr.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    const storedToken = getAuthToken();

    if (storedToken) {
      setToken(storedToken);
      const decoded = parseJwt(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        // Verify token with backend /auth/me to restore complete profile
        try {
          const meRes = await authApi.getCurrentUser();
          const meUser = meRes.data?.user || meRes.data || meRes.user || decoded;
          setUser(meUser);
        } catch {
          // If token was rejected by backend, clear session
          setAuthToken(null);
          setToken(null);
          setUser(null);
        }
      } else {
        // Expired token
        setAuthToken(null);
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      const authToken = res.data?.token || res.token;
      const userData = res.data?.user || res.user || parseJwt(authToken);

      if (authToken) {
        setAuthToken(authToken);
        setToken(authToken);
        setUser(userData);
      }
      setIsLoading(false);
      return res;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (userDataInput) => {
    setIsLoading(true);
    try {
      const res = await authApi.signup(userDataInput);
      const authToken = res.data?.token || res.token;
      const userData = res.data?.user || res.user || (authToken ? parseJwt(authToken) : null);

      if (authToken) {
        setAuthToken(authToken);
        setToken(authToken);
        setUser(userData);
      }
      setIsLoading(false);
      return res;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
