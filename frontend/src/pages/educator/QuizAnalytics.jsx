import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuizAnalytics } from "../../api";
import { useSafeState } from "../../utils/hooks";
import { formatTime } from "../../utils/helpers";
import Loading from "../../components/Loading";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function QuizAnalytics() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useSafeState(null);
  const [loading, setLoading] = useSafeState(true);

  useEffect(() => {
    fetchQuizAnalytics(quizId)
      .then((r) => setAnalytics(r.data.analytics))
      .catch(() => navigate("/educator/courses"))
      .finally(() => setLoading(false));
  }, [quizId, navigate]);

  if (loading) return <Loading />;
  if (!analytics) return null;

  const stats = [
    { label: "Total Attempts", value: analytics.totalAttempts, icon: BarChart3, color: "primary" },
    { label: "Unique Students", value: analytics.uniqueStudents, icon: Users, color: "primary" },
    { label: "Average Score", value: `${analytics.averageScore.toFixed(1)}%`, icon: TrendingUp, color: "accent" },
    { label: "Pass Rate", value: `${analytics.passRate.toFixed(0)}%`, icon: Award, color: "success" },
  ];

  return (
    <div className="section">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Quiz Analytics
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Detailed performance insights for your quiz
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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

      {/* Score Distribution */}
      <div className="card !p-0 mb-8 overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Score Distribution
          </h2>
        </div>
        <div className="p-6 bg-[var(--bg)]">
          <div className="space-y-4">
            {Object.entries(analytics.scoreDistribution).map(([range, count]) => {
              const percentage = analytics.totalAttempts > 0
                ? (count / analytics.totalAttempts) * 100
                : 0;

              const getColor = (range) => {
                if (range === "0-20" || range === "20-40") return "bg-[var(--danger)]";
                if (range === "40-60") return "bg-[var(--accent)]";
                return "bg-[var(--success)]";
              };

              return (
                <div key={range}>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-[var(--text-primary)]">{range}%</span>
                    <span className="text-[var(--text-secondary)]">
                      {count} attempt{count !== 1 ? "s" : ""} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${getColor(range)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card !p-0 mb-8 overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Performance Metrics
          </h2>
        </div>
        <div className="p-6 bg-[var(--surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-[var(--primary-light)] p-3">
                <Clock className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[var(--text-primary)]">
                  {formatTime(Math.round(analytics.averageTimeSpent))}
                </p>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Average Time Spent
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-[#E8F5E9] p-3">
                <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[var(--text-primary)]">
                  {analytics.passRate.toFixed(1)}%
                </p>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Students Passing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Recent Attempts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
              <tr>
                {["Student", "Score", "Time", "Result", "Date"].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
              {analytics.recentAttempts?.map((attempt, index) => (
                <tr key={index} className="transition-colors hover:bg-[var(--bg)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {attempt.userId?.imageUrl && (
                        <img
                          src={attempt.userId.imageUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border border-[var(--border)]"
                        />
                      )}
                      <span className="font-bold text-[var(--text-primary)]">
                        {attempt.userId?.name || "Anonymous"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[var(--text-primary)]">
                      {attempt.percentage.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                    {formatTime(attempt.timeSpent)}
                  </td>
                  <td className="px-6 py-4">
                    {attempt.passed ? (
                      <span className="badge bg-[#E8F5E9] text-[var(--success)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Passed
                      </span>
                    ) : (
                      <span className="badge bg-[#FFEBEE] text-[var(--danger)]">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}