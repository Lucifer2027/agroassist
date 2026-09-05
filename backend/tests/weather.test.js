const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const weatherClient = require('../src/integrations/weather/weatherClient');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock OpenWeatherMap Client
jest.mock('../src/integrations/weather/weatherClient', () => ({
  fetchCurrentWeatherFromApi: jest.fn(),
  fetchForecastWeatherFromApi: jest.fn()
}));

describe('Phase 7 - OpenWeatherMap Integration & Weather APIs', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', email: 'farmerB@test.com', role: 'farmer' };

  const validFarmId = '11111111-2222-3333-4444-555555555555';
  const noCoordsFarmId = '22222222-3333-4444-5555-666666666666';

  let tokenA, tokenB;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/weather/current/:farmId', () => {
    it('should retrieve current weather, store observation in MySQL, and return structured payload', async () => {
      const mockFarm = {
        id: validFarmId,
        user_id: userA.id,
        farm_name: 'Ludhiana Fields',
        latitude: 30.9010,
        longitude: 75.8573
      };

      const mockWeatherData = {
        temperature: 29.5,
        humidity: 68.0,
        rainfall: 0,
        wind_speed: 4.2,
        weather_condition: 'Clear',
        rain_probability: 10.0,
        weather_timestamp: new Date().toISOString()
      };

      const mockSavedRecord = {
        id: 'wx-rec-101',
        farm_id: validFarmId,
        latitude: 30.9010,
        longitude: 75.8573,
        ...mockWeatherData,
        created_at: new Date().toISOString()
      };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce({ affectedRows: 1 }) // weather record insert
        .mockResolvedValueOnce([mockSavedRecord]); // weather record findById

      weatherClient.fetchCurrentWeatherFromApi.mockResolvedValueOnce(mockWeatherData);

      const response = await request(app)
        .get(`/api/weather/current/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.temperature).toBe(29.5);
      expect(response.body.data.humidity).toBe(68.0);
      expect(response.body.data.weatherCondition).toBe('Clear');
      expect(weatherClient.fetchCurrentWeatherFromApi).toHaveBeenCalledWith(30.9010, 75.8573);
    });

    it('should reject request if farm has no geo-coordinates (400 Bad Request)', async () => {
      const mockFarmNoCoords = {
        id: noCoordsFarmId,
        user_id: userA.id,
        farm_name: 'No Location Farm',
        latitude: null,
        longitude: null
      };

      mysqlDb.query.mockResolvedValueOnce([mockFarmNoCoords]);

      const response = await request(app)
        .get(`/api/weather/current/${noCoordsFarmId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('MISSING_FARM_COORDINATES');
    });

    it('should deny unauthorized user from accessing weather for another farmer farm (403)', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      mysqlDb.query.mockResolvedValueOnce([mockFarm]);

      const response = await request(app)
        .get(`/api/weather/current/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });
  });

  describe('GET /api/weather/forecast/:farmId', () => {
    it('should retrieve weather forecast for owned farm', async () => {
      const mockFarm = {
        id: validFarmId,
        user_id: userA.id,
        farm_name: 'Ludhiana Fields',
        latitude: 30.9010,
        longitude: 75.8573
      };

      const mockForecastData = {
        city: 'Ludhiana',
        country: 'IN',
        forecastCount: 2,
        forecasts: [
          {
            timestamp: new Date().toISOString(),
            temperature: 28.0,
            temp_min: 24.0,
            temp_max: 30.0,
            humidity: 70,
            weather_condition: 'Rain',
            description: 'light rain',
            rainfall: 2.5,
            rain_probability: 80,
            wind_speed: 5.1
          }
        ]
      };

      mysqlDb.query.mockResolvedValueOnce([mockFarm]);
      weatherClient.fetchForecastWeatherFromApi.mockResolvedValueOnce(mockForecastData);

      const response = await request(app)
        .get(`/api/weather/forecast/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.city).toBe('Ludhiana');
      expect(response.body.data.forecasts).toHaveLength(1);
    });
  });
});
