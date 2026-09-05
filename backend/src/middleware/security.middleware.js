const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const ApiError = require('../utils/apiError');
const { env } = require('../config/env.config');

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP (disabled or relaxed during unit testing)
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errorCode: 'TOO_MANY_REQUESTS'
  }
});

/**
 * Strict Rate Limiter for compute/AI/PDF intensive endpoints
 * 15 requests per 15 minutes per IP
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded for resource-intensive operations. Please try again later',
    errorCode: 'STRICT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Request Timeout Middleware
 * Enforces a strict response timeout to prevent connection starvation DoS attacks
 */
const requestTimeout = (seconds = 30) => {
  return (req, res, next) => {
    // Disable timeout during unit testing to prevent race conditions with supertest
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        return next(ApiError.internal('Request execution timed out', 'REQUEST_TIMEOUT'));
      }
    }, seconds * 1000);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
};

/**
 * HTTP Method Validation Middleware
 * Rejects dangerous or unsupported HTTP methods
 */
const allowedMethods = (allowed = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']) => {
  return (req, res, next) => {
    if (!allowed.includes(req.method.toUpperCase())) {
      return next(ApiError.unprocessableEntity(`HTTP method ${req.method} is not allowed`, 'METHOD_NOT_ALLOWED'));
    }
    next();
  };
};

/**
 * Configured Security Headers via Helmet
 */
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
};

/**
 * Configured CORS Options
 */
const corsOptions = () => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://agroassist.pro'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching allowedOrigins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return callback(null, true);
      }
      return callback(new ApiError('CORS policy violation: Access denied', 403, 'CORS_VIOLATION'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400
  });
};

module.exports = {
  generalRateLimiter,
  strictRateLimiter,
  requestTimeout,
  allowedMethods,
  securityHeaders,
  corsOptions
};
