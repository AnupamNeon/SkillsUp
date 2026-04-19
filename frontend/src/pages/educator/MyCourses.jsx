import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchEducatorCourses, deleteCourse, togglePublish } from "../../api";
import { formatPrice } from "../../utils/currency";
import { useSafeState } from "../../utils/hooks";
import { PAGINATION } from "../../utils/constants";
import Pagination from "../../components/Pagination";
import Loading from "../../components/Loading";
import { Empty, Button } from "../../components/ui";
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function EducatorCourses() {
  const [courses, setCourses] = useSafeState([]);
  const [pagination, setPagination] = useSafeState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useSafeState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchEducatorCourses({ page, limit: PAGINATION.DEFAULT_LIMIT });
      setCourses(data.items);
      setPagination(data.pagination);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try {
      await deleteCourse(id);
      toast.success("Course deleted");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggle = async (id, current) => {
    try {
      const { data } = await togglePublish(id, !current);
      toast.success(data.message);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, isPublished: data.isPublished } : c
        )
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Courses</h1>
          <p className="mt-1 text-gray-500">Manage and track your courses</p>
        </div>

        <Link to="/educator/courses/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <Empty
          icon={BookOpen}
          title="No courses yet"
          desc="Create your first course and start teaching!"
          action={
            <Link to="/educator/courses/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Create Course
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Course
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Price
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Students
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {courses.map((c) => (
                    <tr key={c._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.courseThumbnail || "/placeholder.svg"}
                            alt=""
                            className="h-11 w-18 rounded-xl object-cover shadow-sm"
                          />
                          <span className="line-clamp-1 font-semibold text-gray-900">
                            {c.courseTitle}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {formatPrice(c.coursePrice)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {c.enrolledStudents?.length || 0}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            c.isPublished
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              c.isPublished ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {c.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Link
                            to={`/educator/courses/${c._id}/quiz`}
                            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-all hover:bg-purple-100"
                          >
                            <Sparkles className="h-4 w-4" />
                            Quiz
                          </Link>

                          <button
                            onClick={() => handleToggle(c._id, c.isPublished)}
                            title={c.isPublished ? "Unpublish" : "Publish"}
                            className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                          >
                            {c.isPublished ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>

                          <Link
                            to={`/educator/courses/${c._id}/edit`}
                            className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(c._id)}
                            className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}