import { apiClient } from './client';

export const cropsApi = {
  getCropById: async (cropId) => {
    return apiClient.get(`/crops/${cropId}`);
  },
  updateCrop: async (cropId, cropData) => {
    return apiClient.put(`/crops/${cropId}`, cropData);
  },
  deleteCrop: async (cropId) => {
    return apiClient.delete(`/crops/${cropId}`);
  },
  getCropAnalysisHistory: async (cropId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/crops/${cropId}/analysis-history${query ? `?${query}` : ''}`);
  },
};
