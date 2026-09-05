const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const geminiClient = require('../src/integrations/gemini/geminiClient');

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock Gemini AI Client
jest.mock('../src/integrations/gemini/geminiClient', () => ({
  analyzeLeafImageWithGemini: jest.fn(),
  fetchImageAsInlineData: jest.fn()
}));

describe('Phase 6 - Gemini AI Crop Disease Analysis APIs', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', email: 'farmerB@test.com', role: 'farmer' };

  const validFarmId = '11111111-2222-3333-4444-555555555555';
  const validCropId = '66666666-7777-8888-9999-000000000000';
  const validAssetId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const validAnalysisId = '99999999-8888-7777-6666-555555555555';

  let tokenA, tokenB;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/analysis/disease', () => {
    it('should complete AI analysis successfully with valid structured Gemini JSON response', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id, location: 'Punjab, India' };
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato', crop_variety: 'Roma VF' };
      const mockAsset = { id: validAssetId, user_id: userA.id, optimized_url: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg' };
      
      const mockGeminiResponseText = JSON.stringify({
        diseaseName: 'Tomato Early Blight',
        confidenceScore: 94.5,
        severity: 'medium',
        environmentalRiskLevel: 'high',
        symptoms: ['Concentric dark spots on lower leaves'],
        recommendations: ['Apply copper-based fungicide spray'],
        preventionSteps: ['Rotate crops every 2 years'],
        treatmentSuggestions: ['Prune affected lower leaves']
      });

      const mockCreatedAnalysis = {
        id: validAnalysisId,
        user_id: userA.id,
        farm_id: validFarmId,
        crop_id: validCropId,
        cloudinary_asset_id: validAssetId,
        disease_name: 'Tomato Early Blight',
        confidence_score: 94.5,
        severity: 'medium',
        environmental_risk_level: 'high',
        symptoms: JSON.stringify(['Concentric dark spots on lower leaves']),
        recommendations: JSON.stringify(['Apply copper-based fungicide spray']),
        prevention_steps: JSON.stringify(['Rotate crops every 2 years']),
        treatment_suggestions: JSON.stringify(['Prune affected lower leaves']),
        gemini_raw_response: JSON.stringify({ raw: mockGeminiResponseText }),
        analysis_status: 'completed',
        created_at: new Date().toISOString()
      };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]) // farm check inside crop service
        .mockResolvedValueOnce([mockAsset]) // asset check
        .mockResolvedValueOnce({ affectedRows: 1 }) // analysis record insert
        .mockResolvedValueOnce([mockCreatedAnalysis]) // analysis findById
        .mockResolvedValue({ affectedRows: 1 }); // recommendation inserts

      geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({
        rawResponse: mockGeminiResponseText,
        attempt: 1
      });

      const response = await request(app)
        .post('/api/analysis/disease')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: validFarmId,
          cropId: validCropId,
          cloudinaryAssetId: validAssetId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.diseaseName).toBe('Tomato Early Blight');
      expect(response.body.data.confidenceScore).toBe(94.5);
      expect(response.body.data.severity).toBe('medium');
    });

    it('should reject analysis if user does not own the farm or crop (403)', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      mysqlDb.query.mockResolvedValueOnce([mockFarm]);

      const response = await request(app)
        .post('/api/analysis/disease')
        .set('Authorization', `Bearer ${tokenB}`) // Farmer B requesting analysis for Farmer A farm
        .send({
          farmId: validFarmId,
          cropId: validCropId,
          cloudinaryAssetId: validAssetId
        });

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });

    it('should reject malformed JSON returned by Gemini with controlled 422 AI_ANALYSIS_ERROR', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato' };
      const mockAsset = { id: validAssetId, user_id: userA.id, optimized_url: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg' };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm])
        .mockResolvedValueOnce([mockCrop])
        .mockResolvedValueOnce([mockFarm])
        .mockResolvedValueOnce([mockAsset]);

      // Gemini returning non-JSON plain string
      geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({
        rawResponse: 'I am unable to diagnose this image clearly because of shadow.',
        attempt: 1
      });

      const response = await request(app)
        .post('/api/analysis/disease')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: validFarmId,
          cropId: validCropId,
          cloudinaryAssetId: validAssetId
        });

      expect(response.status).toBe(422);
      expect(response.body.errorCode).toBe('AI_ANALYSIS_ERROR');
      expect(response.body.message).toContain('Malformed AI response output');
    });

    it('should reject Gemini response with invalid confidenceScore > 100 or bad severity enum (422)', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockCrop = { id: validCropId, farm_id: validFarmId, crop_name: 'Tomato' };
      const mockAsset = { id: validAssetId, user_id: userA.id, optimized_url: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg' };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm])
        .mockResolvedValueOnce([mockCrop])
        .mockResolvedValueOnce([mockFarm])
        .mockResolvedValueOnce([mockAsset]);

      const invalidSchemaJson = JSON.stringify({
        diseaseName: 'Tomato Blight',
        confidenceScore: 150, // Invalid: > 100
        severity: 'critical_hazard', // Invalid enum
        environmentalRiskLevel: 'high',
        symptoms: ['Spot'],
        recommendations: ['Spray'],
        preventionSteps: ['Clean'],
        treatmentSuggestions: ['Fungicide']
      });

      geminiClient.analyzeLeafImageWithGemini.mockResolvedValueOnce({
        rawResponse: invalidSchemaJson,
        attempt: 1
      });

      const response = await request(app)
        .post('/api/analysis/disease')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: validFarmId,
          cropId: validCropId,
          cloudinaryAssetId: validAssetId
        });

      expect(response.status).toBe(422);
      expect(response.body.errorCode).toBe('AI_ANALYSIS_ERROR');
    });
  });
});
