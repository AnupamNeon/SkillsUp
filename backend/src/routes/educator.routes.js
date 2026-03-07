import { Router } from 'express';
import upload from '../config/multer.js';
import { authenticate, protectEducator } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  addCourseValidator,
  updateCourseValidator,
  courseIdParamValidator,
  togglePublishValidator,
} from '../validators/educator.validator.js';
import {
  addCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  getEducatorCourses,
  educatorDashboardData,
  getEnrolledStudentsData,
  getEducatorCourseById
} from '../controllers/educator.controller.js';

const router = Router();

router.use(authenticate, protectEducator);

/**
 * @swagger
 * /api/educator/add-course:
 *   post:
 *     summary: Create a new course
 *     tags: [Educator]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               courseData:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created
 */
router.post(
  '/add-course',
  upload.single('image'),
  addCourseValidator,
  validate,
  addCourse
);

/**
 * @swagger
 * /api/educator/courses:
 *   get:
 *     summary: List courses owned by the authenticated educator
 *     tags: [Educator]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Paginated educator courses
 */
router.get('/courses', getEducatorCourses);

/**
 * @swagger
 * /api/educator/courses/{courseId}:
 *   put:
 *     summary: Update an existing course
 *     tags: [Educator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               courseData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated
 *       404:
 *         description: Course not found
 */
router.put(
  '/courses/:courseId',
  upload.single('image'),
  updateCourseValidator,
  validate,
  updateCourse
);

/**
 * @swagger
 * /api/educator/courses/{courseId}:
 *   delete:
 *     summary: Delete a course (only if no students are enrolled)
 *     tags: [Educator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course deleted
 *       400:
 *         description: Cannot delete course with enrolled students
 *       404:
 *         description: Course not found
 */
router.delete(
  '/courses/:courseId',
  courseIdParamValidator,
  validate,
  deleteCourse
);

/**
 * @swagger
 * /api/educator/courses/{courseId}/publish:
 *   patch:
 *     summary: Toggle or set course publish state
 *     tags: [Educator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublished:
 *                 type: boolean
 *                 description: Omit to toggle
 *     responses:
 *       200:
 *         description: Publish state changed
 */
router.patch(
  '/courses/:courseId/publish',
  togglePublishValidator,
  validate,
  togglePublish
);

router.get('/dashboard', educatorDashboardData);
router.get('/enrolled-students', getEnrolledStudentsData);

router.get('/courses/:courseId', courseIdParamValidator, validate, getEducatorCourseById
);
export default router;