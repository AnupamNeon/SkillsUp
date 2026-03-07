import { Router } from 'express';
import { authenticate, protectAdmin } from '../middleware/auth.js';
import { adminWriteLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import {
  updateUserRoleValidator,
  listUsersValidator,
  userIdParamValidator,
} from '../validators/admin.validator.js';
import {
  updateUserRole,
  listUsers,
  listEducators,
  deleteUser,
  adminDashboard,
} from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, protectAdmin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin platform dashboard
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', adminDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (filterable by role, searchable)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [student, educator, admin] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', listUsersValidator, validate, listUsers);

/**
 * @swagger
 * /api/admin/educators:
 *   get:
 *     summary: List all educators
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/educators', listEducators);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update a user's role
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, educator, admin]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put(
  '/users/:userId/role',
  adminWriteLimiter,
  updateUserRoleValidator,
  validate,
  updateUserRole
);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  '/users/:userId',
  adminWriteLimiter,
  userIdParamValidator,
  validate,
  deleteUser
);

export default router;