import { body, param, query } from "express-validator";

export const generateAIQuizValidator = [
  body("courseId").isMongoId().withMessage("Invalid courseId"),
  body("chapterId").notEmpty().withMessage("chapterId is required"),
  body("numberOfQuestions")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("numberOfQuestions must be between 1 and 20"),
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Invalid difficulty level"),
  body("quizTitle").optional().isString().trim().isLength({ max: 200 }),
  body("timeLimit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("timeLimit must be positive"),
  body("passingScore")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("passingScore must be between 0 and 100"),
];

export const createManualQuizValidator = [
  body("courseId").isMongoId().withMessage("Invalid courseId"),
  body("chapterId").notEmpty().withMessage("chapterId is required"),
  body("quizTitle")
    .notEmpty()
    .withMessage("quizTitle is required")
    .trim()
    .isLength({ max: 200 }),
  body("questions")
    .isArray({ min: 1 })
    .withMessage("At least one question is required"),
  body("questions.*.questionText")
    .notEmpty()
    .withMessage("Question text is required"),
  body("questions.*.options")
    .isArray({ min: 2 })
    .withMessage("At least 2 options required"),
  body("questions.*.correctAnswer")
    .notEmpty()
    .withMessage("Correct answer is required"),
];

export const submitQuizValidator = [
  param("quizId").isMongoId().withMessage("Invalid quizId"),
  body("answers").isArray({ min: 1 }).withMessage("Answers are required"),
  body("answers.*.questionId").notEmpty().withMessage("questionId is required"),
  body("answers.*.selectedAnswer")
    .notEmpty()
    .withMessage("selectedAnswer is required"),
  body("timeSpent").optional().isInt({ min: 0 }),
  body("startedAt").isISO8601().withMessage("startedAt must be a valid date"),
];

export const quizIdValidator = [
  param("quizId").isMongoId().withMessage("Invalid quizId"),
];

export const updateQuizValidator = [
  param("quizId").isMongoId().withMessage("Invalid quizId"),
  body("quizTitle").optional().trim().isLength({ min: 1, max: 200 }),
  body("passingScore").optional().isInt({ min: 0, max: 100 }),
  body("isActive").optional().isBoolean(),
];

// Validator for check-content endpoint
export const checkContentValidator = [
  body("courseId").isMongoId().withMessage("Invalid courseId"),
  body("chapterId")
    .notEmpty()
    .withMessage("chapterId is required")
    .isString()
    .trim(),
];
