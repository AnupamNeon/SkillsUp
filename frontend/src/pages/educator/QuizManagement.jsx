import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchEducatorCourse,
  fetchEducatorQuizzes,
  deleteQuiz,
} from "../../api";
import { useSafeState } from "../../utils/hooks";
import QuizGenerator from "../../components/QuizGenerator";
import Loading from "../../components/Loading";
import { Empty, Button } from "../../components/ui";
import {
  ArrowLeft,
  Sparkles,
  Plus,
  BookOpen,
  Trash2,
  HelpCircle,
  Eye,
} from "lucide-react";

export default function QuizManagement() {
  const { courseId } = useParams();
  const [course, setCourse] = useSafeState(null);
  const [quizzes, setQuizzes] = useSafeState([]);
  const [loading, setLoading] = useSafeState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const loadData = async () => {
    try {
      const [courseRes, quizRes] = await Promise.all([
        fetchEducatorCourse(courseId),
        fetchEducatorQuizzes(courseId),
      ]);
      setCourse(courseRes.data.courseData);
      setQuizzes(quizRes.data.items || []);
    } catch (err) {
      toast.error("Failed to load course or quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm("Delete this quiz? This action cannot be undone.")) return;

    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted successfully");
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      toast.error(err.message || "Failed to delete quiz");
    }
  };

  // Group quizzes by chapter
  const quizzesByChapter = quizzes.reduce((acc, quiz) => {
    const key = quiz.chapterId || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(quiz);
    return acc;
  }, {});

  if (loading) return <Loading />;
  if (!course) return null;

  return (
    <div className="section">
      <Link
        to="/educator/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Courses
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          Quiz Management
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Generate AI quizzes or manage quizzes for{" "}
          <span className="font-bold text-[var(--text-primary)]">
            {course.courseTitle}
          </span>
        </p>
      </div>

      {/* Chapters with Quizzes */}
      <div className="space-y-6">
        {course.courseContent
          ?.sort((a, b) => a.chapterOrder - b.chapterOrder)
          .map((chapter, index) => {
            const chapterQuizzes = quizzesByChapter[chapter.chapterId] || [];

            return (
              <div key={chapter.chapterId} className="card !p-0 overflow-hidden">
                {/* Chapter Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {chapter.chapterTitle}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {chapter.chapterContent?.length || 0} lectures •{" "}
                        {chapterQuizzes.length} quiz
                        {chapterQuizzes.length !== 1 ? "zes" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setShowGenerator(true);
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Generate Quiz
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        toast("Manual quiz creation is coming soon!", {
                          icon: "📝",
                          description: "You can currently create quizzes via API or use AI generation.",
                          duration: 5000,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Manual Quiz
                    </Button>
                  </div>
                </div>

                {/* Existing Quizzes List */}
                {chapterQuizzes.length > 0 ? (
                  <div className="divide-y divide-[var(--border)] bg-[var(--surface)] px-6">
                    {chapterQuizzes.map((quiz) => (
                      <div
                        key={quiz._id}
                        className="flex items-center justify-between py-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-[var(--primary-light)] p-2.5">
                            <HelpCircle className="h-5 w-5 text-[var(--primary)]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-[var(--text-primary)]">
                              {quiz.quizTitle}
                            </h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {quiz.questions?.length || 0} questions •{" "}
                              {quiz.totalPoints || 0} points
                              {" • "}
                              <span
                                className={`font-bold ${
                                  quiz.generatedBy === "ai"
                                    ? "text-[var(--primary)]"
                                    : "text-[var(--text-secondary)]"
                                }`}
                              >
                                {quiz.generatedBy === "ai" ? "AI Generated" : "Manual"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/educator/quiz/${quiz._id}/preview`}
                            className="rounded-lg p-2.5 text-[var(--text-secondary)] transition-all hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                            title="Preview Quiz"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>

                          <button
                            onClick={() => handleDeleteQuiz(quiz._id)}
                            className="rounded-lg p-2.5 text-[var(--text-secondary)] transition-all hover:bg-[#FFEBEE] hover:text-[var(--danger)]"
                            title="Delete Quiz"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[var(--bg)] px-6 py-8 text-center">
                    <p className="text-sm font-medium text-[var(--text-secondary)] opacity-75">
                      No quizzes created for this chapter yet.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

        {/* Empty State (No Chapters) */}
        {(!course.courseContent || course.courseContent.length === 0) && (
          <Empty
            icon={BookOpen}
            title="No chapters yet"
            desc="You need to add chapters and lectures to your course before you can create quizzes."
            action={
              <Link to={`/educator/courses/${courseId}/edit`} className="btn-primary">
                Edit Course & Add Chapters
              </Link>
            }
          />
        )}
      </div>

      {/* AI Quiz Generator Modal */}
      {showGenerator && selectedChapter && (
        <QuizGenerator
          courseId={courseId}
          chapterId={selectedChapter.chapterId}
          chapterTitle={selectedChapter.chapterTitle}
          onSuccess={() => {
            loadData();
            toast.success("Quiz generated successfully!");
          }}
          onClose={() => {
            setShowGenerator(false);
            setSelectedChapter(null);
          }}
        />
      )}
    </div>
  );
}