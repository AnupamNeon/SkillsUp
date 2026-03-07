import { Router } from 'express';
import validate from '../middleware/validate.js';
import {
  getCourseByIdValidator,
  listCoursesValidator,
} from '../validators/course.validator.js';
import { getAllCourses, getCourseById } from '../controllers/course.controller.js';

const router = Router();

/**
 * @swagger
 * /api/course/all:
 *   get:
 *     summary: Get all published courses (search, filter, paginate)
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [coursePrice, createdAt, courseTitle] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated course list
 */
router.get('/all', listCoursesValidator, validate, getAllCourses);

/**
 * @swagger
 * /api/course/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', getCourseByIdValidator, validate, getCourseById);

export default router;