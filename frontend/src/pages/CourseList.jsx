import { useState, useEffect, useCallback } from "react";
import { fetchCourses } from "../api";
import CourseCard from "../components/CourseCard";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import { Search, SlidersHorizontal, X, BookOpen } from "lucide-react";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sortBy, sortOrder };
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const { data } = await fetchCourses(params);
      setCourses(data.items);
      setPagination(data.pagination);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [page, search, minPrice, maxPrice, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    minPrice || maxPrice || sortBy !== "createdAt" || sortOrder !== "desc";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Explore Courses
        </h1>
        <p className="mt-2 text-gray-500">
          Discover courses that will help you grow
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search courses…"
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>
      </form>

      {/* Filters */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showFilters ? "mb-6 max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
              className="w-28 rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              className="w-28 rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder="999"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="createdAt">Date</option>
              <option value="coursePrice">Price</option>
              <option value="courseTitle">Title</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <Loading />
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="rounded-2xl bg-gray-100 p-6">
            <BookOpen className="h-12 w-12 text-gray-300" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            No courses found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="mb-4 text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {courses.length}
            </span>{" "}
            {pagination?.totalItems && (
              <>
                of{" "}
                <span className="font-semibold text-gray-700">
                  {pagination.totalItems}
                </span>
              </>
            )}{" "}
            courses
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
