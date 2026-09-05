const request = require('supertest');
const app = require('../src/app');
const { openApiSpec } = require('../src/docs/swagger');

describe('Phase 17 - OpenAPI / Swagger API Documentation', () => {
  describe('GET /api/docs/json', () => {
    it('should return valid OpenAPI 3.0.3 specification JSON', async () => {
      const response = await request(app).get('/api/docs/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.openapi).toBe('3.0.3');
      expect(response.body.info.title).toBe('AgroAssist Pro Backend REST API');
      expect(response.body.paths).toBeDefined();
      expect(response.body.components.securitySchemes.bearerAuth).toBeDefined();
    });
  });

  describe('GET /api/docs', () => {
    it('should serve Swagger UI interactive documentation interface', async () => {
      const response = await request(app).get('/api/docs/');

      expect([200, 301, 302]).toContain(response.status);
      if (response.status === 200) {
        expect(response.text).toContain('swagger');
      }
    });
  });

  describe('Secret & Credential Protection', () => {
    it('should not leak API keys, secrets, or database passwords in API spec', () => {
      const specString = JSON.stringify(openApiSpec);
      expect(specString).not.toContain('GEMINI_API_KEY');
      expect(specString).not.toContain('CLOUDINARY_API_SECRET');
      expect(specString).not.toContain('SNOWFLAKE_PASSWORD');
      expect(specString).not.toContain('MYSQL_PASSWORD');
    });
  });

  describe('Endpoint Coverage & Parity', () => {
    it('should cover all primary backend endpoints in OpenAPI specification paths', () => {
      const paths = Object.keys(openApiSpec.paths);

      const requiredPaths = [
        '/health',
        '/farms',
        '/farms/{farmId}',
        '/farms/{farmId}/crops',
        '/crops/{cropId}',
        '/crops/{cropId}/analysis-history',
        '/uploads/signature',
        '/uploads/metadata',
        '/uploads/{assetId}',
        '/analysis',
        '/analysis/disease',
        '/analysis/history/{farmId}',
        '/analysis/{analysisId}',
        '/weather/current/{farmId}',
        '/weather/forecast/{farmId}',
        '/risk/crop/{cropId}',
        '/risk/farm/{farmId}',
        '/recommendations',
        '/recommendations/{analysisId}',
        '/analytics/farm/{farmId}',
        '/analytics/crop/{cropId}',
        '/analytics/disease-trends/{farmId}',
        '/analytics/risk/{farmId}',
        '/analytics/weather-correlation/{farmId}',
        '/reports/analysis/{analysisId}/pdf',
        '/admin/analytics/overview',
        '/admin/analytics/diseases',
        '/admin/analytics/risk',
        '/admin/analytics/weather',
        '/admin/analytics/crops'
      ];

      requiredPaths.forEach((p) => {
        expect(paths).toContain(p);
      });
    });
  });
});
