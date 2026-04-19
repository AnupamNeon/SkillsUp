import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchEnrolledCourseContent,
  fetchCourseProgress,
  updateCourseProgress,
  submitRating,
  fetchCourseQuizzes,
} from "../api";
import Rating from "../components/Rating";
import Loading from "../components/Loading";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  GraduationCap,
  Trophy,
  FileQuestion,
  BarChart3,        
} from "lucide-react";

export default function CoursePlayer() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openChapters, setOpenChapters] = useState({});
  const [myRating, setMyRating] = useState(0);
  const [quizzes, setQuizzes] = useState([]);
  const [showQuizzes, setShowQuizzes] = useState(false);

  // Fetch course content and progress
  useEffect(() => {
    (async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetchEnrolledCourseContent(courseId),
          fetchCourseProgress(courseId),
        ]);

        const c = courseRes.data.courseData;
        setCourse(c);
        setProgress(progressRes.data.progressData);

        if (c?.courseContent?.length) {
          const sortedChapters = [...c.courseContent].sort(
            (a, b) => a.chapterOrder - b.chapterOrder,
          );

          const firstChapter = sortedChapters[0];
          setOpenChapters({ [firstChapter.chapterId]: true });

          if (firstChapter.chapterContent?.length) {
            const sortedLectures = [...firstChapter.chapterContent].sort(
              (a, b) => a.lectureOrder - b.lectureOrder,
            );
            setActiveLecture(sortedLectures[0]);
          }
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  // Fetch quizzes
  useEffect(() => {
    fetchCourseQuizzes(courseId)
      .then((r) => setQuizzes(r.data.items || []))
      .catch(() => setQuizzes([]));
  }, [courseId]);

  const completedSet = useMemo(
    () => new Set(progress?.lectureCompleted || []),
    [progress]
  );

  const totalLectures = useMemo(() => {
    return (
      course?.courseContent?.reduce(
        (sum, ch) => sum + (ch.chapterContent?.length || 0),
        0
      ) || 0
    );
  }, [course]);

  const completedCount = completedSet.size;
  const progressPercentage = totalLectures
    ? Math.round((completedCount / totalLectures) * 100)
    : 0;

  const toggleChapter = (chapterId) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleMarkComplete = async () => {
    if (!activeLecture) return;
    try {
      await updateCourseProgress(courseId, activeLecture.lectureId);
      setProgress((prev) => ({
        ...prev,
        lectureCompleted: [
          ...(prev?.lectureCompleted || []),
          activeLecture.lectureId,
        ],
      }));
      toast.success("Lecture marked as complete");
    } catch (err) {
      toast.error(err?.message || "Failed to update progress");
    }
  };

  const handleRate = async (val) => {
    setMyRating(val);
    try {
      await submitRating(courseId, val);
      toast.success("Rating saved successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to save rating");
    }
  };

  const isYouTube = (url) =>
    url?.includes("youtube.com") || url?.includes("youtu.be");

  const getYouTubeId = (url) => {
    const match = url?.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/
    );
    return match?.[1] || "";
  };

  if (loading) return <Loading />;

  if (!course) {
    return (
      <div className="py-20 text-center text-[var(--text-secondary)]">
        Course not found or you are not enrolled.
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "w-85" : "w-0"
        } flex-shrink-0 border-r border-[#2A2A2A] bg-[#1A1A1A] transition-all duration-300 overflow-hidden`}
      >
        {sidebarOpen && (
          <div className="flex h-full flex-col">
            {/* Sidebar Header */}
            <div className="border-b border-[#2A2A2A] p-5">
              <Link
                to="/"
                className="mb-4 flex items-center gap-2 text-sm font-bold text-white hover:text-[var(--primary)] transition-colors"
              >
                <div className="rounded-md bg-[var(--primary)] p-1">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                Learning Platform
              </Link>
              <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {course.courseTitle}
              </h2>

              {/* Progress System */}
              <div className="mt-5">
                <div className="flex justify-between text-[11px] font-bold mb-2">
                  <span className="text-[var(--text-secondary)] uppercase tracking-wider">
                    Course Progress
                  </span>
                  <span className="text-[var(--success)]">
                    {progressPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--success)] transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {progressPercentage === 100 && (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--success)] bg-[#E8F5E9]/10 px-3 py-2.5 rounded-xl border border-[var(--success)]/20">
                  <Trophy className="h-4 w-4" />
                  Course Completed 🎉
                </div>
              )}
            </div>

            {/* Sidebar Tabs */}
            <div className="flex gap-2 px-4 py-3 bg-[#161616] border-b border-[#2A2A2A]">
              <button
                onClick={() => setShowQuizzes(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  !showQuizzes
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[#2A2A2A]"
                }`}
              >
                Lessons
              </button>
              <button
                onClick={() => setShowQuizzes(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  showQuizzes
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[#2A2A2A]"
                }`}
              >
                Quizzes
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {showQuizzes ? (
                <div className="space-y-2 p-2">
                  {quizzes.length === 0 ? (
                    <p className="text-center py-10 text-[var(--text-secondary)] text-xs font-bold">
                      No quizzes available for this course yet.
                    </p>
                  ) : (
                    quizzes.map((quiz) => (
                      <Link
                        key={quiz._id}
                        to={`/quiz/${quiz._id}`}
                        className="block p-4 rounded-xl bg-[#222222] border border-[#333333] hover:border-[var(--accent)] transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <FileQuestion className="h-5 w-5 text-[var(--accent)]" />
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-white group-hover:text-[var(--accent)]">
                              {quiz.quizTitle}
                            </h3>
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1 uppercase">
                              {quiz.questions?.length || 0} Questions •{" "}
                              {quiz.totalPoints} Points
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}

                  {/* Quiz History Link */}
                  {quizzes.length > 0 && (
                    <Link
                      to={`/course/${courseId}/quiz-attempts`}
                      className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#1A1A1A] px-4 py-3 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View My Quiz History
                    </Link>
                  )}
                </div>
              ) : (
                // Lessons Content
                course.courseContent
                  ?.sort((a, b) => a.chapterOrder - b.chapterOrder)
                  .map((chapter) => (
                    <div key={chapter.chapterId} className="mb-1">
                      <button
                        onClick={() => toggleChapter(chapter.chapterId)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide hover:bg-[#222222] rounded-xl transition-colors"
                      >
                        {chapter.chapterTitle}
                        {openChapters[chapter.chapterId] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {openChapters[chapter.chapterId] && (
                        <div className="mt-1 space-y-1">
                          {chapter.chapterContent
                            ?.sort((a, b) => a.lectureOrder - b.lectureOrder)
                            .map((lecture) => {
                              const isActive =
                                activeLecture?.lectureId === lecture.lectureId;
                              const isCompleted = completedSet.has(
                                lecture.lectureId
                              );

                              return (
                                <button
                                  key={lecture.lectureId}
                                  onClick={() => setActiveLecture(lecture)}
                                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all text-sm ${
                                    isActive
                                      ? "bg-[var(--primary)] text-white shadow-lg"
                                      : "hover:bg-[#252525] text-[var(--text-secondary)]"
                                  }`}
                                >
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2
                                        className={`h-4 w-4 ${
                                          isActive
                                            ? "text-white"
                                            : "text-[var(--success)]"
                                        }`}
                                      />
                                    ) : isActive ? (
                                      <PlayCircle className="h-4 w-4 text-white" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-[#444444] group-hover:text-gray-400" />
                                    )}
                                  </div>
                                  <span className="line-clamp-2 flex-1 font-bold">
                                    {lecture.lectureTitle}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            {/* RATING SECTION */}
            <div className="border-t border-[#2A2A2A] p-5 bg-[#161616]">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                Rate Experience
              </p>
              <Rating value={myRating} interactive onChange={handleRate} />
            </div>
          </div>
        )}
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex flex-1 flex-col overflow-hidden bg-black">
        {/* PLAYER TOP BAR */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-[#2A2A2A] bg-[#1A1A1A]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[#2A2A2A] hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-sm font-bold text-white line-clamp-1">
            {activeLecture?.lectureTitle || "Select a lecture"}
          </h1>
        </div>

        {/* VIDEO PLAYER AREA */}
        <div className="flex-1 flex items-center justify-center relative bg-black shadow-inner">
          {activeLecture?.lectureUrl ? (
            isYouTube(activeLecture.lectureUrl) ? (
              <iframe
                key={activeLecture.lectureId}
                src={`https://www.youtube.com/embed/${getYouTubeId(
                  activeLecture.lectureUrl
                )}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay"
                title={activeLecture.lectureTitle}
              />
            ) : (
              <video
                key={activeLecture.lectureId}
                src={activeLecture.lectureUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            )
          ) : (
            <div className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest animate-pulse">
              Buffering content...
            </div>
          )}
        </div>

        {/* PLAYER BOTTOM BAR */}
        {activeLecture && (
          <div className="p-5 border-t border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-between">
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">
              Current: {activeLecture.lectureTitle}
            </div>

            {completedSet.has(activeLecture.lectureId) ? (
              <div className="flex items-center gap-2 px-8 py-3 bg-[#E8F5E9]/10 text-[var(--success)] rounded-xl font-bold border border-[var(--success)]/20">
                <CheckCircle2 className="h-5 w-5" />
                Completed
              </div>
            ) : (
              <button
                onClick={handleMarkComplete}
                className="btn-success px-8 py-3 text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}