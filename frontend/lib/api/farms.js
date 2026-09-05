import { apiClient } from './client';

export const farmsApi = {
  getFarms: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/farms${query ? `?${query}` : ''}`);
  },
  getFarmById: async (farmId) => {
    return apiClient.get(`/farms/${farmId}`);
  },
  createFarm: async (farmData) => {
    return apiClient.post('/farms', farmData);
  },
  updateFarm: async (farmId, farmData) => {
    return apiClient.put(`/farms/${farmId}`, farmData);
  },
  deleteFarm: async (farmId) => {
    return apiClient.delete(`/farms/${farmId}`);
  },
  getCropsByFarm: async (farmId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/farms/${farmId}/crops${query ? `?${query}` : ''}`);
  },
  addCropToFarm: async (farmId, cropData) => {
    return apiClient.post(`/farms/${farmId}/crops`, cropData);
  },
};
