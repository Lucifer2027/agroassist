const request = require('supertest');
const app = require('../src/app');
const {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  CloudinaryError,
  GeminiError,
  WeatherAPIError,
  SnowflakeError,
  ReportGenerationError
} = require('../src/utils/apiError');
const { sanitizeMessage } = require('../src/middleware/error.middleware');

describe('Phase 16 - Production-Grade Centralized Error Handling System', () => {
  describe('Standardized Error Classes', () => {
    it('should correctly instantiate ValidationError with status 422 and VALIDATION_ERROR code', () => {
      const err = new ValidationError('Invalid request body payload');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(422);
      expect(err.errorCode).toBe('VALIDATION_ERROR');
      expect(err.message).toBe('Invalid request body payload');
      expect(err.isOperational).toBe(true);
    });

    it('should correctly instantiate AuthenticationError with status 401', () => {
      const err = new AuthenticationError('Token expired', 'AUTH_UNAUTHORIZED');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
      expect(err.errorCode).toBe('AUTH_UNAUTHORIZED');
    });

    it('should correctly instantiate AuthorizationError with status 403', () => {
      const err = new AuthorizationError('Insufficient privileges');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(403);
      expect(err.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('should correctly instantiate NotFoundError with status 404', () => {
      const err = new NotFoundError('Farm not found', 'RESOURCE_NOT_FOUND');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(404);
      expect(err.errorCode).toBe('RESOURCE_NOT_FOUND');
    });

    it('should correctly instantiate DatabaseError with status 500 and MYSQL_ERROR code', () => {
      const err = new DatabaseError('MySQL connection timeout', 'MYSQL_ERROR');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(500);
      expect(err.errorCode).toBe('MYSQL_ERROR');
    });

    it('should correctly instantiate CloudinaryError with status 500 and CLOUDINARY_UPLOAD_FAILED code', () => {
      const err = new CloudinaryError('CDN upload timeout', 'CLOUDINARY_UPLOAD_FAILED');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(500);
      expect(err.errorCode).toBe('CLOUDINARY_UPLOAD_FAILED');
    });

    it('should correctly instantiate GeminiError with GEMINI_ANALYSIS_FAILED and GEMINI_INVALID_RESPONSE codes', () => {
      const err1 = new GeminiError('Gemini API timeout', 'GEMINI_ANALYSIS_FAILED');
      expect(err1.statusCode).toBe(500);
      expect(err1.errorCode).toBe('GEMINI_ANALYSIS_FAILED');

      const err2 = new GeminiError('Malformed AI output', 'GEMINI_INVALID_RESPONSE');
      expect(err2.statusCode).toBe(500);
      expect(err2.errorCode).toBe('GEMINI_INVALID_RESPONSE');
    });

    it('should correctly instantiate WeatherAPIError with WEATHER_API_FAILED code', () => {
      const err = new WeatherAPIError('OpenWeatherMap unavailable', 'WEATHER_API_FAILED');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(500);
      expect(err.errorCode).toBe('WEATHER_API_FAILED');
    });

    it('should correctly instantiate SnowflakeError with SNOWFLAKE_SYNC_FAILED code', () => {
      const err = new SnowflakeError('Snowflake DW query error', 'SNOWFLAKE_SYNC_FAILED');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(500);
      expect(err.errorCode).toBe('SNOWFLAKE_SYNC_FAILED');
    });

    it('should correctly instantiate ReportGenerationError with PDF_GENERATION_FAILED code', () => {
      const err = new ReportGenerationError('PDFKit font rendering failure', 'PDF_GENERATION_FAILED');
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(500);
      expect(err.errorCode).toBe('PDF_GENERATION_FAILED');
    });
  });

  describe('Sensitive Credentials & Data Disclosure Protection', () => {
    it('should sanitize error messages containing raw SQL statements', () => {
      const rawMsg = 'Query error in SELECT * FROM users WHERE password = secret_123';
      const clean = sanitizeMessage(rawMsg);
      expect(clean).not.toContain('SELECT * FROM users');
      expect(clean).toBe('An internal service operational failure occurred');
    });

    it('should sanitize error messages containing API keys or secrets', () => {
      const rawMsg = 'Failed API call with gemini_api_key=AIzaSyA12345678';
      const clean = sanitizeMessage(rawMsg);
      expect(clean).not.toContain('AIzaSyA12345678');
      expect(clean).toBe('An internal service operational failure occurred');
    });
  });

  describe('Centralized Route Error Handling Integration', () => {
    it('should catch non-existent routes and process through centralized 404 handler', async () => {
      const res = await request(app).get('/api/invalid-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ROUTE_NOT_FOUND');
    });
  });
});
