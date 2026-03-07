import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

/**
 * Map well-known errors to ApiError instances.
 */
function normaliseError(err) {
  // Already an ApiError — pass through
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest('Validation failed', messages);
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return ApiError.conflict(`Duplicate value for: ${field}`);
  }

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ApiError.badRequest('File too large. Maximum size is 5 MB.');
  }

  // JWT / Clerk errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Invalid or expired token');
  }

  // Fallback
  return ApiError.internal(
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message
  );
}

/**
 * Global Express error-handling middleware.
 * Must be registered LAST with app.use().
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const apiError = normaliseError(err);

  // Log operational errors at warn level, programming errors at error
  if (apiError.isOperational) {
    logger.warn(apiError.message, {
      statusCode: apiError.statusCode,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.error(err.message, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.errors.length > 0 && { errors: apiError.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 catch-all — register BEFORE errorHandler.
 */
export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};