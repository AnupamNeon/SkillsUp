import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { fetchAdminUsers, updateUserRole, deleteUser } from "../../api";
import { useSafeState } from "../../utils/hooks";
import { ROLES, PAGINATION } from "../../utils/constants";
import Pagination from "../../components/Pagination";
import Loading from "../../components/Loading";
import { Empty } from "../../components/ui";
import { Search, Trash2, Users as UsersIcon } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useSafeState([]);
  const [pagination, setPagination] = useSafeState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useSafeState("");
  const [roleFilter, setRoleFilter] = useSafeState("");
  const [loading, setLoading] = useSafeState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGINATION.STUDENTS_LIMIT };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await fetchAdminUsers(params);
      setUsers(data.items);
      setPagination(data.pagination);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      toast.success(`Role updated to ${role}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Permanently delete this user?")) return;
    try {
      await deleteUser(userId);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          User Management
        </h1>
        <p className="mt-1 text-gray-500">Manage user roles and permissions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="input pl-11"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="input w-auto"
        >
          <option value="">All Roles</option>
          {Object.values(ROLES).map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : users.length === 0 ? (
        <Empty
          icon={UsersIcon}
          title="No users found"
          desc="Try adjusting your search or filters"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                          h === "Actions" ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.imageUrl}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                          <span className="font-semibold text-gray-900">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u._id, e.target.value)
                          }
                          className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold ring-1 transition-all focus:ring-2 focus:ring-blue-500 ${
                            u.role === ROLES.ADMIN
                              ? "bg-red-50 text-red-700 ring-red-200/50"
                              : u.role === ROLES.EDUCATOR
                                ? "bg-purple-50 text-purple-700 ring-purple-200/50"
                                : "bg-emerald-50 text-emerald-700 ring-emerald-200/50"
                          }`}
                        >
                          {Object.values(ROLES).map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="rounded-xl border border-gray-200 p-2.5 text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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