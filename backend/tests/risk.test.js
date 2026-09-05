const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const riskEngine = require('../src/services/risk/riskEngine.service');
const weatherService = require('../src/services/weather.service');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock Weather Service to avoid real HTTP calls during tests
jest.mock('../src/services/weather.service', () => ({
  getCurrentWeather: jest.fn().mockResolvedValue({
    temperature: 28.0,
    humidity: 75.0,
    rainfall: 0,
    windSpeed: 3.5,
    weatherCondition: 'Clouds',
    rainProbability: 20
  })
}));

describe('Phase 8 - Deterministic Agricultural Risk Calculation Engine', () => {
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

  describe('Pure RiskEngine Unit Tests (Deterministic Logic)', () => {
    it('should calculate LOW risk for healthy crop with ideal weather', () => {
      const weather = { humidity: 55, temperature: 22, rain_probability: 10, rainfall: 0 };
      const result = riskEngine.calculateRisk(null, weather, { crop_name: 'Wheat' });

      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.riskFactors).toContain('No recent disease scan on record');
    });

    it('should calculate MEDIUM risk for moderate disease severity & humidity', () => {
      const disease = {
        disease_name: 'Early Blight',
        confidence_score: 80,
        severity: 'medium', // 22 * 0.8 = 17.6
        environmental_risk_level: 'medium' // + 8 = 25.6
      };
      const weather = { humidity: 75, temperature: 24, rain_probability: 20, rainfall: 0 }; // +10 = 35.6 -> 36

      const result = riskEngine.calculateRisk(disease, weather, { crop_name: 'Tomato' });

      expect(result.riskScore).toBe(36);
      expect(result.riskLevel).toBe('medium');
      expect(result.riskFactors.some((f) => f.includes('Early Blight'))).toBe(true);
    });

    it('should calculate HIGH / CRITICAL risk for high severity disease with severe weather', () => {
      const disease = {
        disease_name: 'Late Blight',
        confidence_score: 95,
        severity: 'high', // 35 * 0.95 = 33.25
        environmental_risk_level: 'high' // + 15 = 48.25
      };
      const weather = { humidity: 90, temperature: 38, rain_probability: 80, rainfall: 15 }; // +18 + 17 + 15 = 50 -> total 98

      const result = riskEngine.calculateRisk(disease, weather, { crop_name: 'Potato' });

      expect(result.riskScore).toBe(98);
      expect(result.riskLevel).toBe('critical');
      expect(result.riskFactors.length).toBeGreaterThan(3);
    });

    it('should strictly cap score at 100 on boundary values', () => {
      const disease = { disease_name: 'Fungal Infection', confidence_score: 100, severity: 'high', environmental_risk_level: 'high' };
      const weather = { humidity: 95, temperature: 40, rain_probability: 100, rainfall: 50 };

      const result = riskEngine.calculateRisk(disease, weather, { crop_name: 'Tomato' });

      expect(result.riskScore).toBe(100);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle missing weather data gracefully without crashing', () => {
      const disease = { disease_name: 'Leaf Curl', confidence_score: 70, severity: 'medium', environmental_risk_level: 'low' };
      const result = riskEngine.calculateRisk(disease, null, { crop_name: 'Cotton' });

      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.riskFactors).toContain('Weather observation unavailable for farm location');
    });
  });

  describe('REST Endpoints GET /api/risk/crop/:cropId & GET /api/risk/farm/:farmId', () => {
    it('should calculate crop risk and persist in MySQL database', async () => {
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato' };
      const mockFarm = { id: validFarmId, user_id: userA.id, farm_name: 'Green Acres', latitude: 30.9, longitude: 75.8 };
      const mockSavedRiskRecord = {
        id: 'risk-rec-1',
        farm_id: validFarmId,
        crop_id: validCropId,
        disease_analysis_id: null,
        risk_score: 45,
        risk_level: 'medium',
        risk_factors: JSON.stringify(['Elevated humidity']),
        calculated_at: new Date().toISOString()
      };

      mysqlDb.query
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([]) // disease analyses check
        .mockResolvedValueOnce({ affectedRows: 1 }) // risk record insert
        .mockResolvedValueOnce([mockSavedRiskRecord]); // risk record findById

      const response = await request(app)
        .get(`/api/risk/crop/${validCropId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.riskScore).toBe(45);
      expect(response.body.data.riskLevel).toBe('medium');
    });

    it('should deny unauthorized farmer from viewing risk of another farmer crop (403)', async () => {
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Maize' };
      const mockFarm = { id: validFarmId, user_id: userA.id };

      mysqlDb.query
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]); // farm check (user_id is userA)

      const response = await request(app)
        .get(`/api/risk/crop/${validCropId}`)
        .set('Authorization', `Bearer ${tokenB}`); // User B requesting User A crop risk

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });
  });
});
