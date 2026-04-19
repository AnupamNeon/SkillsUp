import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchEnrolledCourses } from "../api";
import { usePolling, useSafeState } from "../utils/hooks";
import { POLL_CONFIG } from "../utils/constants";
import Loading from "../components/Loading";
import { Empty } from "../components/ui";
import { PlayCircle, BookOpen, ArrowRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function MyEnrollments() {
  const [courses, setCourses] = useSafeState([]);
  const [loading, setLoading] = useSafeState(true);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const loadEnrollments = async () => {
    try {
      const { data } = await fetchEnrolledCourses();
      setCourses(data.enrolledCourses || []);
      return data.enrolledCourses || [];
    } catch (err) {
      console.error("Failed to load enrollments:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Polling logic
  const { startPolling, attempt } = usePolling(
    async () => {
      const enrollments = await loadEnrollments();
      if (enrollments.length > 0) {
        toast.success("✅ Enrollment successful!");
        window.history.replaceState({}, "", "/my-enrollments");
        return true; // Stop polling
      }
      return false;
    },
    POLL_CONFIG.INTERVAL,
    POLL_CONFIG.MAX_ATTEMPTS
  );

  useEffect(() => {
    loadEnrollments();
  }, []);

  useEffect(() => {
    if (sessionId) startPolling();
  }, [sessionId]);

  if (loading) return <Loading />;

  return (
    <div className="section">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          My Enrollments
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Continue learning where you left off
        </p>

        {sessionId && courses.length === 0 && attempt < POLL_CONFIG.MAX_ATTEMPTS && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/20 px-4 py-3">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary)]" />
            <div>
              <p className="text-sm font-bold text-[var(--primary)]">
                Confirming Enrollment...
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                This usually takes a few seconds.
              </p>
            </div>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <Empty
          icon={BookOpen}
          title={sessionId ? "Just a moment..." : "No enrollments yet"}
          desc={sessionId ? "Confirming your payment." : "Start learning today!"}
          action={
            !sessionId && (
              <Link to="/courses" className="btn-primary">
                Browse Courses <ArrowRight className="h-4 w-4" />
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c._id}
              to={`/player/${c._id}`}
              className="card group overflow-hidden"
            >
              <div className="flex gap-4">
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg)]">
                  <img
                    src={c.courseThumbnail || "/placeholder.svg"}
                    alt={c.courseTitle}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary)]/0 transition-all group-hover:bg-[var(--primary)]/40">
                    <PlayCircle className="h-8 w-8 text-white opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between py-0.5">
                  <h3 className="line-clamp-2 text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                    {c.courseTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
                    <PlayCircle className="h-3.5 w-3.5" />
                    Continue Learning
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}