import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchCourseById, purchaseCourse } from "../api";
import { useAppContext } from "../context/AppContext";
import { calcAvgRating, discountedPrice } from "../components/CourseCard";
import { formatPrice } from "../utils/currency";
import Rating from "../components/Rating";
import Loading from "../components/Loading";
import {
  Clock,
  PlayCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  X,
  BookOpen,
  Award,
  Infinity,
  ShieldCheck,
} from "lucide-react";

function isYouTubeUrl(url) {
  return url?.includes("youtube") || url?.includes("youtu.be");
}

function getYouTubeId(url) {
  const match = url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/,
  );
  return match?.[1] || "";
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useAppContext();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [openChapters, setOpenChapters] = useState({});
  const [previewLecture, setPreviewLecture] = useState(null);

  useEffect(() => {
    fetchCourseById(id)
      .then((r) => setCourse(r.data.courseData))
      .catch(() => toast.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!course)
    return (
      <div className="py-20 text-center text-gray-500">Course not found.</div>
    );

  const enrolled = user?.enrolledCourses
    ?.map(String)
    .includes(String(course._id));
  const avgRating = calcAvgRating(course.courseRatings);
  const finalPrice = discountedPrice(course.coursePrice, course.discount);
  const totalLectures =
    course.courseContent?.reduce(
      (s, ch) => s + (ch.chapterContent?.length || 0),
      0,
    ) || 0;
  const totalDuration =
    course.courseContent?.reduce(
      (s, ch) =>
        s +
        (ch.chapterContent?.reduce((d, l) => d + (l.lectureDuration || 0), 0) ||
          0),
      0,
    ) || 0;

  const toggleChapter = (chId) =>
    setOpenChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));

  const handlePurchase = async () => {
    if (!isSignedIn) return toast.error("Please sign in to enroll");
    setPurchasing(true);
    try {
      const { data } = await purchaseCourse(course._id);
      if (data.session_url) {
        window.location.href = data.session_url;
      } else {
        toast.success(data.message);
        navigate("/my-enrollments");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Thumbnail */}
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={course.courseThumbnail || "/placeholder.svg"}
              alt={course.courseTitle}
              className="aspect-video w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Course info */}
          <div className="mt-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {course.courseTitle}
            </h1>

            {course.educator && (
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={course.educator.imageUrl}
                  alt={course.educator.name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div>
                  <p className="text-xs text-gray-500">Created by</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {course.educator.name}
                  </p>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                <Rating value={avgRating} size="sm" />
                <span className="text-sm font-bold text-amber-700">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-600/70">
                  ({course.courseRatings?.length || 0})
                </span>
              </div>
              {[
                {
                  icon: Users,
                  text: `${course.enrolledStudents?.length || 0} students`,
                },
                { icon: PlayCircle, text: `${totalLectures} lectures` },
                {
                  icon: Clock,
                  text: `${Math.round(totalDuration)} min total`,
                },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-sm text-gray-500"
                >
                  <Icon className="h-4 w-4" />
                  {text}
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-900">
                About this course
              </h3>
              <div className="mt-4 rounded-2xl border border-gray-200/60 bg-white p-6">
                <p className="whitespace-pre-line leading-relaxed text-gray-600">
                  {course.courseDescription}
                </p>
              </div>
            </div>

            {/* Curriculum */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Course Content
                </h3>
                <span className="text-sm text-gray-500">
                  {course.courseContent?.length || 0} chapters • {totalLectures}{" "}
                  lectures
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {course.courseContent
                  ?.sort((a, b) => a.chapterOrder - b.chapterOrder)
                  .map((ch, index) => (
                    <div
                      key={ch.chapterId}
                      className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white transition-shadow hover:shadow-sm"
                    >
                      <button
                        onClick={() => toggleChapter(ch.chapterId)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-xs font-bold text-blue-600">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {ch.chapterTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-400">
                            {ch.chapterContent?.length || 0} lectures
                          </span>
                          {openChapters[ch.chapterId] ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          openChapters[ch.chapterId]
                            ? "max-h-[1000px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="border-t border-gray-100 px-5 py-2">
                          {ch.chapterContent
                            ?.sort((a, b) => a.lectureOrder - b.lectureOrder)
                            .map((lec) =>
                              lec.isPreviewFree && lec.lectureUrl ? (
                                <button
                                  key={lec.lectureId}
                                  onClick={() => setPreviewLecture(lec)}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-blue-50/50"
                                >
                                  <div className="flex items-center gap-2.5 text-blue-600">
                                    <PlayCircle className="h-4 w-4" />
                                    <span className="font-medium">
                                      {lec.lectureTitle}
                                    </span>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                      PREVIEW
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {lec.lectureDuration} min
                                  </span>
                                </button>
                              ) : (
                                <div
                                  key={lec.lectureId}
                                  className="flex items-center justify-between px-3 py-2.5 text-sm"
                                >
                                  <div className="flex items-center gap-2.5 text-gray-600">
                                    <Lock className="h-4 w-4 text-gray-300" />
                                    {lec.lectureTitle}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {lec.lectureDuration} min
                                  </span>
                                </div>
                              ),
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Price card */}
            <div className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-xl shadow-gray-200/30">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold text-white">
                    {formatPrice(finalPrice)}
                  </span>
                  {course.discount > 0 && (
                    <span className="text-lg text-blue-200 line-through">
                      {formatPrice(course.coursePrice)}
                    </span>
                  )}
                </div>
                {course.discount > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                    🎉 {course.discount}% off
                  </span>
                )}
              </div>

              <div className="p-6">
                {enrolled ? (
                  <button
                    onClick={() => navigate(`/player/${course._id}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Continue Learning
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {purchasing
                      ? "Processing…"
                      : finalPrice <= 0
                        ? "Enroll Free"
                        : "Enroll Now"}
                  </button>
                )}

                {/* Features */}
                <ul className="mt-6 space-y-3">
                  {[
                    {
                      icon: PlayCircle,
                      text: `${totalLectures} lectures`,
                    },
                    {
                      icon: Clock,
                      text: `${Math.round(totalDuration)} minutes of content`,
                    },
                    {
                      icon: Users,
                      text: `${course.enrolledStudents?.length || 0} enrolled`,
                    },
                    { icon: Infinity, text: "Lifetime access" },
                    { icon: Award, text: "Certificate of completion" },
                    { icon: ShieldCheck, text: "30-day money back guarantee" },
                  ].map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="flex items-center gap-3 text-sm text-gray-600"
                    >
                      <div className="rounded-lg bg-gray-50 p-1.5">
                        <Icon className="h-4 w-4 text-gray-400" />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewLecture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewLecture(null)}
        >
          <div
            className="relative w-full max-w-4xl animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewLecture(null)}
              className="absolute -top-12 right-0 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Close <X className="h-4 w-4" />
            </button>

            <div className="mb-3 px-1">
              <h3 className="text-sm font-semibold text-white">
                Preview: {previewLecture.lectureTitle}
              </h3>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
              {isYouTubeUrl(previewLecture.lectureUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(previewLecture.lectureUrl)}?autoplay=1`}
                  className="aspect-video w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={previewLecture.lectureTitle}
                />
              ) : (
                <video
                  src={previewLecture.lectureUrl}
                  controls
                  autoPlay
                  className="aspect-video w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
