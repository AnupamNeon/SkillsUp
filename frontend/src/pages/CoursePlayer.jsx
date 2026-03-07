import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  fetchEnrolledCourseContent,
  fetchCourseProgress,
  updateCourseProgress,
  submitRating,
} from '../api';
import Rating from '../components/Rating';
import Loading from '../components/Loading';
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
} from 'lucide-react';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openChapters, setOpenChapters] = useState({});
  const [myRating, setMyRating] = useState(0);

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

        if (c.courseContent?.length) {
          const sorted = [...c.courseContent].sort(
            (a, b) => a.chapterOrder - b.chapterOrder
          );
          const firstChapter = sorted[0];
          setOpenChapters({ [firstChapter.chapterId]: true });
          if (firstChapter.chapterContent?.length) {
            const sortedLecs = [...firstChapter.chapterContent].sort(
              (a, b) => a.lectureOrder - b.lectureOrder
            );
            setActiveLecture(sortedLecs[0]);
          }
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const completedSet = useMemo(
    () => new Set(progress?.lectureCompleted || []),
    [progress]
  );

  const totalLectures = useMemo(
    () =>
      course?.courseContent?.reduce(
        (s, ch) => s + (ch.chapterContent?.length || 0),
        0
      ) || 0,
    [course]
  );

  const pct = totalLectures
    ? Math.round((completedSet.size / totalLectures) * 100)
    : 0;

  const toggleChapter = (chId) =>
    setOpenChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));

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
      toast.success('Marked as complete');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRate = async (val) => {
    setMyRating(val);
    try {
      await submitRating(courseId, val);
      toast.success('Rating saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!course)
    return (
      <div className="py-20 text-center text-gray-500">Course not found.</div>
    );

  const isYouTube =
    activeLecture?.lectureUrl?.includes('youtube') ||
    activeLecture?.lectureUrl?.includes('youtu.be');

  const getYouTubeId = (url) => {
    const match = url?.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/
    );
    return match?.[1] || '';
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } flex-shrink-0 overflow-hidden border-r border-gray-800 bg-gray-900 transition-all duration-300`}
      >
        {sidebarOpen && (
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className="border-b border-gray-800 p-4">
              <Link
                to="/"
                className="mb-4 flex items-center gap-2 text-sm font-bold text-white"
              >
                <div className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 p-1">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                EduLMS
              </Link>

              <h2 className="line-clamp-2 text-sm font-semibold text-gray-200">
                {course.courseTitle}
              </h2>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-bold text-blue-400">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-600">
                  {completedSet.size} of {totalLectures} completed
                </p>
              </div>

              {pct === 100 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400">
                  <Trophy className="h-4 w-4" />
                  Course Completed! 🎉
                </div>
              )}
            </div>

            {/* Chapters list */}
            <div className="flex-1 overflow-y-auto p-3">
              {course.courseContent
                ?.sort((a, b) => a.chapterOrder - b.chapterOrder)
                .map((ch) => (
                  <div key={ch.chapterId} className="mb-1">
                    <button
                      onClick={() => toggleChapter(ch.chapterId)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800/50"
                    >
                      <span className="line-clamp-1">{ch.chapterTitle}</span>
                      {openChapters[ch.chapterId] ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-600" />
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openChapters[ch.chapterId]
                          ? 'max-h-[500px] opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="space-y-0.5 py-1 pl-2">
                        {ch.chapterContent
                          ?.sort((a, b) => a.lectureOrder - b.lectureOrder)
                          .map((lec) => {
                            const done = completedSet.has(lec.lectureId);
                            const active =
                              activeLecture?.lectureId === lec.lectureId;
                            return (
                              <button
                                key={lec.lectureId}
                                onClick={() => setActiveLecture(lec)}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all ${
                                  active
                                    ? 'bg-blue-500/10 text-blue-400 font-semibold ring-1 ring-blue-500/20'
                                    : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                ) : active ? (
                                  <PlayCircle className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 flex-shrink-0 text-gray-700" />
                                )}
                                <span className="line-clamp-1 flex-1">
                                  {lec.lectureTitle}
                                </span>
                                <span className="flex-shrink-0 text-gray-600">
                                  {lec.lectureDuration}m
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Rating */}
            <div className="border-t border-gray-800 p-4">
              <p className="mb-2 text-xs font-semibold text-gray-500">
                Rate this course
              </p>
              <Rating
                value={myRating}
                interactive
                onChange={handleRate}
                size="lg"
              />
            </div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900/50 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <div className="h-5 w-px bg-gray-800" />
          <h2 className="line-clamp-1 text-sm font-semibold text-gray-300">
            {activeLecture?.lectureTitle || 'Select a lecture'}
          </h2>
        </div>

        {/* Video */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-black p-0">
          {activeLecture?.lectureUrl ? (
            isYouTube ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(activeLecture.lectureUrl)}`}
                className="aspect-video h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <video
                key={activeLecture.lectureId}
                src={activeLecture.lectureUrl}
                controls
                className="aspect-video h-full w-full"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <div className="rounded-2xl bg-gray-900 p-6">
                <PlayCircle className="h-16 w-16 text-gray-700" />
              </div>
              <p className="text-sm font-medium">Select a lecture to start</p>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {activeLecture && (
          <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/50 px-6 py-3 backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-400">
              {activeLecture.lectureTitle}
            </p>
            <button
              onClick={handleMarkComplete}
              disabled={completedSet.has(activeLecture.lectureId)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                completedSet.has(activeLecture.lectureId)
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completedSet.has(activeLecture.lectureId)
                ? 'Completed'
                : 'Mark Complete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}