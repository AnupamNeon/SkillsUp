import { clerkClient } from '@clerk/express';
import { ROLES } from '../utils/roles.js';
import { getAdminUserIds } from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Extracts and validates the Clerk userId from the request.
 * Sets req.userId for downstream handlers.
 */
export const authenticate = (req, _res, next) => {
  const userId = req.auth?.userId ?? null;

  if (!userId) {
    throw ApiError.unauthorized('Authentication required');
  }

  req.userId = userId;
  next();
};

/**
 * Factory that returns middleware restricting access to the
 * listed roles.  Must be used AFTER `authenticate`.
 *
 * Usage:  authorize(ROLES.ADMIN)
 *         authorize(ROLES.ADMIN, ROLES.EDUCATOR)
 */
export const authorize = (...allowedRoles) =>
  asyncHandler(async (req, _res, next) => {
    const userId = req.userId;

    // Bootstrap admins defined in env always pass the admin check
    const bootstrapAdmins = getAdminUserIds();
    if (
      allowedRoles.includes(ROLES.ADMIN) &&
      bootstrapAdmins.includes(userId)
    ) {
      req.userRole = ROLES.ADMIN;
      return next();
    }

    // Look up the local user record for role
    const user = await User.findById(userId).lean();
    if (!user) {
      throw ApiError.notFound('User account not found');
    }

    const userRole = user.role || ROLES.STUDENT;

    if (!allowedRoles.includes(userRole)) {
      throw ApiError.forbidden(
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }

    req.userRole = userRole;
    next();
  });

/**
 * Convenience: educator-only guard.
 */
export const protectEducator = authorize(ROLES.EDUCATOR, ROLES.ADMIN);

/**
 * Convenience: admin-only guard.
 */
export const protectAdmin = authorize(ROLES.ADMIN);