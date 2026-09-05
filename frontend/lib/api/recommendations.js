import { apiClient } from './client';

export const recommendationsApi = {
  generateRecommendations: async (payload) => {
    return apiClient.post('/recommendations', payload);
  },
  getRecommendationsByAnalysisId: async (analysisId) => {
    return apiClient.get(`/recommendations/${analysisId}`);
  },
};
