import { getAIClient } from "../config/ai.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import { getChapterContent } from "../utils/youtubeService.js";
import { getPaginationParams, paginatedResponse } from "../utils/pagination.js";

// ==================== AI QUIZ SERVICE LOGIC ====================

/**
 * Generate quiz questions using AI
 */
const generateQuizQuestions = async ({
  content,
  chapterTitle,
  numberOfQuestions = 5,
  difficulty = "medium",
  questionTypes = ["multiple-choice"],
}) => {
  try {
    const { client, type } = getAIClient();

    const prompt = buildPrompt({
      content,
      chapterTitle,
      numberOfQuestions,
      difficulty,
      questionTypes,
    });

    let response;

    if (type === "gemini") {
      const result = await client.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const aiResponse = JSON.parse(jsonText);
      return validateAndFormatQuestions(aiResponse.questions);
    }

    throw new Error(`Unsupported AI provider: ${type}`);
  } catch (error) {
    logger.error("AI quiz generation failed", { error: error.message });

    if (error instanceof ApiError) throw error;
    throw ApiError.internal(
      "Failed to generate quiz questions: " + error.message,
    );
  }
};

/**
 * Build the AI prompt
 */
function buildPrompt({
  content,
  chapterTitle,
  numberOfQuestions,
  difficulty,
  questionTypes,
}) {
  return `
Generate ${numberOfQuestions} educational quiz questions based on the following chapter content.

**Chapter Title:** ${chapterTitle}

**Content:**
${content}

**Requirements:**
- Difficulty: ${difficulty}
- Question types: ${questionTypes.join(", ")}
- Each question must have 4 options (A, B, C, D)
- Only ONE option should be correct
- Include a brief explanation for the correct answer
- Make questions clear, unambiguous, and directly related to the content
- Avoid trick questions or overly complex wording

**Output Format (JSON):**
{
  "questions": [
    {
      "questionText": "What is...",
      "questionType": "multiple-choice",
      "options": [
        { "optionId": "A", "optionText": "Option A text", "isCorrect": false },
        { "optionId": "B", "optionText": "Option B text", "isCorrect": true },
        { "optionId": "C", "optionText": "Option C text", "isCorrect": false },
        { "optionId": "D", "optionText": "Option D text", "isCorrect": false }
      ],
      "correctAnswer": "B",
      "explanation": "The correct answer is B because...",
      "difficulty": "${difficulty}",
      "points": 1
    }
  ]
}

Generate ONLY valid JSON, no additional text.
`;
}

/**
 * Validate and format AI-generated questions
 */
function validateAndFormatQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new Error("Invalid AI response: questions must be an array");
  }

  return questions.map((q, index) => {
    if (!q.questionText) {
      throw new Error(`Question ${index + 1}: missing questionText`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${index + 1}: must have exactly 4 options`);
    }

    const correctOptions = q.options.filter((opt) => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new Error(
        `Question ${index + 1}: must have exactly 1 correct answer`,
      );
    }

    return {
      questionText: q.questionText.trim(),
      questionType: q.questionType || "multiple-choice",
      options: q.options.map((opt) => ({
        optionId: opt.optionId,
        optionText: opt.optionText.trim(),
        isCorrect: opt.isCorrect,
      })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation?.trim() || "",
      difficulty: q.difficulty || "medium",
      points: q.points || 1,
    };
  });
}

// ==================== QUIZ CONTROLLER ====================

/**
 * POST /api/quiz/generate
 * Generate AI quiz for a chapter — uses YouTube transcript fallback chain
 */
export const generateAIQuiz = asyncHandler(async (req, res) => {
  const {
    courseId,
    chapterId,
    numberOfQuestions = 5,
    difficulty = "medium",
    quizTitle,
    timeLimit,
    passingScore = 60,
  } = req.body;

  const educatorId = req.userId;

  // Verify course ownership
  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (course.educator !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden(
      "You can only create quizzes for your own courses",
    );
  }

  // Find the chapter
  const chapter = course.courseContent?.find(
    (ch) => ch.chapterId === chapterId,
  );

  if (!chapter) {
    throw ApiError.notFound("Chapter not found");
  }

  // ✅ FIX: Use YouTube service with fallback chain
  const chapterData = await getChapterContent(chapter);

  if (!chapterData.hasContent) {
    // Return detailed per-lecture status so frontend knows what failed
    return res.status(400).json({
      success: false,
      message:
        "Unable to extract content from this chapter. No transcripts or descriptions available.",
      lectureStatuses: chapterData.lectureStatuses,
      contentSources: chapterData.contentSources,
      solutions: [
        {
          option: "enable_captions",
          description:
            "Enable captions/subtitles on your YouTube videos, then try again.",
        },
        {
          option: "add_descriptions",
          description:
            "Add lecture descriptions via PUT /api/educator/courses/:courseId/lecture-descriptions",
        },
        {
          option: "manual_quiz",
          description: "Create the quiz manually via POST /api/quiz/manual",
        },
      ],
    });
  }

  // Warn if some lectures were skipped
  const skippedLectures = chapterData.lectureStatuses.filter(
    (ls) => ls.source === "unavailable",
  );

  // Generate questions using AI
  const questions = await generateQuizQuestions({
    content: chapterData.content,
    chapterTitle: chapter.chapterTitle,
    numberOfQuestions,
    difficulty,
    questionTypes: ["multiple-choice"],
  });

  // Create quiz
  const quiz = await Quiz.create({
    courseId,
    chapterId,
    quizTitle: quizTitle || `${chapter.chapterTitle} - Quiz`,
    quizDescription: `AI-generated quiz for ${chapter.chapterTitle}`,
    questions,
    passingScore,
    timeLimit,
    generatedBy: "ai",
    aiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    createdBy: educatorId,
  });

  logger.info("AI quiz generated", {
    quizId: quiz._id,
    courseId,
    chapterId,
    questionsCount: questions.length,
    contentSources: chapterData.contentSources,
  });

  const response = {
    success: true,
    message: "Quiz generated successfully",
    quiz: {
      _id: quiz._id,
      quizTitle: quiz.quizTitle,
      questionsCount: quiz.questions.length,
      totalPoints: quiz.totalPoints,
    },
    contentSources: chapterData.contentSources,
  };

  // Include warning if some lectures were skipped
  if (skippedLectures.length > 0) {
    response.warning = `${skippedLectures.length} lecture(s) had no available content and were skipped.`;
    response.skippedLectures = skippedLectures.map((l) => ({
      lectureId: l.lectureId,
      lectureTitle: l.lectureTitle,
    }));
  }

  res.status(201).json(response);
});

/**
 * POST /api/quiz/check-content
 * Pre-check endpoint — can we generate a quiz for this chapter?
 */
export const checkChapterContent = asyncHandler(async (req, res) => {
  const { courseId, chapterId } = req.body;
  const educatorId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (course.educator !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden("You can only check your own courses");
  }

  const chapter = course.courseContent?.find(
    (ch) => ch.chapterId === chapterId,
  );

  if (!chapter) {
    throw ApiError.notFound("Chapter not found");
  }

  const chapterData = await getChapterContent(chapter);

  if (chapterData.hasContent) {
    return res.json({
      success: true,
      canGenerate: true,
      message: "Content available — quiz can be generated.",
      lectureStatuses: chapterData.lectureStatuses,
      contentSources: chapterData.contentSources,
    });
  }

  res.json({
    success: true,
    canGenerate: false,
    message: "Not enough content to generate a quiz.",
    lectureStatuses: chapterData.lectureStatuses,
    contentSources: chapterData.contentSources,
    instructions: [
      {
        step: 1,
        option: "Enable YouTube captions",
        details:
          "Go to YouTube Studio → select each video → Subtitles → add auto-generated or manual captions. Then retry quiz generation.",
      },
      {
        step: 2,
        option: "Add lecture descriptions",
        details:
          "Use PUT /api/educator/courses/:courseId/lecture-descriptions to add text descriptions (min 50 chars each) for your lectures.",
      },
      {
        step: 3,
        option: "Create quiz manually",
        details: "Use POST /api/quiz/manual to write your own questions.",
      },
    ],
  });
});

/**
 * PUT /api/educator/courses/:courseId/lecture-descriptions
 * Bulk update lecture descriptions
 */
export const updateLectureDescriptions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { descriptions } = req.body;
  const educatorId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (course.educator !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden("You can only update your own courses");
  }

  const updated = [];
  const notFound = [];

  for (const { lectureId, description } of descriptions) {
    let found = false;

    for (const chapter of course.courseContent) {
      const lecture = chapter.chapterContent?.find(
        (l) => l.lectureId === lectureId,
      );

      if (lecture) {
        lecture.lectureDescription = description.trim();
        found = true;
        updated.push(lectureId);
        break;
      }
    }

    if (!found) {
      notFound.push(lectureId);
    }
  }

  if (updated.length > 0) {
    await course.save();
  }

  logger.info("Lecture descriptions updated", {
    courseId,
    updatedCount: updated.length,
    notFoundCount: notFound.length,
    byUser: educatorId,
  });

  res.json({
    success: true,
    message: `${updated.length} lecture description(s) updated.`,
    updated,
    ...(notFound.length > 0 && {
      warning: `${notFound.length} lecture(s) not found.`,
      notFound,
    }),
  });
});

/**
 * POST /api/quiz/manual
 * Create manual quiz (educator-written)
 */
export const createManualQuiz = asyncHandler(async (req, res) => {
  const {
    courseId,
    chapterId,
    lectureId,
    quizTitle,
    quizDescription,
    questions,
    passingScore = 60,
    timeLimit,
    attemptsAllowed,
  } = req.body;

  const educatorId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (course.educator !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden("Access denied");
  }

  const quiz = await Quiz.create({
    courseId,
    chapterId,
    lectureId,
    quizTitle,
    quizDescription,
    questions,
    passingScore,
    timeLimit,
    attemptsAllowed,
    generatedBy: "manual",
    createdBy: educatorId,
  });

  res.status(201).json({
    success: true,
    message: "Quiz created successfully",
    quiz,
  });
});

/**
 * GET /api/quiz/course/:courseId
 */
export const getCourseQuizzes = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  const [quizzes, total] = await Promise.all([
    Quiz.find({ courseId, isActive: true })
      .select("-questions.correctAnswer -questions.explanation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments({ courseId, isActive: true }),
  ]);

  res.json({
    success: true,
    ...paginatedResponse(quizzes, total, { page, limit }),
  });
});

/**
 * GET /api/quiz/:quizId
 *
 * Access rules:
 *   - Students:   must be enrolled in the course
 *   - Educators:  must own the course (created it)
 *   - Admins:     always allowed
 *
 * Preview mode for educators: returns full question data including
 * correct answers and explanations so they can verify quiz quality.
 */
export const getQuizForStudent = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.userId;

  // ── 1. Fetch the quiz ───────────────────────────────────────────────
  // We fetch with ALL fields initially; we'll strip sensitive fields
  // selectively based on the requester's role below.
  const quiz = await Quiz.findById(quizId).lean();

  if (!quiz) throw ApiError.notFound("Quiz not found");
  if (!quiz.isActive) throw ApiError.badRequest("Quiz is not active");

  // ── 2. Fetch the user with their role ──────────────────────────────
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound("User not found");

  const userRole = user.role || "student";

  // ── 3. Authorization: three separate paths ─────────────────────────

  // PATH A: Admin — unrestricted access with full answer visibility
  if (userRole === "admin") {
    logger.debug("Quiz preview: admin access", { quizId, userId });
    return res.json({
      success: true,
      quiz,
      accessMode: "admin_preview",
    });
  }

  // PATH B: Educator — must own the course; gets full preview with answers
  if (userRole === "educator") {
    const course = await Course.findById(quiz.courseId)
      .select("educator")
      .lean();

    if (!course) throw ApiError.notFound("Associated course not found");

    const courseEducatorId =
      typeof course.educator === "object"
        ? String(course.educator._id || course.educator)
        : String(course.educator);

    // FIX: Educators can only preview quizzes for their OWN courses
    if (courseEducatorId !== userId) {
      throw ApiError.forbidden(
        "You can only preview quizzes for courses you own"
      );
    }

    logger.debug("Quiz preview: educator access granted", {
      quizId,
      userId,
      courseId: quiz.courseId,
    });

    // Return full quiz data including correct answers for educator preview
    // This is intentional — educators need to verify their quiz content
    return res.json({
      success: true,
      quiz,
      accessMode: "educator_preview",
      message:
        "Preview mode: correct answers visible. Students will not see these.",
    });
  }

  // PATH C: Student — must be enrolled, subject to attempt limits
  const isEnrolled = user.enrolledCourses
    .map(String)
    .includes(String(quiz.courseId));

  if (!isEnrolled) {
    throw ApiError.forbidden(
      "You must be enrolled in this course to take this quiz"
    );
  }

  // Check attempt limits for students only
  if (quiz.attemptsAllowed > 0) {
    const attemptCount = await QuizAttempt.countDocuments({
      quizId,
      userId,
    });

    if (attemptCount >= quiz.attemptsAllowed) {
      throw ApiError.badRequest(
        `You have reached the maximum number of attempts (${quiz.attemptsAllowed}). ` +
          `Contact your educator to reset your attempts.`
      );
    }
  }

  // Strip sensitive fields for students
  // Remove correct answers and explanations before sending
  const studentQuiz = {
    ...quiz,
    questions: quiz.questions.map(({ correctAnswer, explanation, ...q }) => q),
  };

  logger.debug("Quiz: student access granted", {
    quizId,
    userId,
    courseId: quiz.courseId,
  });

  return res.json({
    success: true,
    quiz: studentQuiz,
    accessMode: "student",
  });
});

/**
 * POST /api/quiz/:quizId/submit
 */
export const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers, timeSpent, startedAt } = req.body;
  const userId = req.userId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound("Quiz not found");
  if (!quiz.isActive) throw ApiError.badRequest("Quiz is not active");

  const user = await User.findById(userId).lean();
  const isEnrolled = user.enrolledCourses
    .map(String)
    .includes(String(quiz.courseId));

  if (!isEnrolled) {
    throw ApiError.forbidden("Access denied");
  }

  // ⏱️ ✅ Time limit validation (basic protection)
  if (quiz.timeLimit) {
    if (!startedAt) {
      throw ApiError.badRequest("Missing quiz start time");
    }

    const startTime = new Date(startedAt);
    const now = new Date();

    if (isNaN(startTime.getTime())) {
      throw ApiError.badRequest("Invalid start time");
    }

    const elapsedMinutes = (now - startTime) / (1000 * 60);

    // Optional sanity check (prevent absurd manipulation)
    if (elapsedMinutes < 0 || elapsedMinutes > quiz.timeLimit + 5) {
      throw ApiError.badRequest("Invalid quiz timing detected");
    }

    if (elapsedMinutes > quiz.timeLimit) {
      throw ApiError.badRequest(
        `Quiz time limit exceeded. Allowed: ${quiz.timeLimit} minutes, ` +
          `you took: ${Math.round(elapsedMinutes)} minutes.`
      );
    }
  }

  // 🧠 Grade answers BEFORE transaction
  let score = 0;
  const gradedAnswers = [];

  for (const answer of answers) {
    const question = quiz.questions.find(
      (q) => q.questionId === answer.questionId
    );

    if (!question) continue;

    const isCorrect = answer.selectedAnswer === question.correctAnswer;
    const pointsEarned = isCorrect ? question.points : 0;

    score += pointsEarned;

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
      pointsEarned,
    });
  }

  const percentage =
    quiz.totalPoints > 0 ? (score / quiz.totalPoints) * 100 : 0;

  const passed = percentage >= quiz.passingScore;

  // 🔒 Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const attemptCount = await QuizAttempt.countDocuments(
      { quizId, userId },
      { session }
    );

    if (quiz.attemptsAllowed > 0 && attemptCount >= quiz.attemptsAllowed) {
      throw ApiError.badRequest("Maximum attempts reached");
    }

    const [attempt] = await QuizAttempt.create(
      [
        {
          quizId,
          userId,
          courseId: quiz.courseId,
          answers: gradedAnswers,
          score,
          percentage,
          passed,
          timeSpent,
          attemptNumber: attemptCount + 1,
          startedAt,
          completedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    logger.info("Quiz submitted", {
      quizId,
      userId,
      score,
      percentage,
      passed,
    });

    return res.json({
      success: true,
      message: passed
        ? "Congratulations! You passed!"
        : "Keep practicing!",
      result: {
        score,
        totalPoints: quiz.totalPoints,
        percentage: percentage.toFixed(2),
        passed,
        attemptNumber: attempt.attemptNumber,
        attemptsRemaining:
          quiz.attemptsAllowed > 0
            ? quiz.attemptsAllowed - attempt.attemptNumber
            : -1,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * GET /api/quiz/:quizId/results
 */
export const getQuizResults = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { attemptId } = req.query;
  const userId = req.userId;

  const query = { quizId, userId };
  if (attemptId) query._id = attemptId;

  const attempt = await QuizAttempt.findOne(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!attempt) throw ApiError.notFound("Quiz attempt not found");

  const quiz = await Quiz.findById(quizId).lean();

  const detailedResults = attempt.answers.map((ans) => {
    const question = quiz.questions.find(
      (q) => q.questionId === ans.questionId,
    );

    return {
      questionText: question?.questionText,
      selectedAnswer: ans.selectedAnswer,
      correctAnswer: question?.correctAnswer,
      isCorrect: ans.isCorrect,
      explanation: question?.explanation,
      options: question?.options,
      pointsEarned: ans.pointsEarned,
      points: question?.points,
    };
  });

  res.json({
    success: true,
    result: {
      score: attempt.score,
      totalPoints: quiz.totalPoints,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      attemptNumber: attempt.attemptNumber,
      completedAt: attempt.completedAt,
      questions: detailedResults,
    },
  });
});

/**
 * GET /api/quiz/my-attempts/:courseId
 */
export const getMyQuizAttempts = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.userId;
  const { page, limit, skip } = getPaginationParams(req.query);

  const [attempts, total] = await Promise.all([
    QuizAttempt.find({ userId, courseId })
      .populate("quizId", "quizTitle totalPoints")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    QuizAttempt.countDocuments({ userId, courseId }),
  ]);

  res.json({
    success: true,
    ...paginatedResponse(attempts, total, { page, limit }),
  });
});

/**
 * PUT /api/quiz/:quizId
 */
export const updateQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const educatorId = req.userId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound("Quiz not found");

  if (quiz.createdBy !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden("Access denied");
  }

  const {
    quizTitle,
    quizDescription,
    questions,
    passingScore,
    timeLimit,
    attemptsAllowed,
    isActive,
  } = req.body;

  if (quizTitle) quiz.quizTitle = quizTitle;
  if (quizDescription !== undefined) quiz.quizDescription = quizDescription;
  if (questions) quiz.questions = questions;
  if (passingScore !== undefined) quiz.passingScore = passingScore;
  if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
  if (attemptsAllowed !== undefined) quiz.attemptsAllowed = attemptsAllowed;
  if (isActive !== undefined) quiz.isActive = isActive;

  await quiz.save();

  res.json({
    success: true,
    message: "Quiz updated",
    quiz,
  });
});

/**
 * DELETE /api/quiz/:quizId
 */
export const deleteQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const educatorId = req.userId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound("Quiz not found");

  if (quiz.createdBy !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden("Access denied");
  }

  const hasAttempts = await QuizAttempt.exists({ quizId });

  if (hasAttempts) {
    throw ApiError.badRequest(
      "Cannot delete quiz with existing attempts. Deactivate it instead.",
    );
  }

  await Quiz.findByIdAndDelete(quizId);

  logger.info("Quiz deleted", { quizId, by: educatorId });

  res.json({
    success: true,
    message: "Quiz deleted",
  });
});

/**
 * GET /api/quiz/educator/analytics/:quizId
 */
export const getQuizAnalytics = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const educatorId = req.userId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound("Quiz not found");

  if (quiz.createdBy !== educatorId && req.userRole !== "admin") {
    throw ApiError.forbidden("Access denied");
  }

  const attempts = await QuizAttempt.find({ quizId })
    .populate("userId", "name email imageUrl")
    .lean();

  const analytics = {
    totalAttempts: attempts.length,
    uniqueStudents: new Set(
      attempts.map((a) => String(a.userId?._id || a.userId)),
    ).size,
    averageScore:
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
        : 0,
    passRate:
      attempts.length > 0
        ? (attempts.filter((a) => a.passed).length / attempts.length) * 100
        : 0,
    averageTimeSpent:
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) /
          attempts.length
        : 0,
    recentAttempts: attempts.slice(0, 10),
    scoreDistribution: {
      "0-20": attempts.filter((a) => a.percentage < 20).length,
      "20-40": attempts.filter((a) => a.percentage >= 20 && a.percentage < 40)
        .length,
      "40-60": attempts.filter((a) => a.percentage >= 40 && a.percentage < 60)
        .length,
      "60-80": attempts.filter((a) => a.percentage >= 60 && a.percentage < 80)
        .length,
      "80-100": attempts.filter((a) => a.percentage >= 80).length,
    },
  };

  res.json({
    success: true,
    analytics,
  });
});
