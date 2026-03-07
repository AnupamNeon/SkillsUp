import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEducatorDashboard } from "../../api";
import { formatPrice } from "../../utils/currency";
import Loading from "../../components/Loading";
import { DollarSign, BookOpen, Users, Plus, TrendingUp } from "lucide-react";

export default function EducatorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducatorDashboard()
      .then((r) => setData(r.data.dashboardData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  const stats = [
    {
      label: "Total Earnings",
      value: formatPrice(data.totalEarning),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      change: "+12% this month",
    },
    {
      label: "Total Courses",
      value: data.totalCourses,
      icon: BookOpen,
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      change: `${data.totalCourses} published`,
    },
    {
      label: "Total Students",
      value: data.enrolledStudentsData?.length || 0,
      icon: Users,
      gradient: "from-purple-500 to-pink-600",
      bg: "bg-purple-50",
      change: "Across all courses",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Educator Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Overview of your teaching performance
          </p>
        </div>
        <Link
          to="/educator/courses/new"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-[0.07] blur-2xl group-hover:opacity-[0.12] transition-opacity" />
            <div className="flex items-center gap-4">
              <div className={`rounded-2xl ${s.bg} p-3.5`}>
                <div
                  className={`rounded-xl bg-gradient-to-r ${s.gradient} p-2.5`}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-gray-900">
                  {s.value}
                </p>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
              <TrendingUp className="h-3 w-3" />
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Recent enrollments */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Recent Enrollments
          </h2>
          <Link
            to="/educator/students"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.enrolledStudentsData?.slice(0, 10).map((entry, i) => (
                <tr key={i} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={entry.student?.imageUrl}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <span className="font-semibold text-gray-900">
                        {entry.student?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {entry.courseTitle}
                  </td>
                </tr>
              ))}
              {(!data.enrolledStudentsData ||
                data.enrolledStudentsData.length === 0) && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No enrollments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
