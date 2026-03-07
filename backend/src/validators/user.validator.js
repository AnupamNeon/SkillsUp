import { body, param } from 'express-validator';       // ← added param

export const purchaseCourseValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .isMongoId()
    .withMessage('Invalid courseId format'),
];

export const updateProgressValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .isMongoId()
    .withMessage('Invalid courseId format'),
  body('lectureId')
    .notEmpty()
    .withMessage('lectureId is required')
    .isString()
    .trim(),
];

/**
 * FIX: courseId now comes from URL param, not body.
 */
export const getCourseProgressValidator = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid courseId format'),
];

export const addRatingValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .isMongoId()
    .withMessage('Invalid courseId format'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
];

/**
 * NEW: Validate courseId param for enrolled course content.
 */
export const enrolledCourseContentValidator = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid courseId format'),
];