import { body, param } from "express-validator";

export const addCourseValidator = [
  body("courseData")
    .notEmpty()
    .withMessage("Course data is required")
    .custom((value) => {
      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new Error("courseData must be valid JSON");
      }

      if (!parsed.courseTitle?.trim())
        throw new Error("courseTitle is required");
      if (!parsed.courseDescription?.trim())
        throw new Error("courseDescription is required");
      if (parsed.coursePrice == null || parsed.coursePrice < 0)
        throw new Error("coursePrice must be ≥ 0");
      if (
        parsed.discount != null &&
        (parsed.discount < 0 || parsed.discount > 100)
      )
        throw new Error("discount must be between 0 and 100");

      return true;
    }),
];

export const updateCourseValidator = [
  param("courseId").isMongoId().withMessage("Invalid course ID format"),
  body("courseData")
    .optional()
    .custom((value) => {
      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new Error("courseData must be valid JSON");
      }

      if (parsed.courseTitle !== undefined && !parsed.courseTitle?.trim())
        throw new Error("courseTitle cannot be empty");
      if (
        parsed.courseDescription !== undefined &&
        !parsed.courseDescription?.trim()
      )
        throw new Error("courseDescription cannot be empty");
      if (parsed.coursePrice !== undefined && parsed.coursePrice < 0)
        throw new Error("coursePrice must be ≥ 0");
      if (
        parsed.discount !== undefined &&
        (parsed.discount < 0 || parsed.discount > 100)
      )
        throw new Error("discount must be between 0 and 100");

      return true;
    }),
];

export const courseIdParamValidator = [
  param("courseId").isMongoId().withMessage("Invalid course ID format"),
];

export const togglePublishValidator = [
  param("courseId").isMongoId().withMessage("Invalid course ID format"),
  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
];

// ✅ NEW: Validator for bulk lecture description update
export const updateLectureDescriptionsValidator = [
  param("courseId").isMongoId().withMessage("Invalid course ID format"),
  body("descriptions")
    .isArray({ min: 1 })
    .withMessage("descriptions array is required with at least 1 item"),
  body("descriptions.*.lectureId")
    .notEmpty()
    .withMessage("lectureId is required")
    .isString()
    .trim(),
  body("descriptions.*.description")
    .notEmpty()
    .withMessage("description is required")
    .isString()
    .trim()
    .isLength({ min: 50 })
    .withMessage("description must be at least 50 characters"),
];
