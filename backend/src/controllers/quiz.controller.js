import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';
import { generateQuizQuestions, prepareChapterContent, validateTiming, gradeAnswers, saveAttempt} from '../services/quizAIService.js';

// ─────────────────────────────────────────────────────────────────
// HELPERS  (shared response fragments)
// ─────────────────────────────────────────────────────────────────

const NO_CONTENT_SOLUTIONS = [
  { option: 'enable_captions',  description: 'Enable captions/subtitles on your YouTube videos, then retry.' },
  { option: 'add_descriptions', description: 'Add lecture descriptions via PUT /api/educator/courses/:courseId/lecture-descriptions' },
  { option: 'manual_quiz',      description: 'Create the quiz manually via POST /api/quiz/manual' },
];

async function assertCourseOwner(courseId, userId, userRole) {
  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound('Course not found');
  if (String(course.educator) !== String(userId) && userRole !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }
  return course;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/quiz/generate
// ─────────────────────────────────────────────────────────────────

export const generateAIQuiz = asyncHandler(async (req, res) => {
  const {
    courseId,
    chapterId,
    numberOfQuestions = 5,
    difficulty        = 'medium',
    quizTitle,
    timeLimit,
    passingScore      = 60,
  } = req.body;

  const course  = await assertCourseOwner(courseId, req.userId, req.userRole);
  const chapter = course.courseContent?.find(ch => ch.chapterId === chapterId);
  if (!chapter) throw ApiError.notFound('Chapter not found');

  // ── 1. Fetch + optionally summarize content ──────────────────────
  const { chapterData, finalContent, wasSummarized, summarizationMeta } =
    await prepareChapterContent(chapter);

  if (!chapterData.hasContent) {
    return res.status(400).json({
      success:         false,
      message:         'No transcripts or descriptions available for this chapter.',
      lectureStatuses: chapterData.lectureStatuses,
      contentSources:  chapterData.contentSources,
      solutions:       NO_CONTENT_SOLUTIONS,
    });
  }

  // ── 2. Generate questions ────────────────────────────────────────
  const questions = await generateQuizQuestions({
    content:  finalContent,
    chapterTitle: chapter.chapterTitle,
    numberOfQuestions,
    difficulty,
    questionTypes: ['multiple-choice'],
  });

  // ── 3. Persist quiz ──────────────────────────────────────────────
  const quiz = await Quiz.create({
    courseId,
    chapterId,
    quizTitle:       quizTitle || `${chapter.chapterTitle} - Quiz`,
    quizDescription: `AI-generated quiz for ${chapter.chapterTitle}`,
    questions,
    passingScore,
    timeLimit,
    generatedBy:     'ai',
    aiModel:         process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    createdBy:       req.userId,
  });

  logger.info('AI quiz generated', {
    quizId:         quiz._id,
    courseId,
    chapterId,
    questionsCount: questions.length,
    wasSummarized,
  });

  // ── 4. Build response ────────────────────────────────────────────
  const skipped = chapterData.lectureStatuses.filter(ls => ls.source === 'unavailable');

  return res.status(201).json({
    success: true,
    message: 'Quiz generated successfully',
    quiz: {
      _id:            quiz._id,
      quizTitle:      quiz.quizTitle,
      questionsCount: quiz.questions.length,
      totalPoints:    quiz.totalPoints,
    },
    contentSources:    chapterData.contentSources,
    contentProcessing: {
      wasSummarized,
      originalWordCount: chapterData.metadata.totalWords,
      ...(summarizationMeta && {
        summarizedWordCount: summarizationMeta.summarizedWordCount,
        chunksProcessed:     summarizationMeta.chunksProcessed,
        compressionRatio:    summarizationMeta.compressionRatio,
      }),
    },
    ...(skipped.length > 0 && {
      warning:         `${skipped.length} lecture(s) had no content and were skipped.`,
      skippedLectures: skipped.map(l => ({ lectureId: l.lectureId, lectureTitle: l.lectureTitle })),
    }),
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/quiz/check-content
// ─────────────────────────────────────────────────────────────────

export const checkChapterContent = asyncHandler(async (req, res) => {
  const { courseId, chapterId } = req.body;

  const course  = await assertCourseOwner(courseId, req.userId, req.userRole);
  const chapter = course.courseContent?.find(ch => ch.chapterId === chapterId);
  if (!chapter) throw ApiError.notFound('Chapter not found');

  const { chapterData } = await prepareChapterContent(chapter);

  if (chapterData.hasContent) {
    return res.json({
      success:         true,
      canGenerate:     true,
      message:         'Content available — quiz can be generated.',
      lectureStatuses: chapterData.lectureStatuses,
      contentSources:  chapterData.contentSources,
      needsSummarization: chapterData.needsSummarization,
      wordCount:       chapterData.metadata.totalWords,
    });
  }

  return res.json({
    success:         true,
    canGenerate:     false,
    message:         'Not enough content to generate a quiz.',
    lectureStatuses: chapterData.lectureStatuses,
    contentSources:  chapterData.contentSources,
    instructions:    NO_CONTENT_SOLUTIONS,
  });
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/educator/courses/:courseId/lecture-descriptions
// ─────────────────────────────────────────────────────────────────

export const updateLectureDescriptions = asyncHandler(async (req, res) => {
  const { courseId }    = req.params;
  const { descriptions } = req.body;

  const course  = await assertCourseOwner(courseId, req.userId, req.userRole);
  const updated = [];
  const notFound = [];

  for (const { lectureId, description } of descriptions) {
    let found = false;
    for (const chapter of course.courseContent) {
      const lecture = chapter.chapterContent?.find(l => l.lectureId === lectureId);
      if (lecture) {
        lecture.lectureDescription = description.trim();
        found = true;
        updated.push(lectureId);
        break;
      }
    }
    if (!found) notFound.push(lectureId);
  }

  if (updated.length > 0) await course.save();

  logger.info('Lecture descriptions updated', { courseId, updatedCount: updated.length });

  return res.json({
    success: true,
    message: `${updated.length} lecture description(s) updated.`,
    updated,
    ...(notFound.length > 0 && { warning: `${notFound.length} not found.`, notFound }),
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/quiz/manual
// ─────────────────────────────────────────────────────────────────

export const createManualQuiz = asyncHandler(async (req, res) => {
  const { courseId, chapterId, lectureId, quizTitle, quizDescription,
          questions, passingScore = 60, timeLimit, attemptsAllowed } = req.body;

  await assertCourseOwner(courseId, req.userId, req.userRole);

  const quiz = await Quiz.create({
    courseId, chapterId, lectureId, quizTitle, quizDescription,
    questions, passingScore, timeLimit, attemptsAllowed,
    generatedBy: 'manual',
    createdBy:   req.userId,
  });

  return res.status(201).json({ success: true, message: 'Quiz created successfully', quiz });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/quiz/course/:courseId
// ─────────────────────────────────────────────────────────────────

export const getCourseQuizzes = asyncHandler(async (req, res) => {
  const { courseId }         = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  const [quizzes, total] = await Promise.all([
    Quiz.find({ courseId, isActive: true })
      .select('-questions.correctAnswer -questions.explanation')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Quiz.countDocuments({ courseId, isActive: true }),
  ]);

  return res.json({ success: true, ...paginatedResponse(quizzes, total, { page, limit }) });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/quiz/:quizId
// ─────────────────────────────────────────────────────────────────

export const getQuizForStudent = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId     = req.userId;

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz)          throw ApiError.notFound('Quiz not found');
  if (!quiz.isActive) throw ApiError.badRequest('Quiz is not active');

  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found');

  const role = user.role || 'student';

  // Admin — full access
  if (role === 'admin') {
    return res.json({ success: true, quiz, accessMode: 'admin_preview' });
  }

  // Educator — must own the course
  if (role === 'educator') {
    const course = await Course.findById(quiz.courseId).select('educator').lean();
    if (!course) throw ApiError.notFound('Associated course not found');

    if (String(course.educator) !== String(userId)) {
      throw ApiError.forbidden('You can only preview quizzes for your own courses');
    }
    return res.json({
      success: true, quiz, accessMode: 'educator_preview',
      message: 'Preview mode: correct answers visible. Students will not see these.',
    });
  }

  // Student — must be enrolled + attempt limit check
  const isEnrolled = user.enrolledCourses.map(String).includes(String(quiz.courseId));
  if (!isEnrolled) throw ApiError.forbidden('You must be enrolled to take this quiz');

  if (quiz.attemptsAllowed > 0) {
    const count = await QuizAttempt.countDocuments({ quizId, userId });
    if (count >= quiz.attemptsAllowed) {
      throw ApiError.badRequest(
        `Maximum attempts reached (${quiz.attemptsAllowed}). Contact your educator.`
      );
    }
  }

  // Strip answers for students
  const studentQuiz = {
    ...quiz,
    questions: quiz.questions.map(({ correctAnswer, explanation, ...q }) => q),
  };

  return res.json({ success: true, quiz: studentQuiz, accessMode: 'student' });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/quiz/:quizId/submit
// ─────────────────────────────────────────────────────────────────

export const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId }                  = req.params;
  const { answers, timeSpent, startedAt } = req.body;
  const userId                      = req.userId;

  const quiz = await Quiz.findById(quizId);
  if (!quiz)          throw ApiError.notFound('Quiz not found');
  if (!quiz.isActive) throw ApiError.badRequest('Quiz is not active');

  const user = await User.findById(userId).lean();
  if (!user.enrolledCourses.map(String).includes(String(quiz.courseId))) {
    throw ApiError.forbidden('Access denied');
  }

  // Validate timing (throws if exceeded)
  validateTiming(quiz, startedAt);

  // Grade
  const { score, percentage, passed, gradedAnswers } = gradeAnswers(quiz, answers);

  // Persist with transaction
  const attempt = await saveAttempt({
    quizId, userId, quiz, gradedAnswers,
    score, percentage, passed, timeSpent, startedAt,
  });

  return res.json({
    success: true,
    message: passed ? 'Congratulations! You passed!' : 'Keep practicing!',
    result: {
      score,
      totalPoints:       quiz.totalPoints,
      percentage:        percentage.toFixed(2),
      passed,
      attemptNumber:     attempt.attemptNumber,
      attemptsRemaining: quiz.attemptsAllowed > 0
        ? quiz.attemptsAllowed - attempt.attemptNumber
        : -1,
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/quiz/:quizId/results
// ─────────────────────────────────────────────────────────────────

export const getQuizResults = asyncHandler(async (req, res) => {
  const { quizId }   = req.params;
  const { attemptId } = req.query;
  const userId       = req.userId;

  const query   = { quizId, userId, ...(attemptId && { _id: attemptId }) };
  const attempt = await QuizAttempt.findOne(query).sort({ createdAt: -1 }).lean();
  if (!attempt) throw ApiError.notFound('Quiz attempt not found');

  const quiz = await Quiz.findById(quizId).lean();

  const questions = attempt.answers.map(ans => {
    const q = quiz.questions.find(q => q.questionId === ans.questionId);
    return {
      questionText:   q?.questionText,
      selectedAnswer: ans.selectedAnswer,
      correctAnswer:  q?.correctAnswer,
      isCorrect:      ans.isCorrect,
      explanation:    q?.explanation,
      options:        q?.options,
      pointsEarned:   ans.pointsEarned,
      points:         q?.points,
    };
  });

  return res.json({
    success: true,
    result: {
      score:         attempt.score,
      totalPoints:   quiz.totalPoints,
      percentage:    attempt.percentage,
      passed:        attempt.passed,
      timeSpent:     attempt.timeSpent,
      attemptNumber: attempt.attemptNumber,
      completedAt:   attempt.completedAt,
      questions,
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/quiz/my-attempts/:courseId
// ─────────────────────────────────────────────────────────────────

export const getMyQuizAttempts = asyncHandler(async (req, res) => {
  const { courseId }          = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  const [attempts, total] = await Promise.all([
    QuizAttempt.find({ userId: req.userId, courseId })
      .populate('quizId', 'quizTitle totalPoints')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    QuizAttempt.countDocuments({ userId: req.userId, courseId }),
  ]);

  return res.json({ success: true, ...paginatedResponse(attempts, total, { page, limit }) });
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/quiz/:quizId
// ─────────────────────────────────────────────────────────────────

export const updateQuiz = asyncHandler(async (req, res) => {
  const { quizId }   = req.params;
  const quiz         = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  if (String(quiz.createdBy) !== String(req.userId) && req.userRole !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  const fields = ['quizTitle', 'quizDescription', 'questions', 'passingScore',
                  'timeLimit', 'attemptsAllowed', 'isActive'];

  for (const field of fields) {
    if (req.body[field] !== undefined) quiz[field] = req.body[field];
  }

  await quiz.save();
  return res.json({ success: true, message: 'Quiz updated', quiz });
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/quiz/:quizId
// ─────────────────────────────────────────────────────────────────

export const deleteQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const quiz       = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  if (String(quiz.createdBy) !== String(req.userId) && req.userRole !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }
  if (await QuizAttempt.exists({ quizId })) {
    throw ApiError.badRequest('Cannot delete quiz with existing attempts. Deactivate it instead.');
  }

  await Quiz.findByIdAndDelete(quizId);
  logger.info('Quiz deleted', { quizId, by: req.userId });
  return res.json({ success: true, message: 'Quiz deleted' });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/quiz/educator/analytics/:quizId
// ─────────────────────────────────────────────────────────────────

export const getQuizAnalytics = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const quiz       = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  if (String(quiz.createdBy) !== String(req.userId) && req.userRole !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  const attempts = await QuizAttempt.find({ quizId })
    .populate('userId', 'name email imageUrl')
    .lean();

  const total = attempts.length;

  const analytics = {
    totalAttempts:    total,
    uniqueStudents:   new Set(attempts.map(a => String(a.userId?._id || a.userId))).size,
    averageScore:     total ? attempts.reduce((s, a) => s + a.percentage, 0) / total : 0,
    passRate:         total ? (attempts.filter(a => a.passed).length / total) * 100 : 0,
    averageTimeSpent: total ? attempts.reduce((s, a) => s + (a.timeSpent || 0), 0) / total : 0,
    recentAttempts:   attempts.slice(0, 10),
    scoreDistribution: {
      '0-20':   attempts.filter(a => a.percentage < 20).length,
      '20-40':  attempts.filter(a => a.percentage >= 20 && a.percentage < 40).length,
      '40-60':  attempts.filter(a => a.percentage >= 40 && a.percentage < 60).length,
      '60-80':  attempts.filter(a => a.percentage >= 60 && a.percentage < 80).length,
      '80-100': attempts.filter(a => a.percentage >= 80).length,
    },
  };

  return res.json({ success: true, analytics });
});