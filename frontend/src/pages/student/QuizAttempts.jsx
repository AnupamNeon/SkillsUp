import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchMyQuizAttempts } from "../../api";
import { useSafeState } from "../../utils/hooks";
import { PAGINATION } from "../../utils/constants";
import Loading from "../../components/Loading";
import Pagination from "../../components/Pagination";
import { Empty } from "../../components/ui";
import {
  Trophy,
  XCircle,
  Clock,
  Calendar,
  FileQuestion,
  ArrowLeft,
  Eye,
  TrendingUp,
} from "lucide-react";

export default function QuizAttempts() {
  const { courseId } = useParams();
  const [attempts, setAttempts] = useSafeState([]);
  const [pagination, setPagination] = useSafeState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useSafeState(true);

  useEffect(() => {
    fetchMyQuizAttempts(courseId, { page, limit: PAGINATION.QUIZ_ATTEMPTS_LIMIT })
      .then((r) => {
        setAttempts(r.data.items);
        setPagination(r.data.pagination);
      })
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, [courseId, page]);

  if (loading) return <Loading />;

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.passed).length;
  const passRate = totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(0) : 0;
  const avgScore = totalAttempts > 0
    ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(1)
    : 0;

  return (
    <div className="section">
      <Link
        to={`/player/${courseId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          My Quiz Attempts
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Track your progress and review past attempts
        </p>
      </div>

      {/* Stats */}
      {totalAttempts > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { icon: FileQuestion, label: "Total Attempts", value: totalAttempts, color: "primary" },
            { icon: Trophy, label: "Pass Rate", value: `${passRate}%`, color: "success" },
            { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%`, color: "accent" },
          ].map((stat) => (
            <div key={stat.label} className="card p-6 border-none shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${
                  stat.color === "success" ? "bg-[#E8F5E9]" :
                  stat.color === "accent" ? "bg-[#FFF3E0]" :
                  "bg-[var(--primary-light)]"
                }`}>
                  <stat.icon className={`h-6 w-6 ${
                    stat.color === "success" ? "text-[var(--success)]" :
                    stat.color === "accent" ? "text-[var(--accent)]" :
                    "text-[var(--primary)]"
                  }`} />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)]">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {attempts.length === 0 ? (
        <Empty
          icon={FileQuestion}
          title="No quiz attempts yet"
          desc="Start taking quizzes to track your progress"
          action={
            <Link to={`/player/${courseId}`} className="btn-primary">
              Back to Course
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div
                key={attempt._id}
                className="card overflow-hidden border-[var(--border)] bg-[var(--surface)] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`rounded-lg p-2 ${
                          attempt.passed ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
                        }`}
                      >
                        {attempt.passed ? (
                          <Trophy className="h-5 w-5 text-[var(--success)]" />
                        ) : (
                          <XCircle className="h-5 w-5 text-[var(--danger)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[var(--text-primary)]">
                          {attempt.quizId?.quizTitle || "Quiz"}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                          </span>
                          <span>Attempt #{attempt.attemptNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div
                        className={`text-4xl font-extrabold ${
                          attempt.passed ? "text-[var(--success)]" : "text-[var(--danger)]"
                        }`}
                      >
                        {attempt.percentage.toFixed(0)}%
                      </div>
                      <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">
                        {attempt.score}/{attempt.quizId?.totalPoints || 0} points
                      </p>
                    </div>

                    <Link
                      to={`/quiz/${attempt.quizId._id}/results?attemptId=${attempt._id}`}
                      className="btn-secondary !py-2 !px-4 whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${attempt.percentage}%`,
                        backgroundColor: attempt.passed ? "var(--success)" : "var(--danger)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}