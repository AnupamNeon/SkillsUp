import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-8">
      <button
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-gray-200 p-2.5 text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:shadow-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-gray-300">•••</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
            p === page
              ? "border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-gray-300">•••</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-gray-200 p-2.5 text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:shadow-none"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
