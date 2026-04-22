import { getAIClient } from '../config/ai.js';
import { getChapterContent } from './youtubeService.js';
import { summarizeIfNeeded } from '../utils/transcriptSummarizer.js';
import mongoose from 'mongoose';
import QuizAttempt from '../models/QuizAttempt.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const WORD_LIMIT = 4000;

// ─────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────

function buildPrompt({ content, chapterTitle, numberOfQuestions, difficulty, questionTypes }) {
  return `
Generate ${numberOfQuestions} educational quiz questions based on the following chapter content.

**Chapter Title:** ${chapterTitle}

**Content:**
${content}

**Requirements:**
- Difficulty: ${difficulty}
- Question types: ${questionTypes.join(', ')}
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
`.trim();
}

// ─────────────────────────────────────────────────────────────────
// VALIDATOR
// ─────────────────────────────────────────────────────────────────

function validateAndFormatQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new Error('Invalid AI response: questions must be an array');
  }

  return questions.map((q, index) => {
    if (!q.questionText) {
      throw new Error(`Question ${index + 1}: missing questionText`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${index + 1}: must have exactly 4 options`);
    }
    const correctOptions = q.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new Error(`Question ${index + 1}: must have exactly 1 correct answer`);
    }

    return {
      questionText: q.questionText.trim(),
      questionType: q.questionType || 'multiple-choice',
      options:      q.options.map(opt => ({
        optionId:   opt.optionId,
        optionText: opt.optionText.trim(),
        isCorrect:  opt.isCorrect,
      })),
      correctAnswer: q.correctAnswer,
      explanation:   q.explanation?.trim() || '',
      difficulty:    q.difficulty || 'medium',
      points:        q.points || 1,
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// AI CALL
// ─────────────────────────────────────────────────────────────────

export async function generateQuizQuestions({ content, chapterTitle, numberOfQuestions = 5, difficulty = 'medium', questionTypes = ['multiple-choice'] }) {
  try {
    const { client, type } = getAIClient();
    const prompt = buildPrompt({ content, chapterTitle, numberOfQuestions, difficulty, questionTypes });

    if (type === 'gemini') {
      const result = await client.generateContent(prompt);
      const text   = result.response.text();

      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText  = jsonMatch ? jsonMatch[1] : text;

      const aiResponse = JSON.parse(jsonText);
      return validateAndFormatQuestions(aiResponse.questions);
    }

    throw new Error(`Unsupported AI provider: ${type}`);

  } catch (error) {
    logger.error('AI quiz generation failed', { error: error.message });
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to generate quiz questions: ' + error.message);
  }
}

// ─────────────────────────────────────────────────────────────────
// CONTENT PIPELINE  (transcript → summarize if needed → return)
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch chapter content and summarize if it exceeds the word limit.
 *
 * Returns:
 *   { content, chapterData, finalContent, wasSummarized, summarizationMeta }
 */
export async function prepareChapterContent(chapter) {
  const chapterData = await getChapterContent(chapter);

  // Not enough content at all
  if (!chapterData.hasContent) {
    return { chapterData, finalContent: null, wasSummarized: false, summarizationMeta: null };
  }

  // Within limit — use as-is
  if (!chapterData.needsSummarization) {
    return {
      chapterData,
      finalContent:      chapterData.content,
      wasSummarized:     false,
      summarizationMeta: null,
    };
  }

  // Over limit — summarize
  logger.info('Content exceeds word limit — summarizing', {
    chapterTitle: chapter.chapterTitle,
    wordCount:    chapterData.metadata.totalWords,
    wordLimit:    WORD_LIMIT,
  });

  try {
    const summaryResult = await summarizeIfNeeded(
      chapterData.content,
      chapter.chapterTitle,
      WORD_LIMIT
    );

    return {
      chapterData,
      finalContent:      summaryResult.text,
      wasSummarized:     summaryResult.wasSummarized,
      summarizationMeta: summaryResult.metadata,
    };

  } catch (summaryError) {
    // Summarization failed — truncate as safe fallback
    logger.error('Summarization failed — falling back to truncation', {
      error:        summaryError.message,
      chapterTitle: chapter.chapterTitle,
    });

    const truncated = chapterData.content
      .split(/\s+/)
      .slice(0, WORD_LIMIT)
      .join(' ') + '...';

    return {
      chapterData,
      finalContent:      truncated,
      wasSummarized:     false,
      summarizationMeta: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// TIME VALIDATION
// ─────────────────────────────────────────────────────────────────

export function validateTiming(quiz, startedAt) {
  if (!quiz.timeLimit) return; // no limit set

  if (!startedAt) throw ApiError.badRequest('Missing quiz start time');

  const startTime = new Date(startedAt);
  if (isNaN(startTime.getTime())) throw ApiError.badRequest('Invalid start time');

  const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);

  if (elapsedMinutes < 0 || elapsedMinutes > quiz.timeLimit + 5) {
    throw ApiError.badRequest('Invalid quiz timing detected');
  }
  if (elapsedMinutes > quiz.timeLimit) {
    throw ApiError.badRequest(
      `Quiz time limit exceeded. Allowed: ${quiz.timeLimit} minutes, ` +
      `you took: ${Math.round(elapsedMinutes)} minutes.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GRADING
// ─────────────────────────────────────────────────────────────────

export function gradeAnswers(quiz, answers) {
  let score = 0;
  const gradedAnswers = [];

  for (const answer of answers) {
    const question = quiz.questions.find(q => q.questionId === answer.questionId);
    if (!question) continue;

    const isCorrect    = answer.selectedAnswer === question.correctAnswer;
    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;

    gradedAnswers.push({
      questionId:     answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
      pointsEarned,
    });
  }

  const percentage = quiz.totalPoints > 0 ? (score / quiz.totalPoints) * 100 : 0;
  const passed     = percentage >= quiz.passingScore;

  return { score, percentage, passed, gradedAnswers };
}

// ─────────────────────────────────────────────────────────────────
// SAVE ATTEMPT  (with transaction + attempt-limit guard)
// ─────────────────────────────────────────────────────────────────

export async function saveAttempt({ quizId, userId, quiz, gradedAnswers, score, percentage, passed, timeSpent, startedAt }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const attemptCount = await QuizAttempt.countDocuments({ quizId, userId }, { session });

    if (quiz.attemptsAllowed > 0 && attemptCount >= quiz.attemptsAllowed) {
      throw ApiError.badRequest('Maximum attempts reached');
    }

    const [attempt] = await QuizAttempt.create(
      [{
        quizId,
        userId,
        courseId:      quiz.courseId,
        answers:       gradedAnswers,
        score,
        percentage,
        passed,
        timeSpent,
        attemptNumber: attemptCount + 1,
        startedAt,
        completedAt:   new Date(),
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    logger.info('Quiz submitted', { quizId, userId, score, percentage, passed });
    return attempt;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}