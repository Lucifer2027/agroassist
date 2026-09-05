const { validateEnv } = require('../src/config/env.config');
const { sanitizeData } = require('../src/utils/logger');

describe('Server & Environment Startup Safeguards', () => {
  it('should successfully validate environment configuration', () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it('should redact sensitive keys from logging data', () => {
    const rawData = {
      user: 'farmer_john',
      password: 'my_secret_password',
      jwt_secret: 'super_secret',
      nested: {
        api_key: '12345'
      }
    };

    const sanitized = sanitizeData(rawData);

    expect(sanitized.user).toBe('farmer_john');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.jwt_secret).toBe('[REDACTED]');
    expect(sanitized.nested.api_key).toBe('[REDACTED]');
  });
});
