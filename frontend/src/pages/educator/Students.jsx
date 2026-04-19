import { useEffect, useState } from "react";
import { fetchEducatorStudents } from "../../api";
import { PAGINATION } from "../../utils/constants";
import Pagination from "../../components/Pagination";
import Loading from "../../components/Loading";
import { Table, Empty } from "../../components/ui";
import { Users } from "lucide-react";

export default function EducatorStudents() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEducatorStudents({ page, limit: PAGINATION.STUDENTS_LIMIT })
      .then((r) => {
        setStudents(r.data.items);
        setPagination(r.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Loading />;

  const headers = [
    { key: "student", label: "Student" },
    { key: "email", label: "Email" },
    { key: "course", label: "Course" },
    { key: "enrolled", label: "Enrolled" },
  ];

  return (
    <div className="section">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Enrolled Students
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Students enrolled in your courses
        </p>
      </div>

      {students.length === 0 ? (
        <Empty
          icon={Users}
          title="No students yet"
          desc="Students will appear here once they enroll"
        />
      ) : (
        <>
          <Table
            headers={headers}
            data={students}
            renderRow={(s) => (
              <>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.student?.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded-full border border-[var(--border)]"
                    />
                    <span className="font-bold text-[var(--text-primary)]">
                      {s.student?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">
                  {s.student?.email}
                </td>
                <td className="px-6 py-4">
                  <span className="badge bg-[var(--primary-light)] text-[var(--primary)]">
                    {s.courseTitle}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">
                  {new Date(s.purchaseDate).toLocaleDateString()}
                </td>
              </>
            )}
            empty={<p className="text-[var(--text-secondary)]">No students</p>}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}