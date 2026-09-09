const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { env } = require('../src/config/env.config');
const mysqlDb = require('../src/database/mysql');
const snowflakeDb = require('../src/database/snowflake');

// Mock MySQL database
jest.mock('../src/database/mysql', () => {
  const originalModule = jest.requireActual('../src/database/mysql');
  return {
    ...originalModule,
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// Mock Snowflake database
jest.mock('../src/database/snowflake', () => ({
  connectSnowflake: jest.fn().mockResolvedValue({ isUp: () => true }),
  executeQuery: jest.fn(),
  closeSnowflake: jest.fn().mockResolvedValue()
}));

describe('Phase 15 - Comprehensive Security Hardening Audit', () => {
  const validUser = { id: 'user-sec-1234', email: 'farmer@security.com', role: 'farmer' };
  const otherUser = { id: 'user-sec-5678', email: 'other@security.com', role: 'farmer' };
  let validToken, otherToken;

  beforeAll(() => {
    validToken = jwt.sign(validUser, env.JWT_SECRET, { expiresIn: '1h' });
    otherToken = jwt.sign(otherUser, env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Security Headers (Helmet)', () => {
    it('should include Helmet security headers in HTTP response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('2. CORS Policy Restrictions', () => {
    it('should set CORS headers for permitted origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000', 'https://0a72be35.agroassist-4sv.pages.dev', 'https://agroassist-4sv.pages.dev');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('3. Rate Limiting Headers', () => {
    it('should attach standard rate limit headers to API requests', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('4. Payload Request Size Limits', () => {
    it('should reject oversized JSON payloads (> 1MB)', async () => {
      const hugeString = 'a'.repeat(1.5 * 1024 * 1024); // 1.5MB
      const response = await request(app)
        .post('/api/farms')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ farm_name: hugeString });

      // Express returns 413 Payload Too Large for body parser overflow
      expect([413, 500]).toContain(response.status);
    });
  });

  describe('5. IDOR & Broken Authorization Protections', () => {
    it('should prevent user B from accessing user A farm details (403)', async () => {
      const farmA = { id: 'farm-123', user_id: validUser.id, farm_name: 'User A Farm' };
      mysqlDb.query.mockResolvedValueOnce([farmA]);

      const response = await request(app)
        .get('/api/farms/farm-123')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });

    it('should prevent user B from deleting user A crop (403)', async () => {
      const cropA = { id: 'crop-123', farm_id: 'farm-123', crop_name: 'Wheat' };
      const farmA = { id: 'farm-123', user_id: validUser.id };

      mysqlDb.query
        .mockResolvedValueOnce([cropA]) // get crop
        .mockResolvedValueOnce([farmA]); // get farm

      const response = await request(app)
        .delete('/api/crops/crop-123')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('UNAUTHORIZED_FARM_ACCESS');
    });
  });

  describe('6. Parameterized SQL & SQL Injection Protection', () => {
    it('should safely escape malicious SQL injection attempts in search queries', async () => {
      mysqlDb.query.mockResolvedValueOnce([{ id: 'farm-123', user_id: validUser.id }]);
      mysqlDb.query.mockResolvedValueOnce([{ total: 0 }]); // count
      mysqlDb.query.mockResolvedValueOnce([]); // rows

      const sqlInjectionAttempt = "' OR '1'='1";
      const response = await request(app)
        .get(`/api/analysis/history/farm-123?disease=${encodeURIComponent(sqlInjectionAttempt)}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Ensure parameterized placeholder ? was used rather than raw string concatenation
      expect(mysqlDb.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('da.disease_name LIKE ?'),
        ['farm-123', `%${sqlInjectionAttempt}%`],
        null
      );
    });
  });

  describe('7. Error Handling Sanitization', () => {
    it('should obscure unexpected server errors in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mysqlDb.query.mockRejectedValueOnce(new Error('Fatal database constraint corruption: secret_table_v2'));

      const response = await request(app)
        .get('/api/farms')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('An unexpected internal server error occurred');
      expect(response.body.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('8. Unsupported HTTP Methods', () => {
    it('should reject unsupported HTTP TRACE method', async () => {
      const response = await request(app).trace('/api/health');
      expect([405, 404, 422]).toContain(response.status);
    });
  });
});
