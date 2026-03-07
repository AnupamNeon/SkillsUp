import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { purchaseLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import {
  purchaseCourseValidator,
  updateProgressValidator,
  getCourseProgressValidator,
  addRatingValidator,
  enrolledCourseContentValidator,
} from '../validators/user.validator.js';
import {
  getUserData,
  userEnrolledCourses,
  getEnrolledCourseContent,
  purchaseCourse,
  updateUserCourseProgress,
  getUserCourseProgress,
  addUserRating,
  syncUser,  
} from '../controllers/user.controller.js';

const router = Router();

// ─── Sync endpoint (must be before authenticate middleware) ───
// This needs auth but handles the case where user doesn't exist in DB yet
router.post('/sync', authenticate, syncUser);

router.use(authenticate);

router.get('/data', getUserData);
router.get('/enrolled-courses', userEnrolledCourses);

/**
 * @swagger
 * /api/user/enrolled-courses/{courseId}/content:
 *   get:
 *     summary: Get full course content for an enrolled student (all lecture URLs)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full course data with lecture URLs
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Course not found
 */
router.get(
  '/enrolled-courses/:courseId/content',
  enrolledCourseContentValidator,
  validate,
  getEnrolledCourseContent
);

router.post(
  '/purchase',
  purchaseLimiter,
  purchaseCourseValidator,
  validate,
  purchaseCourse
);

router.post(
  '/update-course-progress',
  updateProgressValidator,
  validate,
  updateUserCourseProgress
);

router.get(
  '/course-progress/:courseId',
  getCourseProgressValidator,
  validate,
  getUserCourseProgress
);

router.put('/ratings', addRatingValidator, validate, addUserRating);

export default router;