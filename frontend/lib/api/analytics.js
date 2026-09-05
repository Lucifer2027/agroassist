import { apiClient } from './client';

export const analyticsApi = {
  getFarmAnalytics: async (farmId) => {
    return apiClient.get(`/analytics/farm/${farmId}`);
  },
  getCropAnalytics: async (cropId) => {
    return apiClient.get(`/analytics/crop/${cropId}`);
  },
  getDiseaseTrends: async (farmId) => {
    return apiClient.get(`/analytics/disease-trends/${farmId}`);
  },
  getRiskAnalytics: async (farmId) => {
    return apiClient.get(`/analytics/risk/${farmId}`);
  },
  getWeatherCorrelation: async (farmId) => {
    return apiClient.get(`/analytics/weather-correlation/${farmId}`);
  },
  getAdminOverview: async () => {
    return apiClient.get('/admin/analytics/overview');
  },
  getAdminDiseases: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/analytics/diseases${query ? `?${query}` : ''}`);
  },
};
