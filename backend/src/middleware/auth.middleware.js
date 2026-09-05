const jwt = require('jsonwebtoken');
const { env } = require('../config/env.config');
const ApiError = require('../utils/apiError');

/**
 * Authentication Middleware: Verifies JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token missing or invalid format', 'AUTH_TOKEN_MISSING'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.id && !decoded.userId) decoded.userId = decoded.id;
    if (decoded.userId && !decoded.id) decoded.id = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid authentication token', 'INVALID_TOKEN'));
  }
};

/**
 * Role Authorization Middleware Factory: Enforces role permissions
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Forbidden: Insufficient privileges', 'FORBIDDEN_ROLE'));
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
