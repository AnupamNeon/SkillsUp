import { Router } from "express";
import {
  authenticate,
  authorize,
  protectEducator,
} from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  generateAIQuizValidator,
  createManualQuizValidator,
  submitQuizValidator,
  quizIdValidator,
  updateQuizValidator,
  checkContentValidator,
} from "../validators/quiz.validator.js";
import {
  generateAIQuiz,
  createManualQuiz,
  checkChapterContent,
  getCourseQuizzes,
  getQuizForStudent,
  submitQuiz,
  getQuizResults,
  getMyQuizAttempts,
  updateQuiz,
  deleteQuiz,
  getQuizAnalytics,
} from "../controllers/quiz.controller.js";
import { ROLES } from "../utils/roles.js";

const router = Router();

// ─── Educator-only routes ──────────────────────────────────────────────────

router.post(
  "/check-content",
  authenticate,
  protectEducator,
  checkContentValidator,
  validate,
  checkChapterContent,
);

router.post(
  "/generate",
  authenticate,
  protectEducator,
  generateAIQuizValidator,
  validate,
  generateAIQuiz,
);

router.post(
  "/manual",
  authenticate,
  protectEducator,
  createManualQuizValidator,
  validate,
  createManualQuiz,
);

router.put(
  "/:quizId",
  authenticate,
  protectEducator,
  updateQuizValidator,
  validate,
  updateQuiz,
);

router.delete(
  "/:quizId",
  authenticate,
  protectEducator,
  quizIdValidator,
  validate,
  deleteQuiz,
);

router.get(
  "/educator/analytics/:quizId",
  authenticate,
  protectEducator,
  quizIdValidator,
  validate,
  getQuizAnalytics,
);

// ─── Mixed-role routes (student + educator + admin) ────────────────────────
router.get("/course/:courseId", authenticate, getCourseQuizzes);

/**
 * GET /api/quiz/:quizId
 *
 * We allow all three roles — the controller handles the authorization
 * logic differently per role.
 */
router.get(
  "/:quizId",
  authenticate,
  authorize(ROLES.STUDENT, ROLES.EDUCATOR, ROLES.ADMIN),
  quizIdValidator,
  validate,
  getQuizForStudent,
);

/**
 * POST /api/quiz/:quizId/submit
 *
 * Only students should submit quizzes.
 * Educators can preview without submitting.
 */
router.post(
  "/:quizId/submit",
  authenticate,
  authorize(ROLES.STUDENT), // ← Educators should not submit their own quizzes
  submitQuizValidator,
  validate,
  submitQuiz,
);

router.get(
  "/:quizId/results",
  authenticate,
  authorize(ROLES.STUDENT, ROLES.EDUCATOR, ROLES.ADMIN),
  quizIdValidator,
  validate,
  getQuizResults,
);

router.get(
  "/my-attempts/:courseId",
  authenticate,
  authorize(ROLES.STUDENT), // Only students have "my attempts"
  getMyQuizAttempts,
);

export default router;
