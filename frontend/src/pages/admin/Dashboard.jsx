import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboard } from "../../api";
import { formatPrice } from "../../utils/currency";
import Loading from "../../components/Loading";
import {
  Users,
  BookOpen,
  DollarSign,
  UserCheck,
  GraduationCap,
  Eye,
  TrendingUp,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboard()
      .then((r) => setData(r.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return null;

  const stats = [
    {
      label: "Total Users",
      value: data.totalUsers,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
    },
    {
      label: "Educators",
      value: data.totalEducators,
      icon: GraduationCap,
      gradient: "from-purple-500 to-violet-600",
      bg: "bg-purple-50",
    },
    {
      label: "Students",
      value: data.totalStudents,
      icon: UserCheck,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Courses",
      value: data.totalCourses,
      icon: BookOpen,
      gradient: "from-orange-500 to-amber-600",
      bg: "bg-orange-50",
    },
    {
      label: "Published",
      value: data.publishedCourses,
      icon: Eye,
      gradient: "from-teal-500 to-cyan-600",
      bg: "bg-teal-50",
    },
    {
      label: "Revenue",
      value: formatPrice(data.totalRevenue),
      icon: DollarSign,
      gradient: "from-yellow-500 to-orange-500",
      bg: "bg-yellow-50",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 p-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">Platform overview and management</p>
          </div>
        </div>
        <Link
          to="/admin/users"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Manage Users
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-2xl ${s.bg} p-3.5`}>
                <div
                  className={`rounded-xl bg-gradient-to-r ${s.gradient} p-2.5`}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {s.value}
                </p>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              Active
            </div>
          </div>
        ))}
      </div>

      {/* Recent purchases */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Purchases</h2>
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
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentPurchases?.map((p, i) => (
                <tr key={i} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {p.userId?.name}
                      </p>
                      <p className="text-xs text-gray-400">{p.userId?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {p.courseId?.courseTitle}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatPrice(p.amount)}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!data.recentPurchases || data.recentPurchases.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <DollarSign className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No purchases yet
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
