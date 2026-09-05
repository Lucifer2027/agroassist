const request = require('supertest');
const app = require('../src/app');

describe('404 Not Found Handler', () => {
  it('should return 404 for unknown endpoints with standard error response structure', async () => {
    const response = await request(app).get('/api/non-existent-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route not found: GET /api/non-existent-endpoint',
      errorCode: 'ROUTE_NOT_FOUND',
      errors: []
    });
  });
});
