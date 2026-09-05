import { apiClient } from './client';

export const authApi = {
  login: async (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },
  signup: async (userData) => {
    return apiClient.post('/auth/register', userData);
  },
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },
  forgotPassword: async (emailData) => {
    return apiClient.post('/auth/forgot-password', emailData);
  },
  resetPassword: async (resetData) => {
    return apiClient.post('/auth/reset-password', resetData);
  },
};
