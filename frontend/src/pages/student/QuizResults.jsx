import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchQuizResults } from "../../api";
import { useSafeState } from "../../utils/hooks";
import { formatTime } from "../../utils/helpers";
import Loading from "../../components/Loading";
import {
  Trophy,
  XCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";

export default function QuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useSafeState(null);
  const [loading, setLoading] = useSafeState(true);

  useEffect(() => {
    fetchQuizResults(quizId)
      .then((r) => setResult(r.data.result))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <Loading />;
  if (!result) return null;

  const passedBg = result.passed ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]";
  const passedColor = result.passed ? "text-[var(--success)]" : "text-[var(--danger)]";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Score Card */}
      <div className="card !p-0 mb-8 overflow-hidden shadow-sm">
        <div className={`px-6 py-8 text-center border-b border-[var(--border)] ${passedBg}`}>
          <div className="mb-4 inline-flex rounded-full bg-[var(--surface)] p-4 shadow-sm">
            {result.passed ? (
              <Trophy className="h-10 w-10 text-[var(--success)]" />
            ) : (
              <XCircle className="h-10 w-10 text-[var(--danger)]" />
            )}
          </div>
          <h1 className={`text-3xl font-extrabold ${passedColor}`}>
            {result.passed ? "Congratulations!" : "Keep Practicing!"}
          </h1>
          <p className="mt-2 font-bold text-[var(--text-secondary)]">
            You scored {result.percentage}%
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 p-6 bg-[var(--surface)]">
          <div className="text-center">
            <div className="mb-2 text-3xl font-extrabold text-[var(--text-primary)]">
              {result.score}/{result.totalPoints ?? "-"}
            </div>
            <p className="text-sm font-bold text-[var(--text-secondary)]">Points Earned</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-extrabold text-[var(--primary)]">
              {result.percentage}%
            </div>
            <p className="text-sm font-bold text-[var(--text-secondary)]">Percentage</p>
          </div>
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-1 text-3xl font-extrabold text-[var(--text-primary)]">
              <Clock className="h-6 w-6 text-[var(--text-secondary)] opacity-50" />
              {formatTime(result.timeSpent)}
            </div>
            <p className="text-sm font-bold text-[var(--text-secondary)]">Time Spent</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Question Review</h2>

        {result.questions.map((q, index) => (
          <div key={index} className="card !p-0 overflow-hidden shadow-sm">
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    q.isCorrect
                      ? "bg-[#E8F5E9] text-[var(--success)]"
                      : "bg-[#FFEBEE] text-[var(--danger)]"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    {q.questionText}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {q.isCorrect ? (
                      <span className="badge bg-[#E8F5E9] text-[var(--success)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Correct
                      </span>
                    ) : (
                      <span className="badge bg-[#FFEBEE] text-[var(--danger)]">
                        <XCircle className="h-3 w-3" />
                        Incorrect
                      </span>
                    )}
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {q.pointsEarned}/{q.points} points
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6 bg-[var(--bg)]">
              {q.options.map((option) => {
                const isYourAnswer = option.optionId === q.selectedAnswer;
                const isCorrectAnswer = option.optionId === q.correctAnswer;

                return (
                  <div
                    key={option.optionId}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      isCorrectAnswer
                        ? "border-[var(--success)] bg-[#E8F5E9]"
                        : isYourAnswer
                          ? "border-[var(--danger)] bg-[#FFEBEE]"
                          : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {isCorrectAnswer ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--success)]" />
                    ) : isYourAnswer ? (
                      <XCircle className="h-5 w-5 flex-shrink-0 text-[var(--danger)]" />
                    ) : (
                      <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-[var(--border)] bg-[var(--surface)]" />
                    )}
                    <span
                      className={`flex-1 text-sm text-[var(--text-primary)] ${
                        isCorrectAnswer || isYourAnswer ? "font-bold" : "font-medium"
                      }`}
                    >
                      <span className="font-bold opacity-50 mr-1">{option.optionId}.</span>
                      {option.optionText}
                    </span>
                    {isCorrectAnswer && (
                      <span className="badge bg-[var(--success)] text-white">
                        Correct Answer
                      </span>
                    )}
                    {isYourAnswer && !isCorrectAnswer && (
                      <span className="badge bg-[var(--danger)] text-white">
                        Your Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {q.explanation && (
              <div className="border-t border-[var(--border)] bg-[var(--primary-light)] px-6 py-4">
                <div className="flex gap-3">
                  <Lightbulb className="h-5 w-5 flex-shrink-0 text-[var(--primary)]" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                      Explanation
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}