import { param, query } from "express-validator";

export const getCourseByIdValidator = [
  param("id").isMongoId().withMessage("Invalid course ID format"),
];

export const listCoursesValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be ≥ 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search query too long"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be ≥ 0"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be ≥ 0"),
  query("sortBy")
    .optional()
    .isIn(["coursePrice", "createdAt", "courseTitle"])
    .withMessage("Invalid sortBy field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];
