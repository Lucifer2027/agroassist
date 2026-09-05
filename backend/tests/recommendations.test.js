const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const recommendationClient = require('../src/integrations/gemini/recommendationClient');
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

// Mock Gemini Recommendation Client
jest.mock('../src/integrations/gemini/recommendationClient', () => ({
  generateActionableRecommendations: jest.fn()
}));

// Mock Weather Service
jest.mock('../src/services/weather.service', () => ({
  getCurrentWeather: jest.fn().mockResolvedValue({
    temperature: 28.0,
    humidity: 75.0,
    rainfall: 0
  })
}));

describe('Phase 9 - Actionable Agricultural Recommendations APIs', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', email: 'farmerB@test.com', role: 'farmer' };

  const validFarmId = '11111111-2222-3333-4444-555555555555';
  const validCropId = '66666666-7777-8888-9999-000000000000';
  const validAnalysisId = '99999999-8888-7777-6666-555555555555';

  let tokenA, tokenB;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/recommendations', () => {
    it('should generate actionable recommendations using verified DB context', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id, farm_name: 'Punjab Farm', location: 'Ludhiana, Punjab' };
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato', crop_variety: 'Roma VF' };
      const mockAnalysis = {
        id: validAnalysisId,
        user_id: userA.id,
        farm_id: validFarmId,
        crop_id: validCropId,
        disease_name: 'Tomato Early Blight',
        confidence_score: 92.0,
        severity: 'medium',
        environmental_risk_level: 'high'
      };

      const mockGeminiText = JSON.stringify({
        recommendations: [
          'Prune affected lower branches to improve air circulation',
          'Follow local agricultural authority guidelines for copper-based fungicide spray'
        ],
        preventionSteps: [
          'Rotate crops with non-solanaceous crops for 2 years',
          'Avoid overhead sprinkler irrigation to keep leaves dry'
        ],
        treatmentSuggestions: [
          'Apply Chlorothalonil fungicide according to manufacturer product label instructions'
        ],
        timingSuggestions: [
          'Spray during early morning hours when wind speed is low'
        ]
      });

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]) // farm check in crop service
        .mockResolvedValueOnce([mockAnalysis]) // analysis check
        .mockResolvedValueOnce([]) // weather records check
        .mockResolvedValueOnce([mockCrop]) // crop check in risk service
        .mockResolvedValueOnce([mockFarm]) // farm check in risk service
        .mockResolvedValueOnce([mockAnalysis]) // disease check in risk service
        .mockResolvedValueOnce({ affectedRows: 1 }) // risk insert
        .mockResolvedValueOnce([{ id: 'risk-1', farm_id: validFarmId, crop_id: validCropId, risk_score: 55, risk_level: 'medium', risk_factors: '[]' }]) // risk findById
        .mockResolvedValue({ affectedRows: 1 }); // recommendation inserts

      recommendationClient.generateActionableRecommendations.mockResolvedValueOnce({
        rawResponse: mockGeminiText,
        attempt: 1
      });

      const response = await request(app)
        .post('/api/recommendations')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: validFarmId,
          cropId: validCropId,
          diseaseAnalysisId: validAnalysisId,
          language: 'en'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(2);
      expect(response.body.data.timingSuggestions).toContain('Spray during early morning hours when wind speed is low');
    });

    it('should reject recommendation request if user does not own disease analysis (403)', async () => {
      const mockAnalysisOwnerA = { id: validAnalysisId, user_id: userA.id };
      mysqlDb.query.mockResolvedValueOnce([mockAnalysisOwnerA]);

      const response = await request(app)
        .get(`/api/recommendations/${validAnalysisId}`)
        .set('Authorization', `Bearer ${tokenB}`); // User B requesting User A recommendations

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_ANALYSIS_ACCESS');
    });
  });
});
