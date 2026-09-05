const request = require('supertest');
const express = require('express');
const Joi = require('joi');
const validate = require('../src/middleware/validate.middleware');
const { errorHandler } = require('../src/middleware/error.middleware');

describe('Validation Error Handler', () => {
  let testApp;

  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());

    const testSchema = Joi.object({
      email: Joi.string().email().required(),
      age: Joi.number().min(18).required()
    });

    testApp.post('/test-validation', validate(testSchema), (req, res) => {
      res.status(200).json({ success: true });
    });

    testApp.use(errorHandler);
  });

  it('should return 422 Unprocessable Entity with error details when payload fails validation', async () => {
    const response = await request(testApp)
      .post('/test-validation')
      .send({ email: 'invalid-email', age: 15 });

    expect(response.status).toBe(422);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Request validation failed');
    expect(response.body).toHaveProperty('errorCode', 'VALIDATION_ERROR');
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0]).toHaveProperty('field');
    expect(response.body.errors[0]).toHaveProperty('message');
  });
});
