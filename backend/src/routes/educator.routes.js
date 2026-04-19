import { Router } from "express";
import upload from "../config/multer.js";
import { authenticate, protectEducator } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  addCourseValidator,
  updateCourseValidator,
  courseIdParamValidator,
  togglePublishValidator,
  updateLectureDescriptionsValidator,
} from "../validators/educator.validator.js";
import {
  addCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  getEducatorCourses,
  educatorDashboardData,
  getEnrolledStudentsData,
  getEducatorCourseById,
} from "../controllers/educator.controller.js";
import { updateLectureDescriptions } from "../controllers/quiz.controller.js";

const router = Router();

router.use(authenticate, protectEducator);

router.post(
  "/add-course",
  upload.single("image"),
  addCourseValidator,
  validate,
  addCourse,
);

router.get("/courses", getEducatorCourses);

router.put(
  "/courses/:courseId",
  upload.single("image"),
  updateCourseValidator,
  validate,
  updateCourse,
);

router.delete(
  "/courses/:courseId",
  courseIdParamValidator,
  validate,
  deleteCourse,
);

router.patch(
  "/courses/:courseId/publish",
  togglePublishValidator,
  validate,
  togglePublish,
);

// ✅ NEW: Bulk update lecture descriptions
router.put(
  "/courses/:courseId/lecture-descriptions",
  updateLectureDescriptionsValidator,
  validate,
  updateLectureDescriptions,
);

router.get("/dashboard", educatorDashboardData);
router.get("/enrolled-students", getEnrolledStudentsData);

router.get(
  "/courses/:courseId",
  courseIdParamValidator,
  validate,
  getEducatorCourseById,
);

export default router;
