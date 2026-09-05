/**
 * Standardized API Success Response Helper
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standardized API Error Response Helper
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors
  });
};

module.exports = {
  sendSuccess,
  sendError
};
