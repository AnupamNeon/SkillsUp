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
      <div className="py-20 text-center text-[var(--text-secondary)] font-medium">Course not found.</div>
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
    <div className="section">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2">
          
          {/* 10. GRADIENT USAGE: Hero Section (Title & Thumbnail area) */}
          <div className="hero-gradient rounded-3xl p-1 mb-8 shadow-sm">
            <div className="relative overflow-hidden rounded-[calc(1.5rem-4px)] bg-[var(--surface)]">
              <img
                src={course.courseThumbnail || "/placeholder.svg"}
                alt={course.courseTitle}
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>

          {/* COURSE INFO */}
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {course.courseTitle}
            </h1>

            {course.educator && (
              <div className="flex items-center gap-3">
                <img
                  src={course.educator.imageUrl}
                  alt={course.educator.name}
                  className="h-10 w-10 rounded-full object-cover border border-[var(--border)]"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Created by</p>
                  <p className="text-sm font-bold text-[var(--primary)]">
                    {course.educator.name}
                  </p>
                </div>
              </div>
            )}

            {/* META STRIP */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 rounded-lg bg-[#FFF3E0] px-3 py-1.5">
                <Rating value={avgRating} size="sm" />
                <span className="text-sm font-bold text-[var(--accent)]">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-[var(--text-secondary)] opacity-70">
                  ({course.courseRatings?.length || 0})
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-bold text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.enrolledStudents?.length || 0} students</div>
                <div className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> {totalLectures} lectures</div>
                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {Math.round(totalDuration)} min</div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="pt-10">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">About this course</h3>
              <div className="mt-4 card shadow-none bg-[var(--surface)] border-[var(--border)] p-6">
                <p className="whitespace-pre-line leading-relaxed text-[var(--text-secondary)] font-medium">
                  {course.courseDescription}
                </p>
              </div>
            </div>

            {/* CURRICULUM */}
            <div className="pt-10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Course Content</h3>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {course.courseContent?.length || 0} chapters • {totalLectures} lectures
                </span>
              </div>

              <div className="space-y-3">
                {course.courseContent
                  ?.sort((a, b) => a.chapterOrder - b.chapterOrder)
                  .map((ch, index) => (
                    /* 3. CARD SYSTEM: Used for Chapter List */
                    <div key={ch.chapterId} className="card !p-0 overflow-hidden shadow-none border-[var(--border)]">
                      <button
                        onClick={() => toggleChapter(ch.chapterId)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--bg)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {ch.chapterTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                            {ch.chapterContent?.length || 0} lectures
                          </span>
                          {openChapters[ch.chapterId] ? (
                            <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                          )}
                        </div>
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ${openChapters[ch.chapterId] ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                        <div className="border-t border-[var(--border)] bg-[var(--bg)] px-5 py-2">
                          {ch.chapterContent
                            ?.sort((a, b) => a.lectureOrder - b.lectureOrder)
                            .map((lec) =>
                              lec.isPreviewFree && lec.lectureUrl ? (
                                <button
                                  key={lec.lectureId}
                                  onClick={() => setPreviewLecture(lec)}
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary-light)]"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <PlayCircle className="h-4 w-4" />
                                    <span>{lec.lectureTitle}</span>
                                    <span className="badge bg-[var(--primary)] text-white text-[9px] px-2 py-0">PREVIEW</span>
                                  </div>
                                  <span className="text-xs opacity-60 font-medium">{lec.lectureDuration} min</span>
                                </button>
                              ) : (
                                <div key={lec.lectureId} className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] opacity-70">
                                  <div className="flex items-center gap-2.5">
                                    <Lock className="h-4 w-4 opacity-40" />
                                    {lec.lectureTitle}
                                  </div>
                                  <span className="text-xs">{lec.lectureDuration} min</span>
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

        {/* SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            
            {/* 4. BUTTON SYSTEM & PRICE CARD */}
            <div className="card overflow-hidden shadow-sm border-[var(--border)] !p-0">
              {/* Header: Neutral bg, no gradient (Rule 10) */}
              <div className="bg-[var(--bg)] border-b border-[var(--border)] px-6 py-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[var(--text-primary)]">
                    {formatPrice(finalPrice)}
                  </span>
                  {course.discount > 0 && (
                    <span className="text-lg text-[var(--text-secondary)] line-through opacity-60">
                      {formatPrice(course.coursePrice)}
                    </span>
                  )}
                </div>
                {course.discount > 0 && (
                  <span className="mt-2 badge bg-[#FFF3E0] text-[var(--accent)] border border-[var(--accent)]/20">
                    🎉 {course.discount}% off
                  </span>
                )}
              </div>

              <div className="p-6 space-y-4">
                {enrolled ? (
                  <button
                    onClick={() => navigate(`/player/${course._id}`)}
                    className="btn-success w-full text-base py-4"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Continue Learning
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    /* Rule 4: Use Orange Accent for Enrollment/Buy */
                    className="btn-accent w-full text-base py-4"
                  >
                    {purchasing ? "Processing…" : finalPrice <= 0 ? "Enroll Free" : "Enroll Now"}
                  </button>
                )}

                {/* 12. PRIORITIZE LEARNING EXPERIENCE: Feature List */}
                <ul className="space-y-3 pt-4 border-t border-[var(--border)]">
                  {[
                    { icon: PlayCircle, text: `${totalLectures} lectures` },
                    { icon: Clock, text: `${Math.round(totalDuration)} min content` },
                    { icon: Users, text: `${course.enrolledStudents?.length || 0} enrolled` },
                    { icon: Infinity, text: "Lifetime access" },
                    { icon: Award, text: "Certificate" },
                    { icon: ShieldCheck, text: "30-day money back" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm font-bold text-[var(--text-secondary)]">
                      <div className="rounded-md bg-[var(--bg)] p-1.5">
                        <Icon className="h-4 w-4 text-[var(--primary)]" />
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

      {/* PREVIEW MODAL */}
      {previewLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" onClick={() => setPreviewLecture(null)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewLecture(null)} className="absolute -top-12 right-0 flex items-center gap-1.5 text-white font-bold text-sm">
              Close <X className="h-5 w-5" />
            </button>
            <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
              {isYouTubeUrl(previewLecture.lectureUrl) ? (
                <iframe src={`https://www.youtube.com/embed/${getYouTubeId(previewLecture.lectureUrl)}?autoplay=1`} className="aspect-video w-full" allowFullScreen allow="autoplay" />
              ) : (
                <video src={previewLecture.lectureUrl} controls autoPlay className="aspect-video w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}