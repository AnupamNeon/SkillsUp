import { useEffect, useState } from "react";
import { fetchEducatorStudents } from "../../api";
import Pagination from "../../components/Pagination";
import Loading from "../../components/Loading";
import { Users } from "lucide-react";

export default function EducatorStudents() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEducatorStudents({ page, limit: 15 })
      .then((r) => {
        setStudents(r.data.items);
        setPagination(r.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Enrolled Students
        </h1>
        <p className="mt-1 text-gray-500">Students enrolled in your courses</p>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 p-8">
            <Users className="h-16 w-16 text-purple-300" />
          </div>
          <h3 className="mt-6 text-lg font-bold text-gray-900">
            No students yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Students will appear here once they enroll in your courses
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Student
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Course
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Enrolled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, i) => (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.student?.imageUrl}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                          <span className="font-semibold text-gray-900">
                            {s.student?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {s.student?.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {s.courseTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(s.purchaseDate).toLocaleDateString()}
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
