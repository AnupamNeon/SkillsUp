import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEnrolledCourses } from "../api";
import Loading from "../components/Loading";
import { PlayCircle, BookOpen, ArrowRight } from "lucide-react";

export default function MyEnrollments() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses()
      .then((r) => setCourses(r.data.enrolledCourses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          My Enrollments
        </h1>
        <p className="mt-2 text-gray-500">
          Continue learning where you left off
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
            <BookOpen className="h-16 w-16 text-blue-300" />
          </div>
          <h3 className="mt-6 text-lg font-bold text-gray-900">
            No enrollments yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Start learning by enrolling in a course
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
          >
            Browse Courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c._id}
              to={`/player/${c._id}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50"
            >
              <div className="flex gap-4 p-5">
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={c.courseThumbnail || "/placeholder.svg"}
                    alt={c.courseTitle}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                    <PlayCircle className="h-8 w-8 text-white opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                    {c.courseTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <PlayCircle className="h-3.5 w-3.5" />
                    Continue Learning
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Bottom progress accent */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
