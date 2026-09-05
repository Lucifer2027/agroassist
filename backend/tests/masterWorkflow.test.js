const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const geminiClient = require('../src/integrations/gemini/geminiClient');
const weatherClient = require('../src/integrations/weather/weatherClient');
const recommendationClient = require('../src/integrations/gemini/recommendationClient');
const snowflakeDb = require('../src/database/snowflake');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    withTransaction: jest.fn((cb) => cb(null)),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock External API Clients
jest.mock('../src/integrations/gemini/geminiClient', () => ({
  analyzeLeafImageWithGemini: jest.fn(),
  fetchImageAsInlineData: jest.fn()
}));

jest.mock('../src/integrations/weather/weatherClient', () => ({
  fetchCurrentWeatherFromApi: jest.fn(),
  fetchForecastWeatherFromApi: jest.fn()
}));

jest.mock('../src/integrations/gemini/recommendationClient', () => ({
  generateActionableRecommendations: jest.fn()
}));

jest.mock('../src/database/snowflake', () => ({
  connectSnowflake: jest.fn().mockResolvedValue({ isUp: () => true }),
  executeQuery: jest.fn().mockResolvedValue([]),
  closeSnowflake: jest.fn().mockResolvedValue()
}));

describe('Phase 11 - Master 14-Step Disease Analysis Pipeline (POST /api/analysis)', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', email: 'farmerB@test.com', role: 'farmer' };

  const farmId1 = '11111111-2222-3333-4444-555555555555';
  const farmId2 = '22222222-3333-4444-5555-666666666666';
  const validCropId = '66666666-7777-8888-9999-000000000000';
  const validAssetId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const validAnalysisId = '99999999-8888-7777-6666-555555555555';

  const mockFarm1 = { id: farmId1, user_id: userA.id, farm_name: 'Green Acres', location: 'Punjab, India', latitude: 30.9, longitude: 75.8 };
  const mockFarm2 = { id: farmId2, user_id: userA.id, farm_name: 'Valley Field', location: 'Punjab, India', latitude: 31.0, longitude: 76.0 };
  const mockCrop = { id: validCropId, farm_id: farmId1, crop_name: 'Tomato', crop_variety: 'Roma VF' };
  const mockAsset = { id: validAssetId, user_id: userA.id, public_id: 'leaf_scan_505', optimized_url: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg' };
  const mockAnalysisRecord = {
    id: validAnalysisId,
    user_id: userA.id,
    farm_id: farmId1,
    crop_id: validCropId,
    cloudinary_asset_id: validAssetId,
    disease_name: 'Tomato Early Blight',
    confidence_score: 92.0,
    severity: 'medium',
    environmental_risk_level: 'high',
    symptoms: JSON.stringify(['Concentric dark spots on leaves']),
    recommendations: JSON.stringify(['Apply copper fungicide spray']),
    prevention_steps: JSON.stringify(['Rotate crops every 2 years']),
    treatment_suggestions: JSON.stringify(['Prune infected lower leaves']),
    gemini_raw_response: JSON.stringify({ raw: 'ok' }),
    created_at: new Date().toISOString()
  };
  const mockWeatherRecord = {
    id: 'wx-101',
    farm_id: farmId1,
    latitude: 30.9,
    longitude: 75.8,
    temperature: 28.5,
    humidity: 78.0,
    rainfall: 0,
    wind_speed: 4.0,
    weather_condition: 'Clouds',
    rain_probability: 20,
    weather_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  const mockRiskRecord = {
    id: 'risk-101',
    farm_id: farmId1,
    crop_id: validCropId,
    disease_analysis_id: validAnalysisId,
    risk_score: 60,
    risk_level: 'medium',
    risk_factors: JSON.stringify(['Elevated humidity']),
    calculated_at: new Date().toISOString()
  };

  let tokenA, tokenB;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup resilient dynamic SQL mock router
    mysqlDb.query.mockImplementation((sql, params) => {
      const sqlStr = (sql || '').toLowerCase();
      if (sqlStr.includes('select * from farms')) {
        if (Array.isArray(params) && params.includes(farmId2)) return Promise.resolve([mockFarm2]);
        return Promise.resolve([mockFarm1]);
      }
      if (sqlStr.includes('select * from crops')) return Promise.resolve([mockCrop]);
      if (sqlStr.includes('select * from cloudinary_assets')) return Promise.resolve([mockAsset]);
      if (sqlStr.includes('select * from disease_analyses')) return Promise.resolve([mockAnalysisRecord]);
      if (sqlStr.includes('select * from weather_records')) return Promise.resolve([mockWeatherRecord]);
      if (sqlStr.includes('select * from crop_risk_records')) return Promise.resolve([mockRiskRecord]);
      if (sqlStr.includes('select * from recommendations')) return Promise.resolve([]);
      if (sqlStr.includes('insert into')) return Promise.resolve({ affectedRows: 1 });
      return Promise.resolve([]);
    });
  });

  it('should execute full 14-step workflow connecting Cloudinary, Gemini, Weather, Risk Engine, MySQL & Snowflake', async () => {
    const mockGeminiAnalysisText = JSON.stringify({
      diseaseName: 'Tomato Early Blight',
      confidenceScore: 92.0,
      severity: 'medium',
      environmentalRiskLevel: 'high',
      symptoms: ['Concentric dark spots on leaves'],
      recommendations: ['Apply copper fungicide spray'],
      preventionSteps: ['Rotate crops every 2 years'],
      treatmentSuggestions: ['Prune infected lower leaves']
    });

    const mockWeather = {
      temperature: 28.5,
      humidity: 78.0,
      rainfall: 0,
      wind_speed: 4.0,
      weather_condition: 'Clouds',
      rain_probability: 20,
      weather_timestamp: new Date().toISOString()
    };

    const mockGeminiRecText = JSON.stringify({
      recommendations: ['Follow local extension authority guidelines for copper fungicide'],
      preventionSteps: ['Ensure adequate plant spacing'],
      treatmentSuggestions: ['Spray Chlorothalonil according to product label instructions'],
      timingSuggestions: ['Apply in early morning']
    });

    weatherClient.fetchCurrentWeatherFromApi.mockResolvedValueOnce(mockWeather);
    geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({ rawResponse: mockGeminiAnalysisText, attempt: 1 });
    recommendationClient.generateActionableRecommendations.mockResolvedValueOnce({ rawResponse: mockGeminiRecText, attempt: 1 });

    const response = await request(app)
      .post('/api/analysis')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        farmId: farmId1,
        cropId: validCropId,
        cloudinaryAssetId: validAssetId
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('traceId');
    expect(response.body.data).toHaveProperty('analysisId');
    expect(response.body.data.analysis.diseaseName).toBe('Tomato Early Blight');
    expect(response.body.data.weather.humidity).toBe(78.0);
    expect(response.body.data.risk.riskScore).toBeDefined();
    expect(response.body.data.recommendations.items).toHaveLength(1);
    expect(response.body.data.image.publicId).toBe('leaf_scan_505');
  });

  it('should handle Weather API failure gracefully without inventing fake weather data', async () => {
    const mockGeminiAnalysisText = JSON.stringify({
      diseaseName: 'Tomato Leaf Curl Virus',
      confidenceScore: 88.0,
      severity: 'medium',
      environmentalRiskLevel: 'medium',
      symptoms: ['Curled leaves'],
      recommendations: ['Control vector whiteflies'],
      preventionSteps: ['Use yellow sticky traps'],
      treatmentSuggestions: ['Consult extension officer for vector control']
    });

    const mockGeminiRecText = JSON.stringify({
      recommendations: ['Use yellow sticky traps'],
      preventionSteps: ['Clear weeds'],
      treatmentSuggestions: ['Consult local extension officer'],
      timingSuggestions: ['Check sticky traps weekly']
    });

    weatherClient.fetchCurrentWeatherFromApi.mockRejectedValueOnce(new Error('Weather API 503 Service Unavailable'));
    geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({ rawResponse: mockGeminiAnalysisText, attempt: 1 });
    recommendationClient.generateActionableRecommendations.mockResolvedValueOnce({ rawResponse: mockGeminiRecText, attempt: 1 });

    const response = await request(app)
      .post('/api/analysis')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        farmId: farmId2,
        cropId: validCropId,
        cloudinaryAssetId: validAssetId
      });

    expect(response.status).toBe(200);
    expect(response.body.data.weather).toBeNull(); // Weather is null, NOT fake fabricated data
    expect(response.body.data.analysis.diseaseName).toBe('Tomato Leaf Curl Virus');
  });

  it('should deny unauthorized user requesting analysis on another farmer farm (403)', async () => {
    mysqlDb.query.mockImplementation((sql) => {
      const sqlStr = (sql || '').toLowerCase();
      if (sqlStr.includes('select * from farms')) return Promise.resolve([{ id: farmId1, user_id: 'some-other-farmer' }]);
      return Promise.resolve([]);
    });

    const response = await request(app)
      .post('/api/analysis')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        farmId: farmId1,
        cropId: validCropId,
        cloudinaryAssetId: validAssetId
      });

    expect(response.status).toBe(403);
    expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
  });
});
