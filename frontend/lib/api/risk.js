import { apiClient } from './client';

export const riskApi = {
  getCropRisk: async (cropId) => {
    return apiClient.get(`/risk/crop/${cropId}`);
  },
  getFarmRisk: async (farmId) => {
    return apiClient.get(`/risk/farm/${farmId}`);
  },
};
