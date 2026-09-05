const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const cloudinary = require('cloudinary').v2;

// Mock MySQL database module
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock Cloudinary SDK uploader & sign_request
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    utils: {
      api_sign_request: jest.fn().mockReturnValue('mock_cloudinary_sha1_signature')
    },
    url: jest.fn().mockReturnValue('https://res.cloudinary.com/demo/image/upload/c_fit,h_600,w_800/e_sharpen:50/e_auto_contrast/f_auto/q_auto/v1/leaf.jpg'),
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

describe('Phase 5 - Cloudinary Upload & Media Management APIs', () => {
  const userA = { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', email: 'farmerA@test.com', role: 'farmer' };
  const userB = { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', email: 'farmerB@test.com', role: 'farmer' };

  const validFarmId = '11111111-2222-3333-4444-555555555555';
  const validCropId = '66666666-7777-8888-9999-000000000000';
  const validAssetId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  let tokenA, tokenB;

  beforeAll(() => {
    tokenA = jwt.sign(userA, env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign(userB, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/uploads/signature', () => {
    it('should generate secure upload signature for owned farm and crop', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockCrop = { id: validCropId, farm_id: validFarmId };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm ownership check
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]); // farm check inside crop check

      const response = await request(app)
        .post('/api/uploads/signature')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farmId: validFarmId,
          cropId: validCropId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('signature', 'mock_cloudinary_sha1_signature');
      expect(response.body.data.folder).toContain(`agroassist/farmers/${userA.id}/farms/${validFarmId}/crops/${validCropId}`);
      expect(response.body.data.eager).toContain('c_fit,h_600,w_800/e_sharpen:50');
    });

    it('should reject signature request if user does not own farm (403)', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      mysqlDb.query.mockResolvedValueOnce([mockFarm]);

      const response = await request(app)
        .post('/api/uploads/signature')
        .set('Authorization', `Bearer ${tokenB}`) // Farmer B requesting signature for Farmer A farm
        .send({
          farmId: validFarmId,
          cropId: validCropId
        });

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });
  });

  describe('POST /api/uploads/metadata', () => {
    it('should register uploaded Cloudinary asset metadata and return 800x600 transformation URL', async () => {
      const mockFarm = { id: validFarmId, user_id: userA.id };
      const mockCrop = { id: validCropId, farm_id: validFarmId };
      const mockCreatedAsset = {
        id: validAssetId,
        user_id: userA.id,
        farm_id: validFarmId,
        crop_id: validCropId,
        public_id: 'leaf_scan_101',
        original_url: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg',
        optimized_url: 'https://res.cloudinary.com/demo/image/upload/c_fit,h_600,w_800/e_sharpen:50/e_auto_contrast/f_auto/q_auto/v1/leaf.jpg'
      };

      mysqlDb.query
        .mockResolvedValueOnce([mockFarm]) // farm check
        .mockResolvedValueOnce([mockCrop]) // crop check
        .mockResolvedValueOnce([mockFarm]) // farm check inside crop check
        .mockResolvedValueOnce({ affectedRows: 1 }) // asset insert
        .mockResolvedValueOnce([mockCreatedAsset]); // asset findById

      const response = await request(app)
        .post('/api/uploads/metadata')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          farm_id: validFarmId,
          crop_id: validCropId,
          public_id: 'leaf_scan_101',
          original_url: 'https://res.cloudinary.com/demo/image/upload/v1/leaf.jpg',
          resource_type: 'image',
          width: 800,
          height: 600,
          format: 'jpg'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.optimized_url).toContain('c_fit,h_600,w_800');
    });
  });

  describe('GET & DELETE /api/uploads/:assetId', () => {
    it('should retrieve asset details by ID for owner', async () => {
      const mockAsset = {
        id: validAssetId,
        user_id: userA.id,
        public_id: 'leaf_scan_101'
      };

      mysqlDb.query.mockResolvedValueOnce([mockAsset]);

      const response = await request(app)
        .get(`/api/uploads/${validAssetId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(validAssetId);
    });

    it('should deny unauthorized user from accessing asset metadata (403)', async () => {
      const mockAsset = {
        id: validAssetId,
        user_id: userA.id,
        public_id: 'leaf_scan_101'
      };

      mysqlDb.query.mockResolvedValueOnce([mockAsset]);

      const response = await request(app)
        .get(`/api/uploads/${validAssetId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_ASSET_ACCESS');
    });

    it('should delete asset from Cloudinary CDN and remove MySQL metadata record', async () => {
      const mockAsset = {
        id: validAssetId,
        user_id: userA.id,
        public_id: 'leaf_scan_101',
        resource_type: 'image'
      };

      mysqlDb.query
        .mockResolvedValueOnce([mockAsset]) // findById for ownership check
        .mockResolvedValueOnce({ affectedRows: 1 }); // DB delete statement

      const response = await request(app)
        .delete(`/api/uploads/${validAssetId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('leaf_scan_101', {
        resource_type: 'image',
        invalidate: true
      });
      expect(response.body.data.public_id).toBe('leaf_scan_101');
    });
  });
});
