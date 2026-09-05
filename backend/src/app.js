const express = require('express');
const requestLogger = require('./middleware/logger.middleware');
const apiRoutes = require('./routes');
const { setupSwagger } = require('./docs/swagger');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const {
  securityHeaders,
  corsOptions,
  generalRateLimiter,
  allowedMethods,
  requestTimeout
} = require('./middleware/security.middleware');

const app = express();

// 1. Enforce security headers (Helmet)
app.use(securityHeaders());

// 2. Enforce restricted CORS policy
app.use(corsOptions());

// 3. HTTP method validation
app.use(allowedMethods());

// 4. Request timeout handling (30s max for HTTP operations)
app.use(requestTimeout(30));

// 5. Body parsing payload limits (1MB limit to prevent DoS via massive JSON bodies)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Mount OpenAPI / Swagger UI documentation under /api/docs
setupSwagger(app);

// 7. Global API Rate Limiting
app.use('/api', generalRateLimiter);

// 8. Structured HTTP request logging
app.use(requestLogger);

// 9. Mount main API routes under /api
app.use('/api', apiRoutes);

// 10. Catch 404 routes
app.use(notFoundHandler);

// 11. Centralized error handling
app.use(errorHandler);

module.exports = app;
