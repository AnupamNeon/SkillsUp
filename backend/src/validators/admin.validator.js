import { body, param, query } from 'express-validator';
import { ALL_ROLES } from '../utils/roles.js';

export const updateUserRoleValidator = [
  param('userId')
    .notEmpty()
    .withMessage('userId is required')
    .isString()
    .trim(),
  body('role')
    .notEmpty()
    .withMessage('role is required')
    .isIn(ALL_ROLES)
    .withMessage(`role must be one of: ${ALL_ROLES.join(', ')}`),
];

export const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be ≥ 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  query('role')
    .optional()
    .isIn(ALL_ROLES)
    .withMessage(`role must be one of: ${ALL_ROLES.join(', ')}`),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query too long'),
];

export const userIdParamValidator = [
  param('userId')
    .notEmpty()
    .withMessage('userId is required')
    .isString()
    .trim(),
];