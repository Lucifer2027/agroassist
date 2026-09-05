const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const snowflakeDb = require('../src/database/snowflake');
const snowflakeService = require('../src/services/snowflake.service');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock Snowflake driver connection module
jest.mock('../src/database/snowflake', () => ({
  connectSnowflake: jest.fn().mockResolvedValue({ isUp: () => true }),
  executeQuery: jest.fn(),
  closeSnowflake: jest.fn().mockResolvedValue()
}));

describe('Phase 10 - Snowflake Analytics & Historical Data Platform', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', email: 'farmerB@test.com', role: 'farmer' };

  const validFarmId = '11111111-2222-3333-4444-555555555555';
  const validCropId = '66666666-7777-8888-9999-000000000000';

  let tokenA, tokenB;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Non-Blocking Decoupled Snowflake Synchronization', () => {
    it('should trigger background sync to Snowflake without throwing error if Snowflake fails', async () => {
      snowflakeDb.executeQuery.mockRejectedValueOnce(new Error('Snowflake temporary connection timeout'));

      // Trigger sync
      await expect(
        snowflakeService.syncOperationalDataToSnowflake('DISEASE_ANALYSIS', {
          id: 'analysis-1',
          user_id: userA.id,
          farm_id: validFarmId,
          crop_id: validCropId,
          disease_name: 'Early Blight',
          confidence_score: 90,
          severity: 'medium',
          environmental_risk_level: 'high'
        })
      ).resolves.not.toThrow();
    });
  });

  describe('REST Endpoints GET /api/analytics/...', () => {
    it('should retrieve farm analytics from data warehouse', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id, farm_name: 'Punjab Farm' };
      const mockAnalytics = [{ farm_id: validFarmId, total_crops: 4, avg_disease_confidence: 88.5 }];

      mysqlDb.query.mockResolvedValueOnce([mockFarm]); // farm check
      snowflakeDb.executeQuery.mockResolvedValueOnce(mockAnalytics);

      const response = await request(app)
        .get(`/api/analytics/farm/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.farm_id).toBe(validFarmId);
      expect(response.body.data.total_crops).toBe(4);
    });

    it('should retrieve disease trends analytics', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockTrends = [{ farm_id: validFarmId, disease_name: 'Early Blight', total_occurrences: 3 }];

      mysqlDb.query.mockResolvedValueOnce([mockFarm]);
      snowflakeDb.executeQuery.mockResolvedValueOnce(mockTrends);

      const response = await request(app)
        .get(`/api/analytics/disease-trends/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].disease_name).toBe('Early Blight');
    });

    it('should retrieve weather-disease correlation analytics', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockCorrelation = [{ farm_id: validFarmId, avg_temperature: 28.5, avg_humidity: 78.0, disease_count: 5 }];

      mysqlDb.query.mockResolvedValueOnce([mockFarm]);
      snowflakeDb.executeQuery.mockResolvedValueOnce(mockCorrelation);

      const response = await request(app)
        .get(`/api/analytics/weather-correlation/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.avg_humidity).toBe(78.0);
    });

    it('should deny Farmer B from requesting Farmer A farm analytics (403)', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      mysqlDb.query.mockResolvedValueOnce([mockFarm]);

      const response = await request(app)
        .get(`/api/analytics/farm/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });
  });
});
