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

describe('Phase 13 - Printable AI Crop Health PDF Report APIs', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', first_name: 'Rajesh', last_name: 'Kumar', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', first_name: 'Suresh', last_name: 'Singh', email: 'farmerB@test.com', role: 'farmer' };

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

  describe('GET /api/reports/analysis/:analysisId/pdf', () => {
    it('should generate and stream a printable PDF report for an authorized farmer', async () => {
      const mockAnalysis = {
        id: validAnalysisId,
        user_id: userA.id,
        farm_id: validFarmId,
        crop_id: validCropId,
        cloudinary_asset_id: null,
        disease_name: 'Tomato Early Blight',
        confidence_score: 95.0,
        severity: 'high',
        environmental_risk_level: 'high',
        symptoms: JSON.stringify(['Dark concentric leaf spots']),
        recommendations: JSON.stringify(['Apply copper fungicide spray']),
        prevention_steps: JSON.stringify(['Rotate crops every 2 years']),
        treatment_suggestions: JSON.stringify(['Prune lower branches']),
        created_at: new Date().toISOString()
      };

      const mockFarm = { id: validFarmId, user_id: userA.id, farm_name: 'Punjab Green Acres', location: 'Ludhiana', soil_type: 'Loam' };
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato', crop_variety: 'Roma VF' };

      mysqlDb.query
        .mockResolvedValueOnce([mockAnalysis]) // analysis check
        .mockResolvedValueOnce([userA]) // user check
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([]) // weather list
        .mockResolvedValueOnce([]); // risk list

      const response = await request(app)
        .get(`/api/reports/analysis/${validAnalysisId}/pdf`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain(`attachment; filename="agroassist_report_${validAnalysisId}.pdf"`);
      expect(response.body).toBeDefined();
    });

    it('should deny unauthorized farmer from downloading PDF report (403)', async () => {
      const mockAnalysisOwnerA = {
        id: validAnalysisId,
        user_id: userA.id
      };

      mysqlDb.query.mockResolvedValueOnce([mockAnalysisOwnerA]);

      const response = await request(app)
        .get(`/api/reports/analysis/${validAnalysisId}/pdf`)
        .set('Authorization', `Bearer ${tokenB}`); // User B requesting User A report

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_REPORT_ACCESS');
    });

    it('should return 404 Not Found for non-existent analysis report ID', async () => {
      mysqlDb.query.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/reports/analysis/non-existent-analysis-id/pdf')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(404);
      expect(response.body.errorCode).toBe('ANALYSIS_NOT_FOUND');
    });
  });
});
