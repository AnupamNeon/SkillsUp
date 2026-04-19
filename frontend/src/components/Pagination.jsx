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
      {/* Previous Button */}
      <button
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--text-secondary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-secondary)] disabled:hover:shadow-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* First Page */}
      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-[var(--text-secondary)] opacity-60">•••</span>}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
            p === page
              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm" // Active state: solid primary
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]" // Inactive state
          }`}
        >
          {p}
        </button>
      ))}

      {/* Last Page */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-[var(--text-secondary)] opacity-60">•••</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--text-secondary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-secondary)] disabled:hover:shadow-none"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}