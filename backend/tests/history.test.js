const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

describe('Phase 12 - Disease Analysis History & Advanced Search APIs', () => {
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

  describe('GET /api/analysis/history/:farmId', () => {
    it('should retrieve paginated, filtered analysis history for an owned farm', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id, farm_name: 'Punjab Farm' };
      const mockHistoryRows = [
        {
          analysisId: validAnalysisId,
          cropId: validCropId,
          diseaseName: 'Tomato Early Blight',
          confidence: 94.0,
          severity: 'high',
          risk: 'high',
          recommendationSummary: JSON.stringify(['Prune leaves']),
          date: new Date().toISOString(),
          cropName: 'Tomato',
          cropVariety: 'Roma VF',
          optimizedUrl: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg'
        }
      ];

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([{ total: 1 }]) // total count query
        .mockResolvedValueOnce(mockHistoryRows); // paginated history items

      const response = await request(app)
        .get(`/api/analysis/history/${validFarmId}?disease=Blight&severity=high&page=1&limit=10`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].disease).toBe('Tomato Early Blight');
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1
      });
    });

    it('should deny Farmer B from accessing Farmer A farm analysis history (403)', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      mysqlDb.query.mockResolvedValueOnce([mockFarm]);

      const response = await request(app)
        .get(`/api/analysis/history/${validFarmId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });

    it('should reject invalid severity filter value with 422 Validation Error', async () => {
      const response = await request(app)
        .get(`/api/analysis/history/${validFarmId}?severity=extreme_hazard`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(422);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/crops/:cropId/analysis-history', () => {
    it('should retrieve analysis history for a specific crop', async () => {
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato' };
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockHistoryRows = [
        {
          analysisId: validAnalysisId,
          cropId: validCropId,
          diseaseName: 'Tomato Early Blight',
          confidence: 90.0,
          severity: 'medium',
          risk: 'medium',
          recommendationSummary: JSON.stringify(['Water carefully']),
          date: new Date().toISOString(),
          cropName: 'Tomato',
          cropVariety: 'Roma',
          optimizedUrl: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg'
        }
      ];

      mysqlDb.query
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([{ total: 1 }]) // total count query
        .mockResolvedValueOnce(mockHistoryRows); // history items

      const response = await request(app)
        .get(`/api/crops/${validCropId}/analysis-history`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].crop.cropName).toBe('Tomato');
    });
  });
});
