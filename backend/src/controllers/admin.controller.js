import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import { ROLES } from '../utils/roles.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getPaginationParams,
  paginatedResponse,
} from '../utils/pagination.js';
import logger from '../utils/logger.js';

/**
 * PUT /api/admin/users/:userId/role
 * Update a user's role (promote/demote).
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  // Prevent demoting yourself
  if (userId === req.userId && role !== ROLES.ADMIN) {
    throw ApiError.badRequest('You cannot change your own admin role');
  }

  // Update Clerk metadata
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  });

  // Update local DB
  user.role = role;
  await user.save();

  logger.info(`User role updated`, { targetUserId: userId, newRole: role, byAdmin: req.userId });

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

/**
 * GET /api/admin/users
 * List all users with optional role filter and search, paginated.
 */
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { role, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-enrolledCourses')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    ...paginatedResponse(users, total, { page, limit }),
  });
});

/**
 * GET /api/admin/educators
 * Convenience: list users with role === educator.
 */
export const listEducators = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = { role: ROLES.EDUCATOR };

  const [educators, total] = await Promise.all([
    User.find(filter)
      .select('-enrolledCourses')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    ...paginatedResponse(educators, total, { page, limit }),
  });
});

/**
 * DELETE /api/admin/users/:userId
 * Remove a user entirely (Clerk + local DB).
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.userId) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  // Delete from Clerk
  try {
    await clerkClient.users.deleteUser(userId);
  } catch (err) {
    logger.warn('Clerk user deletion failed (may already be deleted)', {
      userId,
      error: err.message,
    });
  }

  await User.findByIdAndDelete(userId);

  logger.info('User deleted', { deletedUserId: userId, byAdmin: req.userId });

  res.json({ success: true, message: 'User deleted' });
});

/**
 * GET /api/admin/dashboard
 * Aggregate platform stats.
 */
export const adminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalEducators,
    totalStudents,
    totalCourses,
    publishedCourses,
    revenueResult,
    recentPurchases,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.EDUCATOR }),
    User.countDocuments({ role: ROLES.STUDENT }),
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Purchase.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('courseId', 'courseTitle')
      .lean(),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;

  res.json({
    success: true,
    dashboard: {
      totalUsers,
      totalEducators,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalRevenue,
      recentPurchases,
    },
  });
});