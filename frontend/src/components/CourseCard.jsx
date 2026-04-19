import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import Rating from "./Rating";
import { formatPrice } from "../utils/currency";
import { Clock } from "lucide-react";

export function calcAvgRating(ratings = []) {
  if (!ratings.length) return 0;
  return ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
}

export function discountedPrice(price, discount) {
  return parseFloat((price - (discount * price) / 100).toFixed(2));
}

function CourseCard({ course }) {
  const avg = useMemo(
    () => calcAvgRating(course.courseRatings),
    [course.courseRatings]
  );

  const finalPrice = useMemo(
    () => discountedPrice(course.coursePrice, course.discount),
    [course.coursePrice, course.discount]
  );

  const totalLectures = useMemo(() => {
    return (
      course.courseContent?.reduce(
        (s, ch) => s + (ch.chapterContent?.length || 0),
        0
      ) || 0
    );
  }, [course.courseContent]);

  return (
    <Link
      to={`/course/${course._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.12)]"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video overflow-hidden bg-[var(--bg)] border-b border-[var(--border)]">
        <img
          src={course.courseThumbnail || "/placeholder.svg"}
          alt={course.courseTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Discount Badge - Solid Danger Color, No Gradients */}
        {course.discount > 0 && (
          <span className="absolute right-3 top-3 rounded-md bg-[var(--danger)] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {course.discount}% OFF
          </span>
        )}

        {/* Lectures Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-[var(--surface)]/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] shadow-sm backdrop-blur-sm">
          <Clock className="h-3 w-3 text-[var(--text-secondary)]" />
          {totalLectures} lectures
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--primary)]">
          {course.courseTitle}
        </h3>

        {course.educator && (
          <div className="mb-3 flex items-center gap-2">
            {course.educator.imageUrl ? (
              <img
                src={course.educator.imageUrl}
                alt={course.educator.name}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-[var(--border)]"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-[var(--primary-light)] ring-1 ring-[var(--border)]"></div>
            )}
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              {course.educator.name || "Educator"}
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2">
          <Rating value={avg} size="sm" />
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            {avg.toFixed(1)} ({course.courseRatings?.length || 0})
          </span>
        </div>

        {/* Footer / Pricing */}
        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-[var(--text-primary)]">
              {formatPrice(finalPrice)}
            </span>

            {course.discount > 0 && (
              <span className="text-sm font-medium text-[var(--text-secondary)] line-through">
                {formatPrice(course.coursePrice)}
              </span>
            )}

            {finalPrice <= 0 && (
              <span className="ml-auto rounded-md bg-[#E8F5E9] px-2 py-1 text-[10px] font-bold tracking-wide text-[var(--success)] uppercase">
                FREE
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default memo(CourseCard);