import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchQuizForStudent } from "../../api";
import { useSafeState } from "../../utils/hooks";
import Loading from "../../components/Loading";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  CheckCircle2,
  Lightbulb,
  Award,
  Eye,
} from "lucide-react";

export default function QuizPreview() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useSafeState(null);
  const [loading, setLoading] = useSafeState(true);

  useEffect(() => {
    fetchQuizForStudent(quizId)
      .then((r) => setQuiz(r.data.quiz))
      .catch(() => navigate("/educator/courses"))
      .finally(() => setLoading(false));
  }, [quizId, navigate]);

  if (loading) return <Loading />;
  if (!quiz) return null;

  return (
    <div className="section">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Quiz Header Card */}
      <div className="card !p-0 mb-8 overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--primary-light)] px-6 py-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-lg bg-[var(--primary)] p-2">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
                {quiz.quizTitle}
              </h1>
              <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                Educator Preview Mode
              </p>
            </div>
          </div>
          {quiz.quizDescription && (
            <p className="text-sm font-medium text-[var(--text-primary)] mt-3">
              {quiz.quizDescription}
            </p>
          )}
        </div>

        {/* Quiz Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-[var(--surface)]">
          {[
            { label: "Questions", value: quiz.questions?.length || 0 },
            { label: "Total Points", value: quiz.totalPoints },
            { label: "Minutes", value: quiz.timeLimit, icon: Clock },
            { label: "Pass Score", value: `${quiz.passingScore}%`, color: "success" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`mb-2 flex items-center justify-center gap-1 text-3xl font-extrabold ${
                stat.color === "success" ? "text-[var(--success)]" : "text-[var(--text-primary)]"
              }`}>
                {stat.icon && <stat.icon className="h-6 w-6 text-[var(--text-secondary)] opacity-50" />}
                {stat.value}
              </div>
              <p className="text-sm font-bold text-[var(--text-secondary)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Warning Banner */}
        <div className="border-t border-[var(--border)] bg-[#FFF3E0] px-6 py-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 flex-shrink-0 text-[var(--accent)] mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Preview Mode
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                You're viewing this quiz as an educator. Correct answers and explanations are visible. 
                Students will not see this information during the quiz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Questions & Answers
        </h2>

        {quiz.questions.map((q, index) => (
          <div key={q.questionId} className="card !p-0 overflow-hidden shadow-sm border-[var(--border)]">
            {/* Question Header */}
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    {q.questionText}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="badge bg-[var(--primary-light)] text-[var(--primary)]">
                      {q.questionType || "multiple-choice"}
                    </span>
                    <span className="badge bg-[#FFF3E0] text-[var(--accent)]">
                      {q.difficulty || "medium"}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {q.points || 1} point{q.points !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 p-6 bg-[var(--bg)]">
              {q.options.map((option) => {
                const isCorrect = option.optionId === q.correctAnswer;

                return (
                  <div
                    key={option.optionId}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      isCorrect
                        ? "border-[var(--success)] bg-[#E8F5E9]"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--success)]" />
                    ) : (
                      <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-[var(--border)] bg-[var(--surface)]" />
                    )}
                    <span
                      className={`flex-1 text-sm ${
                        isCorrect ? "font-bold" : "font-medium"
                      } text-[var(--text-primary)]`}
                    >
                      <span className="font-bold opacity-50 mr-1">{option.optionId}.</span>
                      {option.optionText}
                    </span>
                    {isCorrect && (
                      <span className="badge bg-[var(--success)] text-white">
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
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

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 card border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-[var(--success)]" />
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            Students need {quiz.passingScore}% to pass this quiz
          </p>
        </div>
        <Link
          to={`/educator/courses/${quiz.courseId}/quiz`}
          className="btn-primary"
        >
          Back to Quiz Management
        </Link>
      </div>
    </div>
  );
}