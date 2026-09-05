const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const snowflakeDb = require('../src/database/snowflake');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock Snowflake database driver module
jest.mock('../src/database/snowflake', () => ({
  connectSnowflake: jest.fn().mockResolvedValue({ isUp: () => true }),
  executeQuery: jest.fn(),
  closeSnowflake: jest.fn().mockResolvedValue()
}));

describe('Phase 14 - Admin Analytics APIs using Snowflake Data Warehouse', () => {
  const adminUser = { id: '00000000-0000-0000-0000-000000000001', email: 'admin@agroassist.com', role: 'admin' };
  const farmerUser = { id: '11111111-1111-1111-1111-111111111111', email: 'farmer@agroassist.com', role: 'farmer' };

  let adminToken, farmerToken;

  beforeAll(() => {
    adminToken = jwt.sign(adminUser, env.JWT_SECRET, { expiresIn: '1h' });
    farmerToken = jwt.sign(farmerUser, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization Checks', () => {
    it('should deny unauthenticated access to admin endpoints (401)', async () => {
      const res = await request(app).get('/api/admin/analytics/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('AUTH_TOKEN_MISSING');
    });

    it('should deny access to users with role=farmer (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('should grant access to users with role=admin (200 OK)', async () => {
      snowflakeDb.executeQuery.mockResolvedValueOnce([{
        TOTAL_FARMERS: 12,
        TOTAL_FARMS: 20,
        TOTAL_CROPS: 35,
        TOTAL_ANALYSES: 80,
        AVG_CONFIDENCE: 89.25,
        AVG_RISK: 45.10
      }]);

      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalFarmers).toBe(12);
      expect(res.body.data.totalFarms).toBe(20);
      expect(res.body.data.totalCrops).toBe(35);
      expect(res.body.data.totalAnalyses).toBe(80);
      expect(res.body.data.averageConfidence).toBe(89.25);
      expect(res.body.data.averageRiskScore).toBe(45.10);
    });
  });

  describe('GET /api/admin/analytics/overview', () => {
    it('should return system-wide overview metrics via Snowflake', async () => {
      snowflakeDb.executeQuery.mockResolvedValueOnce([{
        TOTAL_FARMERS: 15,
        TOTAL_FARMS: 25,
        TOTAL_CROPS: 40,
        TOTAL_ANALYSES: 100,
        AVG_CONFIDENCE: 91.50,
        AVG_RISK: 38.20
      }]);

      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        totalFarmers: 15,
        totalFarms: 25,
        totalCrops: 40,
        totalAnalyses: 100,
        averageConfidence: 91.50,
        averageRiskScore: 38.20
      });
    });

    it('should fallback to MySQL operational database if Snowflake is unavailable', async () => {
      snowflakeDb.executeQuery.mockRejectedValueOnce(new Error('Snowflake connection error'));
      mysqlDb.query.mockResolvedValueOnce([{
        totalFarmers: 10,
        totalFarms: 18,
        totalCrops: 30,
        totalAnalyses: 60,
        averageConfidence: 85.00,
        averageRiskScore: 50.00
      }]);

      const res = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalFarmers).toBe(10);
      expect(res.body.data.averageConfidence).toBe(85.00);
    });
  });

  describe('GET /api/admin/analytics/diseases', () => {
    it('should return disease frequency, severity distribution, and trends with pagination', async () => {
      snowflakeDb.executeQuery
        .mockResolvedValueOnce([
          { diseaseName: 'Late Blight', count: 15, avgConfidence: 92.5 },
          { diseaseName: 'Powdery Mildew', count: 5, avgConfidence: 87.0 }
        ])
        .mockResolvedValueOnce([
          { severity: 'high', count: 12 },
          { severity: 'medium', count: 8 }
        ])
        .mockResolvedValueOnce([
          { avgConfidence: 91.125 }
        ]);

      const res = await request(app)
        .get('/api/admin/analytics/diseases?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.diseaseFrequency).toHaveLength(2);
      expect(res.body.data.diseaseFrequency[0].diseaseName).toBe('Late Blight');
      expect(res.body.data.severityDistribution).toEqual({
        low: 0,
        medium: 8,
        high: 12,
        critical: 0
      });
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalRecords: 2,
        totalPages: 1
      });
    });

    it('should fallback to MySQL query when Snowflake query fails', async () => {
      snowflakeDb.executeQuery.mockRejectedValueOnce(new Error('Snowflake warehouse offline'));
      mysqlDb.query
        .mockResolvedValueOnce([{ totalRecords: 1 }])
        .mockResolvedValueOnce([{ totalAnalyses: 10, avgConfidence: 90.0 }])
        .mockResolvedValueOnce([{ diseaseName: 'Leaf Spot', count: 10, avgConfidence: 90.0, lastDetected: '2026-09-01' }])
        .mockResolvedValueOnce([{ severity: 'medium', count: 10 }]);

      const res = await request(app)
        .get('/api/admin/analytics/diseases?disease=Leaf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.diseaseFrequency[0].diseaseName).toBe('Leaf Spot');
      expect(res.body.data.severityDistribution.medium).toBe(10);
    });
  });

  describe('GET /api/admin/analytics/risk', () => {
    it('should return risk distribution, average risk score, and risk trends', async () => {
      snowflakeDb.executeQuery
        .mockResolvedValueOnce([
          { riskLevel: 'high', count: 20, avgRiskScore: 78.5 },
          { riskLevel: 'low', count: 10, avgRiskScore: 22.0 }
        ])
        .mockResolvedValueOnce([
          { avgRiskScore: 59.67 }
        ])
        .mockResolvedValueOnce([
          { farmId: 'farm-1', cropId: 'crop-1', avgRiskScore: 78.5, maxRiskScore: 85.0, totalAssessments: 10, latestAssessment: '2026-09-04' }
        ]);

      const res = await request(app)
        .get('/api/admin/analytics/risk?riskLevel=high')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.riskDistribution).toHaveLength(2);
      expect(res.body.data.averageRiskScore).toBe(59.67);
      expect(res.body.data.riskTrends[0].farmId).toBe('farm-1');
    });
  });

  describe('GET /api/admin/analytics/weather', () => {
    it('should return weather summary and weather-disease correlations', async () => {
      snowflakeDb.executeQuery
        .mockResolvedValueOnce([
          { avgTemperature: 29.5, avgHumidity: 75.2, totalRainfall: 120.4, totalObservations: 45 }
        ])
        .mockResolvedValueOnce([
          { farmId: 'farm-101', avgTemperature: 29.5, avgHumidity: 75.2, totalRainfall: 120.4, diseaseCount: 8 }
        ]);

      const res = await request(app)
        .get('/api/admin/analytics/weather')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weatherSummary.avgTemperature).toBe(29.5);
      expect(res.body.data.weatherCorrelations[0].farmId).toBe('farm-101');
      expect(res.body.data.weatherCorrelations[0].diseaseCount).toBe(8);
    });
  });

  describe('GET /api/admin/analytics/crops', () => {
    it('should return crop disease trends and total crops analyzed', async () => {
      snowflakeDb.executeQuery
        .mockResolvedValueOnce([
          { totalCropsAnalyzed: 14 }
        ])
        .mockResolvedValueOnce([
          { cropId: 'crop-99', diseaseName: 'Rust', totalOccurrences: 12, avgConfidence: 94.0, avgRiskScore: 65.0 }
        ]);

      const res = await request(app)
        .get('/api/admin/analytics/crops?cropName=Wheat')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCropsAnalyzed).toBe(14);
      expect(res.body.data.cropDiseaseTrends[0].diseaseName).toBe('Rust');
    });
  });
});
