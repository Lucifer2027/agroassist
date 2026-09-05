const mockFarmId = '11111111-1111-1111-1111-111111111111';
const mockCropId = '22222222-2222-2222-2222-222222222222';
const mockAssetId = '33333333-3333-3333-3333-333333333333';
const mockAnalysisId = '44444444-4444-4444-4444-444444444444';
const mockPrimaryUserId = '00000000-0000-0000-0000-000000000001';

let mockCurrentAnalysisRecord = null;
let mockCurrentWeatherRecord = null;
let mockCurrentRiskRecord = null;

const mockFarmRecord = { id: mockFarmId, user_id: mockPrimaryUserId, farm_name: 'E2E Punjab Farm', location: 'Ludhiana, Punjab', latitude: 30.901, longitude: 75.8573, area: 10, area_unit: 'acres', soil_type: 'Loam' };
const mockCropRecord = { id: mockCropId, farm_id: mockFarmId, crop_name: 'Wheat', crop_variety: 'HD-2967', growth_stage: 'Tillering' };
const mockAssetRecord = {
  id: mockAssetId,
  user_id: mockPrimaryUserId,
  farm_id: mockFarmId,
  crop_id: mockCropId,
  public_id: 'agroassist/leaf_scan_e2e',
  original_url: 'https://res.cloudinary.com/agroassist/image/upload/v1/agroassist/leaf_scan_e2e.jpg',
  optimized_url: 'https://res.cloudinary.com/agroassist/image/upload/c_fit,h_600,w_800/e_sharpen:50/e_auto_contrast/f_auto/q_auto/v1/agroassist/leaf_scan_e2e.jpg'
};

const getCopy = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : null);

const mockQueryHandler = (sql) => {
  if (!sql) return [];
  if (sql.includes('INSERT INTO')) return [{ affectedRows: 1 }];
  if (sql.includes('COUNT(*)')) return [{ total: 1 }];
  if (sql.includes('FROM farms')) return [getCopy(mockFarmRecord)];
  if (sql.includes('FROM crops')) return [getCopy(mockCropRecord)];
  if (sql.includes('FROM cloudinary_assets')) return [getCopy(mockAssetRecord)];
  if (sql.includes('FROM weather_records')) return mockCurrentWeatherRecord ? [getCopy(mockCurrentWeatherRecord)] : [];
  if (sql.includes('FROM recommendations')) return [{ id: 'rec1', recommendation_text: 'Apply fungicide' }];
  if (sql.includes('FROM disease_analyses')) {
    if (sql.includes('WHERE crop_id = ?')) return [];
    if (!mockCurrentAnalysisRecord) return [];
    const rec = getCopy(mockCurrentAnalysisRecord);
    return [{
      ...rec,
      analysisId: rec.id,
      diseaseName: rec.disease_name,
      confidence: rec.confidence_score,
      risk: rec.environmental_risk_level,
      cropName: 'Wheat',
      cropVariety: 'HD-2967',
      optimizedUrl: mockAssetRecord.optimized_url
    }];
  }
  if (sql.includes('FROM crop_risk_records')) return mockCurrentRiskRecord ? [getCopy(mockCurrentRiskRecord)] : [{ id: 'risk1', risk_score: 85, risk_level: 'high' }];
  return [];
};

// Mock MySQL database transaction module
jest.mock('../src/database/mysql/transaction', () => ({
  withTransaction: jest.fn().mockImplementation(async (cb) => {
    const mockTxConn = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn().mockResolvedValue(),
      execute: jest.fn().mockImplementation(async (sql) => [mockQueryHandler(sql)])
    };
    return cb(mockTxConn);
  })
}));

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  const mockConn = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn().mockResolvedValue(),
    execute: jest.fn().mockImplementation(async (sql) => {
      const rows = mockQueryHandler(sql);
      return [rows];
    })
  };
  return {
    ...originalModule,
    query: jest.fn().mockImplementation(async (sql) => mockQueryHandler(sql)),
    testConnection: jest.fn().mockResolvedValue(true),
    getPool: jest.fn().mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(mockConn)
    }),
    withTransaction: jest.fn().mockImplementation(async (cb) => cb(mockConn))
  };
});

// Mock Snowflake database module
jest.mock('../src/database/snowflake', () => ({
  connectSnowflake: jest.fn().mockResolvedValue({ isUp: () => true }),
  executeQuery: jest.fn().mockResolvedValue([]),
  closeSnowflake: jest.fn().mockResolvedValue()
}));

