const mysqlDb = require('../src/database/mysql');
const userRepository = require('../src/repositories/user.repository');
const farmRepository = require('../src/repositories/farm.repository');
const cropRepository = require('../src/repositories/crop.repository');
const cloudinaryAssetRepository = require('../src/repositories/cloudinaryAsset.repository');
const diseaseAnalysisRepository = require('../src/repositories/diseaseAnalysis.repository');
const weatherRecordRepository = require('../src/repositories/weatherRecord.repository');
const cropRiskRecordRepository = require('../src/repositories/cropRiskRecord.repository');
const recommendationRepository = require('../src/repositories/recommendation.repository');

// Mock database query function
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

describe('Phase 2 - MySQL Repositories & Transaction Layer Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Repository', () => {
    it('should execute parameterized INSERT query when creating a user', async () => {
      const mockUser = {
        id: 'usr-123',
        first_name: 'Farmer',
        last_name: 'John',
        email: 'john@farm.com',
        role: 'farmer'
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 }) // for INSERT
        .mockResolvedValueOnce([mockUser]); // for findById SELECT

      const result = await userRepository.create(mockUser);

      expect(mysqlDb.query).toHaveBeenCalledTimes(2);
      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO users');
      expect(mysqlDb.query.mock.calls[0][1]).toContain('john@farm.com');
      expect(result).toEqual(mockUser);
    });

    it('should query user by email with parameterization', async () => {
      const mockUser = { id: 'usr-123', email: 'test@farm.com' };
      mysqlDb.query.mockResolvedValueOnce([mockUser]);

      const result = await userRepository.findByEmail('test@farm.com');

      expect(mysqlDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['test@farm.com'],
        null
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('Farm Repository', () => {
    it('should execute parameterized INSERT for farm creation', async () => {
      const mockFarm = {
        id: 'farm-101',
        user_id: 'usr-123',
        farm_name: 'Green Field',
        area: 15.5
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([mockFarm]);

      const result = await farmRepository.create(mockFarm);

      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO farms');
      expect(mysqlDb.query.mock.calls[0][1]).toContain('Green Field');
      expect(result).toEqual(mockFarm);
    });
  });

  describe('Crop Repository', () => {
    it('should find crops by farm_id using parameterized query', async () => {
      const mockCrops = [{ id: 'crop-1', crop_name: 'Wheat', farm_id: 'farm-101' }];
      mysqlDb.query.mockResolvedValueOnce(mockCrops);

      const result = await cropRepository.findByFarmId('farm-101');

      expect(mysqlDb.query).toHaveBeenCalledWith(
        'SELECT * FROM crops WHERE farm_id = ? ORDER BY created_at DESC',
        ['farm-101'],
        null
      );
      expect(result).toEqual(mockCrops);
    });
  });

  describe('Cloudinary Asset Repository', () => {
    it('should store asset metadata with parameterized query', async () => {
      const mockAsset = {
        id: 'asset-555',
        user_id: 'usr-123',
        public_id: 'leaf_scan_1',
        original_url: 'http://res.cloudinary.com/demo/image/upload/v1/leaf.jpg',
        optimized_url: 'http://res.cloudinary.com/demo/image/upload/w_800,h_600/v1/leaf.jpg'
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([mockAsset]);

      const result = await cloudinaryAssetRepository.create(mockAsset);

      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO cloudinary_assets');
      expect(result).toEqual(mockAsset);
    });
  });

  describe('Disease Analysis Repository', () => {
    it('should automatically stringify array and object properties for JSON columns', async () => {
      const mockAnalysis = {
        id: 'analysis-999',
        user_id: 'usr-123',
        farm_id: 'farm-101',
        crop_id: 'crop-1',
        disease_name: 'Early Blight',
        confidence_score: 95.0,
        severity: 'high',
        environmental_risk_level: 'medium',
        symptoms: ['Dark spots on leaves'],
        recommendations: ['Apply fungicide'],
        prevention_steps: ['Rotate crop'],
        treatment_suggestions: ['Spray copper fungicide'],
        gemini_raw_response: { raw: 'ok' }
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([{
          ...mockAnalysis,
          symptoms: JSON.stringify(mockAnalysis.symptoms),
          recommendations: JSON.stringify(mockAnalysis.recommendations),
          prevention_steps: JSON.stringify(mockAnalysis.prevention_steps),
          treatment_suggestions: JSON.stringify(mockAnalysis.treatment_suggestions),
          gemini_raw_response: JSON.stringify(mockAnalysis.gemini_raw_response)
        }]);

      const result = await diseaseAnalysisRepository.create(mockAnalysis);

      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO disease_analyses');
      // Ensure JSON columns were passed as stringified JSON in params
      const params = mysqlDb.query.mock.calls[0][1];
      expect(params).toContain(JSON.stringify(mockAnalysis.symptoms));
      expect(result.symptoms).toEqual(['Dark spots on leaves']);
    });
  });

  describe('Weather Record Repository', () => {
    it('should insert weather observation record with timestamp', async () => {
      const mockWeather = {
        id: 'wx-101',
        farm_id: 'farm-101',
        temperature: 28.5,
        humidity: 70.0,
        rainfall: 12.4
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([mockWeather]);

      const result = await weatherRecordRepository.create(mockWeather);

      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO weather_records');
      expect(result).toEqual(mockWeather);
    });
  });

  describe('Crop Risk Record Repository', () => {
    it('should store calculated crop risk matrix records', async () => {
      const mockRisk = {
        id: 'risk-888',
        farm_id: 'farm-101',
        crop_id: 'crop-1',
        risk_score: 78.5,
        risk_level: 'high',
        risk_factors: ['High humidity', 'Fungal presence']
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([{
          ...mockRisk,
          risk_factors: JSON.stringify(mockRisk.risk_factors)
        }]);

      const result = await cropRiskRecordRepository.create(mockRisk);

      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO crop_risk_records');
      expect(result.risk_factors).toEqual(mockRisk.risk_factors);
    });
  });

  describe('Recommendation Repository', () => {
    it('should create action recommendation linked to analysis', async () => {
      const mockRec = {
        id: 'rec-303',
        disease_analysis_id: 'analysis-999',
        farm_id: 'farm-101',
        crop_id: 'crop-1',
        recommendation_text: 'Apply systemic fungicide',
        priority: 'high'
      };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([mockRec]);

      const result = await recommendationRepository.create(mockRec);

      expect(mysqlDb.query.mock.calls[0][0]).toContain('INSERT INTO recommendations');
      expect(result).toEqual(mockRec);
    });
  });
});
