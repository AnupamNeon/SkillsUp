import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEducatorDashboard } from "../../api";
import { formatPrice } from "../../utils/currency";
import { useSafeState } from "../../utils/hooks";
import Loading from "../../components/Loading";
import { Table } from "../../components/ui";
import { DollarSign, BookOpen, Users, Plus, TrendingUp } from "lucide-react";

export default function EducatorDashboard() {
  const [data, setData] = useSafeState(null);
  const [loading, setLoading] = useSafeState(true);

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
      colorClass: "bg-[#E8F5E9] text-[var(--success)]",
      change: "+12% this month",
    },
    {
      label: "Total Courses",
      value: data.totalCourses,
      icon: BookOpen,
      colorClass: "bg-[var(--primary-light)] text-[var(--primary)]",
      change: `${data.totalCourses} published`,
    },
    {
      label: "Total Students",
      value: data.enrolledStudentsData?.length || 0,
      icon: Users,
      colorClass: "bg-[var(--primary-light)] text-[var(--primary)]",
      change: "Across all courses",
    },
  ];

  const headers = [
    { key: "student", label: "Student" },
    { key: "course", label: "Course" },
  ];

  return (
    <div className="section">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
            Educator Dashboard
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Overview of your teaching performance
          </p>
        </div>
        <Link to="/educator/courses/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-6 border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${s.colorClass}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {s.value}
                </p>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  {s.label}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)]">
              <TrendingUp className="h-4 w-4" />
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Enrollments */}
      <div className="card !p-0 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Recent Enrollments
          </h2>
          <Link
            to="/educator/students"
            className="text-sm font-bold text-[var(--primary)] hover:opacity-80 transition-opacity"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <Table
            headers={headers}
            data={data.enrolledStudentsData?.slice(0, 10) || []}
            renderRow={(entry) => (
              <>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={entry.student?.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-[var(--border)]"
                    />
                    <span className="font-bold text-[var(--text-primary)]">
                      {entry.student?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">
                  {entry.courseTitle}
                </td>
              </>
            )}
            empty={
              <div className="text-center text-[var(--text-secondary)]">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                No enrollments yet
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}