// Mock Gemini AI Client
jest.mock('../src/integrations/gemini/geminiClient', () => ({
  analyzeLeafImageWithGemini: jest.fn(),
  fetchImageAsInlineData: jest.fn().mockResolvedValue({ inlineData: { data: 'base64', mimeType: 'image/jpeg' } })
}));

// Mock Gemini Recommendation Client
jest.mock('../src/integrations/gemini/recommendationClient', () => ({
  generateActionableRecommendations: jest.fn().mockResolvedValue({
    rawResponse: JSON.stringify({
      recommendations: ['Apply Tebuconazole fungicide'],
      preventionSteps: ['Use rust-resistant crop varieties'],
      treatmentSuggestions: ['Foliar spray under calm wind conditions'],
      timingSuggestions: ['Apply early morning']
    })
  })
}));

// Mock OpenWeatherMap Client
jest.mock('../src/integrations/weather/weatherClient', () => ({
  fetchCurrentWeatherFromApi: jest.fn(),
  fetchForecastWeatherFromApi: jest.fn()
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env, validateEnv } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const snowflakeDb = require('../src/database/snowflake');
const geminiClient = require('../src/integrations/gemini/geminiClient');
const recommendationClient = require('../src/integrations/gemini/recommendationClient');
const weatherClient = require('../src/integrations/weather/weatherClient');
const weatherService = require('../src/services/weather.service');
const { DatabaseError } = require('../src/utils/apiError');

describe('Phase 18 - Complete End-to-End Workflow & Failure Testing Suite', () => {
  const primaryUser = { id: '00000000-0000-0000-0000-000000000001', email: 'farmer.e2e@agroassist.pro', role: 'farmer' };
  const rogueUser = { id: '99999999-9999-9999-9999-999999999999', email: 'rogue.e2e@agroassist.pro', role: 'farmer' };

  let primaryToken, rogueToken, expiredToken;

  const farmId = '11111111-1111-1111-1111-111111111111';
  const cropId = '22222222-2222-2222-2222-222222222222';
  const assetId = '33333333-3333-3333-3333-333333333333';
  const analysisId = '44444444-4444-4444-4444-444444444444';

  beforeAll(() => {
    primaryToken = jwt.sign(primaryUser, env.JWT_SECRET, { expiresIn: '1h' });
    rogueToken = jwt.sign(rogueUser, env.JWT_SECRET, { expiresIn: '1h' });
    expiredToken = jwt.sign(primaryUser, env.JWT_SECRET, { expiresIn: '-1s' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    weatherService.clearCache();
    mysqlDb.query.mockImplementation(async (sql) => mockQueryHandler(sql));
    mysqlDb.testConnection.mockResolvedValue(true);
    snowflakeDb.connectSnowflake.mockResolvedValue({ isUp: () => true });
    snowflakeDb.executeQuery.mockResolvedValue([]);
    snowflakeDb.closeSnowflake.mockResolvedValue();
    geminiClient.fetchImageAsInlineData.mockResolvedValue({ inlineData: { data: 'base64', mimeType: 'image/jpeg' } });
    recommendationClient.generateActionableRecommendations.mockResolvedValue({
      rawResponse: JSON.stringify({
        recommendations: ['Apply Tebuconazole fungicide'],
        preventionSteps: ['Use rust-resistant crop varieties'],
        treatmentSuggestions: ['Foliar spray under calm wind conditions'],
        timingSuggestions: ['Apply early morning']
      })
    });
  });

  describe('1. Full End-to-End Golden Pathway Workflow', () => {
    it('REGISTER / LOGIN -> CREATE FARM -> CREATE CROP -> UPLOAD IMAGE -> OPTIMIZATION -> DISEASE ANALYSIS -> WEATHER -> RISK -> RECOMMENDATION -> MYSQL STORAGE -> SNOWFLAKE ANALYTICS -> HISTORY -> PDF REPORT', async () => {
      // Step A: Create Farm
      const mockFarmRecord = { id: farmId, user_id: primaryUser.id, farm_name: 'E2E Punjab Farm', location: 'Ludhiana, Punjab', latitude: 30.901, longitude: 75.8573, area: 10, area_unit: 'acres', soil_type: 'Loam' };

      const createFarmRes = await request(app)
        .post('/api/farms')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({ farm_name: 'E2E Punjab Farm', location: 'Ludhiana, Punjab', latitude: 30.901, longitude: 75.8573 });

      expect(createFarmRes.status).toBe(201);
      expect(createFarmRes.body.data.id).toBe(farmId);

      // Step B: Create Crop inside Farm
      const mockCropRecord = { id: cropId, farm_id: farmId, crop_name: 'Wheat', crop_variety: 'HD-2967', growth_stage: 'Tillering' };

      const createCropRes = await request(app)
        .post(`/api/farms/${farmId}/crops`)
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({ crop_name: 'Wheat', crop_variety: 'HD-2967', growth_stage: 'Tillering' });

      expect(createCropRes.status).toBe(201);
      expect(createCropRes.body.data.id).toBe(cropId);

      // Step C: Cloudinary Upload Signature Request
      const signatureRes = await request(app)
        .post('/api/uploads/signature')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({ farmId, cropId });

      expect(signatureRes.status).toBe(200);
      expect(signatureRes.body.data.signature).toBeDefined();

      // Step D: Register Uploaded Cloudinary Asset Metadata
      const mockAssetRecord = {
        id: assetId,
        user_id: primaryUser.id,
        farm_id: farmId,
        crop_id: cropId,
        public_id: 'agroassist/leaf_scan_e2e',
        original_url: 'https://res.cloudinary.com/agroassist/image/upload/v1/agroassist/leaf_scan_e2e.jpg',
        optimized_url: 'https://res.cloudinary.com/agroassist/image/upload/c_fit,h_600,w_800/e_sharpen:50/e_auto_contrast/f_auto/q_auto/v1/agroassist/leaf_scan_e2e.jpg'
      };

      const metadataRes = await request(app)
        .post('/api/uploads/metadata')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({
          farm_id: farmId,
          crop_id: cropId,
          public_id: 'agroassist/leaf_scan_e2e',
          original_url: 'https://res.cloudinary.com/agroassist/image/upload/v1/agroassist/leaf_scan_e2e.jpg'
        });

      expect(metadataRes.status).toBe(201);
      expect(metadataRes.body.data.optimized_url).toContain('c_fit,h_600,w_800');

      // Step E: Master 14-Step AI Analysis Pipeline Call
      const mockWeatherRecord = { id: 'w1', farm_id: farmId, temperature: 29.0, humidity: 75.0, rainfall: 10.0, weather_condition: 'Rain', rain_probability: 80.0 };
      const mockAnalysisRecord = {
        id: analysisId,
        user_id: primaryUser.id,
        farm_id: farmId,
        crop_id: cropId,
        cloudinary_asset_id: assetId,
        disease_name: 'Leaf Rust',
        confidence_score: 92.5,
        severity: 'high',
        environmental_risk_level: 'high',
        symptoms: JSON.stringify(['Orange pustules on wheat leaves']),
        recommendations: JSON.stringify(['Apply Tebuconazole fungicide']),
        prevention_steps: JSON.stringify(['Use rust-resistant crop varieties']),
        treatment_suggestions: JSON.stringify(['Foliar spray under calm wind conditions']),
        gemini_raw_response: JSON.stringify({ raw: 'test' }),
        analysis_status: 'completed',
        created_at: new Date().toISOString()
      };

      mockCurrentWeatherRecord = mockWeatherRecord;
      mockCurrentAnalysisRecord = mockAnalysisRecord;

      // Mock Weather Client
      weatherClient.fetchCurrentWeatherFromApi.mockResolvedValueOnce({
        temperature: 29.0, humidity: 75.0, rainfall: 10.0, wind_speed: 4.0, weather_condition: 'Rain', rain_probability: 80.0
      });

      // Mock Gemini Client
      geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({
        rawResponse: JSON.stringify({
          diseaseName: 'Leaf Rust',
          confidenceScore: 92.5,
          severity: 'high',
          environmentalRiskLevel: 'high',
          symptoms: ['Orange pustules on wheat leaves'],
          recommendations: ['Apply Tebuconazole fungicide'],
          preventionSteps: ['Use rust-resistant crop varieties'],
          treatmentSuggestions: ['Foliar spray under calm wind conditions']
        })
      });

      const masterAnalysisRes = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({ farmId, cropId, cloudinaryAssetId: assetId });

      expect(masterAnalysisRes.status).toBe(200);
      expect(masterAnalysisRes.body.success).toBe(true);
      expect(masterAnalysisRes.body.data.analysis.diseaseName).toBe('Leaf Rust');
      expect(masterAnalysisRes.body.data.risk.riskLevel).toBeDefined();

      // Step F: Query Analysis History
      const historyRes = await request(app)
        .get(`/api/analysis/history/${farmId}?page=1&limit=10`)
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.items).toHaveLength(1);
      expect(historyRes.body.data.items[0].disease).toBe('Leaf Rust');

      // Step G: Generate Printable AI Health PDF Report Stream
      const pdfReportRes = await request(app)
        .get(`/api/reports/analysis/${analysisId}/pdf`)
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(pdfReportRes.status).toBe(200);
      expect(pdfReportRes.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('2. Authentication & Authorization Failure Scenarios', () => {
    it('should reject invalid JWT token format (401)', async () => {
      const res = await request(app)
        .get('/api/farms')
        .set('Authorization', 'Bearer malformed.invalid.token');

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_TOKEN');
    });

    it('should reject expired JWT token (401)', async () => {
      const res = await request(app)
        .get('/api/farms')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('TOKEN_EXPIRED');
    });

    it('should reject unauthorized access when Rogue Farmer attempts to fetch Primary Farmer farm (403)', async () => {
      mysqlDb.query.mockResolvedValueOnce([{ id: farmId, user_id: primaryUser.id }]);

      const res = await request(app)
        .get(`/api/farms/${farmId}`)
        .set('Authorization', `Bearer ${rogueToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });
  });

  describe('3. External API & Database Failure Scenarios', () => {
    it('should handle OpenWeatherMap API failure gracefully without crashing pipeline', async () => {
      const mockFarmRecord = { id: farmId, user_id: primaryUser.id, farm_name: 'Punjab Farm', latitude: 30.901, longitude: 75.8573 };
      const mockCropRecord = { id: cropId, farm_id: farmId, crop_name: 'Wheat' };
      const mockAssetRecord = { id: assetId, user_id: primaryUser.id, optimized_url: 'https://res.cloudinary.com/leaf.jpg' };
      const mockAnalysisRecord = {
        id: analysisId,
        user_id: primaryUser.id,
        farm_id: farmId,
        crop_id: cropId,
        cloudinary_asset_id: assetId,
        disease_name: 'Early Blight',
        confidence_score: 88.0,
        severity: 'medium',
        environmental_risk_level: 'medium',
        symptoms: JSON.stringify(['Concentric leaf spots']),
        recommendations: JSON.stringify(['Apply Copper Oxychloride']),
        prevention_steps: JSON.stringify(['Sanitize equipment']),
        treatment_suggestions: JSON.stringify(['Apply spray early morning']),
        gemini_raw_response: JSON.stringify({ raw: 'test' }),
        analysis_status: 'completed',
        created_at: new Date().toISOString()
      };

      mockCurrentWeatherRecord = null;
      mockCurrentAnalysisRecord = mockAnalysisRecord;

      weatherClient.fetchCurrentWeatherFromApi.mockRejectedValue(new Error('OpenWeatherMap API 503 Service Unavailable'));
      geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({
        rawResponse: JSON.stringify({
          diseaseName: 'Early Blight',
          confidenceScore: 88.0,
          severity: 'medium',
          environmentalRiskLevel: 'medium',
          symptoms: ['Concentric leaf spots'],
          recommendations: ['Apply Copper Oxychloride'],
          preventionSteps: ['Sanitize equipment'],
          treatmentSuggestions: ['Apply spray early morning']
        })
      });

      const res = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({ farmId, cropId, cloudinaryAssetId: assetId });

      expect(res.status).toBe(200);
      expect(res.body.data.weather).toBeNull();
      expect(res.body.data.analysis.diseaseName).toBe('Early Blight');
    });

    it('should throw DatabaseError (MYSQL_ERROR) when operational database query fails', async () => {
      mysqlDb.query.mockImplementation(() => Promise.reject(new DatabaseError('MySQL Deadlock detected', 'MYSQL_ERROR')));

      const res = await request(app)
        .get('/api/farms')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(res.status).toBe(500);
      expect(res.body.errorCode).toBe('MYSQL_ERROR');
    });
  });

  describe('4. Environment Variable Validation', () => {
    it('should validate application environment configuration cleanly', () => {
      expect(() => validateEnv()).not.toThrow();
    });
  });
});
