import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, BarChart3, Eye } from 'lucide-react';

function QuizCard({ quiz, showAnalytics = false, courseId }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] transition-all duration-300 hover:border-[var(--primary)] hover:shadow-[0_8px_24px_rgba(25,118,210,0.12)]">
      
      {/* Content Area */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Header */}
        <div className="mb-4">
          <h3 className="line-clamp-2 text-lg font-bold text-[var(--text-primary)]">
            {quiz.quizTitle}
          </h3>

          {/* AI Badge */}
          {quiz.generatedBy === 'ai' && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[var(--primary-light)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]"></span>
              </span>
              AI Generated
            </span>
          )}
        </div>

        {/* Description */}
        {quiz.quizDescription && (
          <p className="mb-6 line-clamp-2 text-sm text-[var(--text-secondary)]">
            {quiz.quizDescription}
          </p>
        )}

        {/* Details List */}
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]">
              <HelpCircle className="h-4 w-4" />
              Questions
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {quiz.questions?.length || 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]">
              <BarChart3 className="h-4 w-4" />
              Total Points
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {quiz.totalPoints}
            </span>
          </div>

          {quiz.timeLimit && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Clock className="h-4 w-4" />
                Time Limit
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {quiz.timeLimit} min
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Eye className="h-4 w-4" />
              Passing Score
            </span>
            <span className="font-bold text-[var(--success)]">
              {quiz.passingScore}%
            </span>
          </div>
        </div>

        {/* Action Section */}
        <div className="mt-6 border-t border-[var(--border)] pt-5 flex gap-2">
          {showAnalytics ? (
            <>
              <Link
                to={`/educator/quiz/${quiz._id}/preview`}
                className="flex-1 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
              <Link
                to={`/educator/quiz/${quiz._id}/analytics`}
                className="flex-1 flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </>
          ) : (
            <Link
              to={`/quiz/${quiz._id}`}
              className="flex w-full items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Take Quiz
            </Link>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default memo(QuizCard);