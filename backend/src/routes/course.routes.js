import { Router } from 'express';
import validate from '../middleware/validate.js';
import {
  getCourseByIdValidator,
  listCoursesValidator,
} from '../validators/course.validator.js';
import { getAllCourses, getCourseById } from '../controllers/course.controller.js';

const router = Router();

router.get('/all', listCoursesValidator, validate, getAllCourses);
router.get('/:id', getCourseByIdValidator, validate, getCourseById);

export default router;