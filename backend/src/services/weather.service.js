const farmService = require('./farm.service');
const weatherRecordRepository = require('../repositories/weatherRecord.repository');
const snowflakeService = require('./snowflake.service');
const { fetchCurrentWeatherFromApi, fetchForecastWeatherFromApi } = require('../integrations/weather/weatherClient');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

// Simple in-memory caching for weather data (10-minute TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

class WeatherService {
  clearCache() {
    weatherCache.clear();
  }

  getCached(key) {
    const cached = weatherCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      logger.info(`Weather Cache HIT for key: ${key}`);
      return cached.data;
    }
    if (cached) weatherCache.delete(key);
    return null;
  }

  setCache(key, data) {
    weatherCache.set(key, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
  }

  /**
   * Retrieves current weather observation for a farm, stores it in MySQL, and returns standard response
   */
  async getCurrentWeather(userId, farmId, userRole = 'farmer') {
    // Verify farm ownership
    const farm = await farmService.getFarmById(userId, farmId, userRole);

    if (farm.latitude === null || farm.longitude === null) {
      throw ApiError.badRequest(`Farm '${farm.farm_name}' has no geo-coordinates (latitude/longitude) set`, 'MISSING_FARM_COORDINATES');
    }

    const cacheKey = `weather_current_${farmId}`;
    const cachedData = this.getCached(cacheKey);
    if (cachedData) return cachedData;

    // Fetch current weather from OpenWeatherMap API
    const weatherData = await fetchCurrentWeatherFromApi(farm.latitude, farm.longitude);

    // Persist observation in MySQL database
    const savedRecord = await weatherRecordRepository.create({
      farm_id: farmId,
      latitude: farm.latitude,
      longitude: farm.longitude,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall,
      wind_speed: weatherData.wind_speed,
      weather_condition: weatherData.weather_condition,
      rain_probability: weatherData.rain_probability,
      weather_timestamp: weatherData.weather_timestamp
    });

    // Trigger non-blocking Snowflake analytics synchronization
    snowflakeService.syncOperationalDataToSnowflake('WEATHER_RECORD', savedRecord);

    const responsePayload = {
      id: savedRecord.id,
      farmId: savedRecord.farm_id,
      latitude: savedRecord.latitude,
      longitude: savedRecord.longitude,
      temperature: savedRecord.temperature,
      humidity: savedRecord.humidity,
      rainfall: savedRecord.rainfall,
      windSpeed: savedRecord.wind_speed,
      weatherCondition: savedRecord.weather_condition,
      rainProbability: savedRecord.rain_probability,
      weatherTimestamp: savedRecord.weather_timestamp,
      createdAt: savedRecord.created_at
    };

    this.setCache(cacheKey, responsePayload);
    return responsePayload;
  }

  /**
   * Retrieves 5-day / 3-hour weather forecast for a farm
   */
  async getForecastWeather(userId, farmId, userRole = 'farmer') {
    // Verify farm ownership
    const farm = await farmService.getFarmById(userId, farmId, userRole);

    if (farm.latitude === null || farm.longitude === null) {
      throw ApiError.badRequest(`Farm '${farm.farm_name}' has no geo-coordinates (latitude/longitude) set`, 'MISSING_FARM_COORDINATES');
    }

    const cacheKey = `weather_forecast_${farmId}`;
    const cachedData = this.getCached(cacheKey);
    if (cachedData) return cachedData;

    // Fetch weather forecast from OpenWeatherMap API
    const forecastData = await fetchForecastWeatherFromApi(farm.latitude, farm.longitude);

    const responsePayload = {
      farmId,
      farmName: farm.farm_name,
      latitude: farm.latitude,
      longitude: farm.longitude,
      ...forecastData
    };

    this.setCache(cacheKey, responsePayload);
    return responsePayload;
  }
}

module.exports = new WeatherService();
