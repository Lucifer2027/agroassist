import { apiClient } from './client';

export const analysisApi = {
  executeCompleteAnalysis: async (payload) => {
    return apiClient.post('/analysis', payload);
  },
  analyzeDisease: async (payload) => {
    return apiClient.post('/analysis/disease', payload);
  },
  getFarmAnalysisHistory: async (farmId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/analysis/history/${farmId}${query ? `?${query}` : ''}`);
  },
  getAnalysisById: async (analysisId) => {
    return apiClient.get(`/analysis/${analysisId}`);
  },
};
