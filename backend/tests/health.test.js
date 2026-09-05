const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return 200 OK with healthy status payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'AgroAssist Pro API is running');
    expect(response.body).toHaveProperty('timestamp');
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });
});
