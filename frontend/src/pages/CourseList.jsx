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
    <div className="section">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Explore Courses
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Discover courses that will help you grow
        </p>
      </div>

      {/* SEARCH & FILTER TOGGLE */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          {/* Refactored: Rule 7 - Applied .input utility */}
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search courses…"
            className="input pl-11"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
            showFilters || hasActiveFilters
              ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-sm"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>
      </form>

      {/* FILTERS PANEL */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showFilters ? "mb-8 max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
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
              className="input"
              placeholder="0"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
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
              className="input"
              placeholder="999"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="input cursor-pointer"
            >
              <option value="createdAt">Date Created</option>
              <option value="coursePrice">Price</option>
              <option value="courseTitle">Course Title</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="input cursor-pointer"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="flex h-[46px] items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-bold text-[var(--text-secondary)] transition-all hover:bg-[#FFEBEE] hover:text-[var(--danger)] hover:border-[var(--danger)]"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      {loading ? (
        <Loading />
      ) : courses.length === 0 ? (
        /* Refactored: Rule 10 - Removed gradients from empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-[var(--bg)] p-8 mb-4">
            <BookOpen className="h-12 w-12 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            No courses found
          </h3>
          <p className="mt-2 text-[var(--text-secondary)] font-medium">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <button
            onClick={clearFilters}
            className="btn-primary mt-6"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              Showing{" "}
              <span className="text-[var(--text-primary)]">{courses.length}</span>{" "}
              {pagination?.total && (
                <>
                  of <span className="text-[var(--text-primary)]">{pagination.total}</span>
                </>
              )}{" "}
              courses
            </p>
          </div>

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