const winston = require('winston');

const SENSITIVE_KEYS = [
  'password',
  'jwt_secret',
  'jwtsecret',
  'secret',
  'api_key',
  'apikey',
  'token',
  'authorization',
  'cloudinary_api_secret',
  'gemini_api_key',
  'openweather_api_key',
  'google_client_secret',
  'mysql_password',
  'snowflake_password'
];

/**
 * Recursively redacts sensitive fields from object before logging
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const cleanMeta = Object.keys(meta).length ? JSON.stringify(sanitizeData(meta)) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${cleanMeta}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agroassist-pro-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  ]
});

module.exports = {
  logger,
  sanitizeData
};
