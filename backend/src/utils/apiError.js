/**
  * Centralized Operational API Error Framework for AgroAssist Pro
  */
class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'API_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errorCode = 'BAD_REQUEST', errors = []) {
    return new ApiError(400, message, errorCode, errors);
  }

  static unauthorized(message = 'Unauthorized access', errorCode = 'AUTH_UNAUTHORIZED', errors = []) {
    return new ApiError(401, message, errorCode, errors);
  }

  static forbidden(message = 'Access forbidden', errorCode = 'FORBIDDEN', errors = []) {
    return new ApiError(403, message, errorCode, errors);
  }

  static notFound(message = 'Resource not found', errorCode = 'RESOURCE_NOT_FOUND', errors = []) {
    return new ApiError(404, message, errorCode, errors);
  }

  static unprocessableEntity(message = 'Validation failed', errorCode = 'VALIDATION_ERROR', errors = []) {
    return new ApiError(422, message, errorCode, errors);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_SERVER_ERROR', errors = []) {
    return new ApiError(500, message, errorCode, errors);
  }
}

/** 1. ValidationError (422) */
class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errorCode = 'VALIDATION_ERROR', errors = []) {
    super(422, message, errorCode, errors);
  }
}

/** 2. AuthenticationError (401) */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', errorCode = 'AUTH_UNAUTHORIZED', errors = []) {
    super(401, message, errorCode, errors);
  }
}

/** 3. AuthorizationError (403) */
class AuthorizationError extends ApiError {
  constructor(message = 'Access forbidden: Insufficient privileges', errorCode = 'FORBIDDEN_ROLE', errors = []) {
    super(403, message, errorCode, errors);
  }
}

/** 4. NotFoundError (404) */
class NotFoundError extends ApiError {
  constructor(message = 'Requested resource not found', errorCode = 'RESOURCE_NOT_FOUND', errors = []) {
    super(404, message, errorCode, errors);
  }
}

/** 5. DatabaseError (500) */
class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed', errorCode = 'MYSQL_ERROR', errors = []) {
    super(500, message, errorCode, errors);
  }
}

/** 6. CloudinaryError (500) */
class CloudinaryError extends ApiError {
  constructor(message = 'Cloudinary service operation failed', errorCode = 'CLOUDINARY_UPLOAD_FAILED', errors = []) {
    super(500, message, errorCode, errors);
  }
}

/** 7. GeminiError (422/500/502) */
class GeminiError extends ApiError {
  constructor(message = 'Gemini AI processing failed', errorCode = 'GEMINI_ANALYSIS_FAILED', statusCode = 500, errors = []) {
    super(statusCode, message, errorCode, errors);
  }
}

/** 8. WeatherAPIError (500/502) */
class WeatherAPIError extends ApiError {
  constructor(message = 'Weather API service failed', errorCode = 'WEATHER_API_FAILED', errors = []) {
    super(500, message, errorCode, errors);
  }
}

/** 9. SnowflakeError (500) */
class SnowflakeError extends ApiError {
  constructor(message = 'Snowflake data warehouse operation failed', errorCode = 'SNOWFLAKE_SYNC_FAILED', errors = []) {
    super(500, message, errorCode, errors);
  }
}

/** 10. ReportGenerationError (500) */
class ReportGenerationError extends ApiError {
  constructor(message = 'PDF report generation failed', errorCode = 'PDF_GENERATION_FAILED', errors = []) {
    super(500, message, errorCode, errors);
  }
}

// Attach specialized error classes to ApiError for flexible consumption
ApiError.ValidationError = ValidationError;
ApiError.AuthenticationError = AuthenticationError;
ApiError.AuthorizationError = AuthorizationError;
ApiError.NotFoundError = NotFoundError;
ApiError.DatabaseError = DatabaseError;
ApiError.CloudinaryError = CloudinaryError;
ApiError.GeminiError = GeminiError;
ApiError.WeatherAPIError = WeatherAPIError;
ApiError.SnowflakeError = SnowflakeError;
ApiError.ReportGenerationError = ReportGenerationError;

module.exports = ApiError;
module.exports.ApiError = ApiError;
module.exports.ValidationError = ValidationError;
module.exports.AuthenticationError = AuthenticationError;
module.exports.AuthorizationError = AuthorizationError;
module.exports.NotFoundError = NotFoundError;
module.exports.DatabaseError = DatabaseError;
module.exports.CloudinaryError = CloudinaryError;
module.exports.GeminiError = GeminiError;
module.exports.WeatherAPIError = WeatherAPIError;
module.exports.SnowflakeError = SnowflakeError;
module.exports.ReportGenerationError = ReportGenerationError;
