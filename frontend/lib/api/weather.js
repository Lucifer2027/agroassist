import { apiClient } from './client';

export const weatherApi = {
  getCurrentWeather: async (farmId) => {
    return apiClient.get(`/weather/current/${farmId}`);
  },
  getForecastWeather: async (farmId) => {
    return apiClient.get(`/weather/forecast/${farmId}`);
  },
};
