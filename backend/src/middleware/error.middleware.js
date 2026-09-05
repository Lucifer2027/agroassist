const ApiError = require('../utils/apiError');
const { sendError } = require('../utils/apiResponse');
const { logger } = require('../utils/logger');

const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /bearer\s+[a-zA-Z0-9._-]+/i,
  /mysql:\/\/.*@/i,
  /snowflake:\/\/.*@/i,
  /SELECT\s+.*FROM/i,
  /INSERT\s+INTO/i,
  /UPDATE\s+.*SET/i,
  /DELETE\s+FROM/i,
  /Data truncated for column/i,
  /Duplicate entry .* for key/i,
  /Cannot add or update a child row/i,
  /foreign key constraint fails/i,
  /Unknown column/i,
  /Table '.*' doesn't exist/i
];

/**
 * Sanitizes messages to prevent sensitive data/credential leaks in responses
 */
const sanitizeMessage = (msg) => {
  if (typeof msg !== 'string') return msg;
  let cleanMsg = msg;
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(cleanMsg)) {
      return 'An internal service operational failure occurred';
    }
  }
  return cleanMsg;
};

/**
 * 404 Not Found Middleware Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND');
  next(error);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors || [];

  // Log detailed error internally (redacting credentials via Winston)
  logger.error(`API Error: ${message}`, {
    statusCode,
    errorCode,
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific MySQL errors gracefully
  if (err.errorCode === 'MYSQL_ERROR' || err.code?.startsWith?.('ER_')) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      statusCode = 400;
      message = 'An account or record with this unique value already exists.';
      errorCode = 'DUPLICATE_ENTRY';
    } else if (process.env.NODE_ENV === 'production') {
      message = 'A database operation error occurred. Please try again later.';
    }
  }

  // Strict Production Sanitization
  if (process.env.NODE_ENV === 'production') {
    if (!err.isOperational) {
      statusCode = 500;
      message = 'An unexpected internal server error occurred';
      errorCode = 'INTERNAL_SERVER_ERROR';
      errors = [];
    } else {
      message = sanitizeMessage(message);
    }
  } else {
    message = sanitizeMessage(message);
  }

  return sendError(res, statusCode, message, errorCode, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  sanitizeMessage
};
