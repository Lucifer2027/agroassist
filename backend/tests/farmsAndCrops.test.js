const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const farmRepository = require('../src/repositories/farm.repository');
const cropRepository = require('../src/repositories/crop.repository');

// Mock Database query execution
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

describe('Phase 4 - Farm & Crop Management REST APIs', () => {
  const userA = { id: 'usr-farmer-a', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'usr-farmer-b', email: 'farmerB@test.com', role: 'farmer' };
  const adminUser = { id: 'usr-admin-1', email: 'admin@test.com', role: 'admin' };

  let tokenA, tokenB, adminToken;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign(adminUser, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Farm API Security & CRUD', () => {
    it('should reject request with 401 Unauthorized if JWT token is missing', async () => {
      const response = await request(app).get('/api/farms');
      expect(response.status).toBe(401);
      expect(response.body.errorCode).toBe('AUTH_TOKEN_MISSING');
    });

    it('should create a farm with valid data for authenticated user', async () => {
      const farmInput = {
        farm_name: 'Sunny Valley Farm',
        location: 'Punjab, India',
        latitude: 31.5,
        longitude: 75.8,
        area: 25.0,
        area_unit: 'acres',
        soil_type: 'Loam'
      };

      const mockCreatedFarm = { id: 'farm-1', user_id: userA.id, ...farmInput };

      mysqlDb.query
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([mockCreatedFarm]);

      const response = await request(app)
        .post('/api/farms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(farmInput);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.farm_name).toBe('Sunny Valley Farm');
    });

    it('should return 422 for invalid geolocation coordinates or negative area', async () => {
      const invalidInput = {
        farm_name: 'Bad Coordinates Farm',
        latitude: 195.0, // Invalid latitude (> 90)
        area: -10 // Invalid area
      };

      const response = await request(app)
        .post('/api/farms')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(invalidInput);

      expect(response.status).toBe(422);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should retrieve paginated farms owned by the farmer', async () => {
      const mockFarms = [
        { id: 'farm-1', user_id: userA.id, farm_name: 'Farm 1' },
        { id: 'farm-2', user_id: userA.id, farm_name: 'Farm 2' }
      ];

      mysqlDb.query
        .mockResolvedValueOnce(mockFarms)
        .mockResolvedValueOnce([{ total: 2 }]);

      const response = await request(app)
        .get('/api/farms?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 2,
        totalPages: 1
      });
    });

    it('should deny Farmer B from accessing Farmer A farm with 403 Forbidden', async () => {
      const mockFarmA = { id: 'farm-a-1', user_id: userA.id, farm_name: 'Farmer A Farm' };
      mysqlDb.query.mockResolvedValueOnce([mockFarmA]);

      const response = await request(app)
        .get('/api/farms/farm-a-1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });

    it('should allow Admin user to access Farmer A farm', async () => {
      const mockFarmA = { id: 'farm-a-1', user_id: userA.id, farm_name: 'Farmer A Farm' };
      mysqlDb.query.mockResolvedValueOnce([mockFarmA]);

      const response = await request(app)
        .get('/api/farms/farm-a-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('farm-a-1');
    });

    it('should return 404 Not Found for non-existent farm ID', async () => {
      mysqlDb.query.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/farms/non-existent-id')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(404);
      expect(response.body.errorCode).toBe('FARM_NOT_FOUND');
    });
  });

  describe('Crop API Security & CRUD', () => {
    it('should create a crop on an owned farm', async () => {
      const mockFarm = { id: 'farm-a-1', user_id: userA.id, farm_name: 'Farm A' };
      const cropInput = {
        crop_name: 'Wheat',
        crop_variety: 'HD-2967',
        sowing_date: '2026-05-01T00:00:00.000Z',
        expected_harvest_date: '2026-09-01T00:00:00.000Z',
        status: 'active'
      };
      const mockCreatedCrop = { id: 'crop-1', farm_id: 'farm-a-1', ...cropInput };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce({ affectedRows: 1 }) // crop insert
        .mockResolvedValueOnce([mockCreatedCrop]); // crop findById

      const response = await request(app)
        .post('/api/farms/farm-a-1/crops')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(cropInput);

      expect(response.status).toBe(201);
      expect(response.body.data.crop_name).toBe('Wheat');
    });

    it('should reject crop creation if harvest date is before sowing date (422)', async () => {
      const invalidCrop = {
        crop_name: 'Rice',
        sowing_date: '2026-06-01T00:00:00.000Z',
        expected_harvest_date: '2026-05-01T00:00:00.000Z' // Invalid: Harvest before sowing
      };

      const response = await request(app)
        .post('/api/farms/farm-a-1/crops')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(invalidCrop);

      expect(response.status).toBe(422);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should prevent User B from registering crop on User A farm (403)', async () => {
      const mockFarm = { id: 'farm-a-1', user_id: userA.id, farm_name: 'Farm A' };
      mysqlDb.query.mockResolvedValueOnce([mockFarm]);

      const response = await request(app)
        .post('/api/farms/farm-a-1/crops')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ crop_name: 'Maize' });

      expect(response.status).toBe(403);
    });

    it('should retrieve crops for a farm with pagination', async () => {
      const mockFarm = { id: 'farm-a-1', user_id: userA.id };
      const mockCrops = [{ id: 'crop-1', farm_id: 'farm-a-1', crop_name: 'Wheat' }];

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce(mockCrops) // crops select
        .mockResolvedValueOnce([{ total: 1 }]); // crops count

      const response = await request(app)
        .get('/api/farms/farm-a-1/crops?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
    });
  });
});
