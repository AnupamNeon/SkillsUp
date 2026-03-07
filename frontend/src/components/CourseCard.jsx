import { Link } from "react-router-dom";
import Rating from "./Rating";
import { formatPrice } from "../utils/currency";
import { Clock, Users } from "lucide-react";

export function calcAvgRating(ratings = []) {
  if (!ratings.length) return 0;
  return ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
}

export function discountedPrice(price, discount) {
  return parseFloat((price - (discount * price) / 100).toFixed(2));
}

export default function CourseCard({ course }) {
  const avg = calcAvgRating(course.courseRatings);
  const finalPrice = discountedPrice(course.coursePrice, course.discount);

  const totalLectures =
    course.courseContent?.reduce(
      (s, ch) => s + (ch.chapterContent?.length || 0),
      0,
    ) || 0;

  return (
    <Link
      to={`/course/${course._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={course.courseThumbnail || "/placeholder.svg"}
          alt={course.courseTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {course.discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-red-500/30">
            {course.discount}% OFF
          </span>
        )}

        {/* Category-like badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          <Clock className="h-3 w-3" />
          {totalLectures} lectures
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-blue-600">
          {course.courseTitle}
        </h3>

        {course.educator && (
          <div className="mb-3 flex items-center gap-2">
            {course.educator.imageUrl && (
              <img
                src={course.educator.imageUrl}
                alt={course.educator.name}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-gray-200"
              />
            )}
            <p className="text-xs text-gray-500">
              {course.educator.name || "Educator"}
            </p>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <Rating value={avg} size="sm" />
          <span className="text-xs font-medium text-gray-400">
            {avg.toFixed(1)} ({course.courseRatings?.length || 0})
          </span>
        </div>

        {/* Divider */}
        <div className="mt-auto border-t border-gray-100 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-gray-900">
              {formatPrice(finalPrice)}
            </span>
            {course.discount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(course.coursePrice)}
              </span>
            )}
            {finalPrice <= 0 && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                FREE
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
