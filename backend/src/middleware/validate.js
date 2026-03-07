import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Runs after express-validator checks.
 * Collects errors and throws a standardised ApiError.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    throw ApiError.badRequest('Validation failed', details);
  }

  next();
};

export default validate;