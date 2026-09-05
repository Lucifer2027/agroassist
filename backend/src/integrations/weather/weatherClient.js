const axios = require('axios');
const weatherConfig = require('../../config/weather.config');
const { logger } = require('../../utils/logger');
const { ApiError, WeatherAPIError } = require('../../utils/apiError');

/**
 * Fetches current weather from OpenWeatherMap API with retries and timeout
 */
const fetchCurrentWeatherFromApi = async (lat, lon, maxRetries = 2, timeoutMs = 10000) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    throw ApiError.badRequest('Farm geo-coordinates (latitude and longitude) are required for weather retrieval', 'MISSING_COORDINATES');
  }

  const url = `${weatherConfig.baseUrl}/weather`;
  const params = {
    lat,
    lon,
    units: 'metric',
    appid: weatherConfig.apiKey
  };

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      logger.info(`Fetching current weather from OpenWeatherMap for (${lat}, ${lon}) - Attempt ${attempt}`);
      const response = await axios.get(url, { params, timeout: timeoutMs });

      const data = response.data;

      return {
        temperature: data.main?.temp ?? null,
        humidity: data.main?.humidity ?? null,
        rainfall: data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0,
        wind_speed: data.wind?.speed ?? null,
        weather_condition: data.weather?.[0]?.main ?? null,
        rain_probability: data.pop !== undefined && data.pop !== null ? data.pop * 100 : null,
        weather_timestamp: data.dt ? new Date(data.dt * 1000).toISOString() : new Date().toISOString()
      };
    } catch (err) {
      lastError = err;
      logger.warn(`OpenWeatherMap current weather attempt ${attempt} failed: ${err.message}`);

      if (attempt <= maxRetries && err.code !== 'ECONNABORTED') {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new WeatherAPIError(`Weather service request failed: ${lastError.message}`, 'WEATHER_API_FAILED');
};

/**
 * Fetches 5-day / 3-hour forecast weather from OpenWeatherMap API
 */
const fetchForecastWeatherFromApi = async (lat, lon, maxRetries = 2, timeoutMs = 10000) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    throw ApiError.badRequest('Farm geo-coordinates (latitude and longitude) are required for weather forecast', 'MISSING_COORDINATES');
  }

  const url = `${weatherConfig.baseUrl}/forecast`;
  const params = {
    lat,
    lon,
    units: 'metric',
    appid: weatherConfig.apiKey
  };

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      logger.info(`Fetching weather forecast from OpenWeatherMap for (${lat}, ${lon}) - Attempt ${attempt}`);
      const response = await axios.get(url, { params, timeout: timeoutMs });

      const data = response.data;
      const forecastList = (data.list || []).map((item) => ({
        timestamp: item.dt ? new Date(item.dt * 1000).toISOString() : null,
        temperature: item.main?.temp ?? null,
        temp_min: item.main?.temp_min ?? null,
        temp_max: item.main?.temp_max ?? null,
        humidity: item.main?.humidity ?? null,
        weather_condition: item.weather?.[0]?.main ?? null,
        description: item.weather?.[0]?.description ?? null,
        rainfall: item.rain?.['3h'] ?? 0,
        rain_probability: item.pop !== undefined && item.pop !== null ? Math.round(item.pop * 100) : 0,
        wind_speed: item.wind?.speed ?? null
      }));

      return {
        city: data.city?.name ?? null,
        country: data.city?.country ?? null,
        forecastCount: forecastList.length,
        forecasts: forecastList
      };
    } catch (err) {
      lastError = err;
      logger.warn(`OpenWeatherMap forecast attempt ${attempt} failed: ${err.message}`);

      if (attempt <= maxRetries && err.code !== 'ECONNABORTED') {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new WeatherAPIError(`Weather forecast service request failed: ${lastError.message}`, 'WEATHER_API_FAILED');
};

module.exports = {
  fetchCurrentWeatherFromApi,
  fetchForecastWeatherFromApi
};
