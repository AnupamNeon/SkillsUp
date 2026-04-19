import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addCourse, updateCourse, fetchEducatorCourse } from "../../api";
import { useSafeState } from "../../utils/hooks";
import { uid, removeAndReindex } from "../../utils/helpers";
import Loading from "../../components/Loading";
import { Button } from "../../components/ui";
import {
  Plus,
  Trash2,
  GripVertical,
  ImagePlus,
  Video,
  ArrowLeft,
} from "lucide-react";

const emptyLecture = (order = 0) => ({
  lectureId: uid(),
  lectureTitle: "",
  lectureDuration: 0,
  lectureUrl: "",
  isPreviewFree: false,
  lectureOrder: order,
  lectureDescription: "",
});

const emptyChapter = (order = 0) => ({
  chapterId: uid(),
  chapterOrder: order,
  chapterTitle: "",
  chapterContent: [emptyLecture(0)],
});

export default function CourseForm() {
  const { courseId } = useParams();
  const isEdit = !!courseId;
  const navigate = useNavigate();

  const [title, setTitle] = useSafeState("");
  const [description, setDescription] = useSafeState("");
  const [price, setPrice] = useSafeState(0);
  const [discount, setDiscount] = useSafeState(0);
  const [chapters, setChapters] = useSafeState([emptyChapter(0)]);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useSafeState("");
  const [saving, setSaving] = useSafeState(false);
  const [loading, setLoading] = useSafeState(isEdit);

  useEffect(() => {
    if (!isEdit) return;

    fetchEducatorCourse(courseId)
      .then((r) => {
        const c = r.data.courseData;
        setTitle(c.courseTitle);
        setDescription(c.courseDescription);
        setPrice(c.coursePrice);
        setDiscount(c.discount);
        setThumbnailPreview(c.courseThumbnail || "");

        if (c.courseContent?.length) {
          const normalizedChapters = c.courseContent.map((ch) => ({
            ...ch,
            chapterContent: ch.chapterContent.map((lec) => ({
              ...lec,
              lectureDescription: lec.lectureDescription || "",
            })),
          }));
          setChapters(normalizedChapters);
        }
      })
      .catch(() => toast.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [courseId, isEdit]);

  const addChapter = () => {
    setChapters((prev) => [...prev, emptyChapter(prev.length)]);
  };

  const removeChapter = (idx) => {
    setChapters((prev) => removeAndReindex(prev, idx, "chapterOrder"));
  };

  const updateChapterTitle = (idx, val) =>
    setChapters((prev) =>
      prev.map((ch, i) => (i === idx ? { ...ch, chapterTitle: val } : ch))
    );

  const addLecture = (chIdx) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? {
              ...ch,
              chapterContent: [
                ...ch.chapterContent,
                emptyLecture(ch.chapterContent.length),
              ],
            }
          : ch
      )
    );
  };

  const removeLecture = (chIdx, lecIdx) => {
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? {
              ...ch,
              chapterContent: removeAndReindex(
                ch.chapterContent,
                lecIdx,
                "lectureOrder"
              ),
            }
          : ch
      )
    );
  };

  const updateLecture = (chIdx, lecIdx, field, val) =>
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? {
              ...ch,
              chapterContent: ch.chapterContent.map((lec, j) =>
                j === lecIdx ? { ...lec, [field]: val } : lec
              ),
            }
          : ch
      )
    );

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return toast.error("Title and description are required");
    }
    if (!isEdit && !thumbnail) {
      return toast.error("Thumbnail is required");
    }

    setSaving(true);

    try {
      const courseData = {
        courseTitle: title.trim(),
        courseDescription: description.trim(),
        coursePrice: Number(price),
        discount: Number(discount),
        courseContent: chapters.map((ch, ci) => ({
          ...ch,
          chapterOrder: ci,
          chapterContent: ch.chapterContent.map((lec, li) => ({
            ...lec,
            lectureOrder: li,
            lectureDuration: Number(lec.lectureDuration),
            lectureDescription: lec.lectureDescription?.trim() || "",
          })),
        })),
      };

      const formData = new FormData();
      formData.append("courseData", JSON.stringify(courseData));
      if (thumbnail) formData.append("image", thumbnail);

      if (isEdit) {
        await updateCourse(courseId, formData);
        toast.success("Course updated");
      } else {
        await addCourse(formData);
        toast.success("Course created");
      }

      navigate("/educator/courses");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <form onSubmit={handleSubmit} className="space-y-10">
        <button
          type="button"
          onClick={() => navigate("/educator/courses")}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
            {isEdit ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {isEdit
              ? "Update your course details and content"
              : "Fill in the details to create your course"}
          </p>
        </div>

        {/* Basic Information */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              Basic Information
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Course details visible to students
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">
                Course Title <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g., Complete React Developer Course"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">
                Description <span className="text-[var(--danger)]">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input"
                placeholder="Describe what students will learn…"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">
                  Price ($) <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">
                Thumbnail {!isEdit && <span className="text-[var(--danger)]">*</span>}
              </label>
              <div className="flex items-center gap-5">
                {thumbnailPreview && (
                  <div className="relative overflow-hidden rounded-xl border border-[var(--border)] shadow-sm">
                    <img
                      src={thumbnailPreview}
                      alt="preview"
                      className="h-24 w-40 object-cover"
                    />
                  </div>
                )}
                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] px-8 py-6 text-center transition-all hover:border-[var(--primary)] hover:bg-[var(--primary-light)]">
                  <div className="rounded-lg bg-[var(--bg)] p-3 transition-colors group-hover:bg-white">
                    <ImagePlus className="h-6 w-6 text-[var(--text-secondary)] group-hover:text-[var(--primary)]" />
                  </div>
                  <span className="mt-2 text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--primary)]">
                    {thumbnail ? thumbnail.name : "Upload image"}
                  </span>
                  <span className="mt-0.5 text-xs text-[var(--text-secondary)] opacity-75">
                    PNG, JPG up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnail}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--primary-light)] p-2">
                <Video className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Course Content
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Organize your chapters and lectures
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={addChapter} type="button">
              <Plus className="h-4 w-4" />
              Add Chapter
            </Button>
          </div>

          <div className="space-y-6 p-6 bg-[var(--bg)]">
            {chapters.map((ch, ci) => (
              <div
                key={ch.chapterId}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded p-1.5 text-[var(--text-secondary)] opacity-50">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-xs font-bold text-white">
                    {ci + 1}
                  </span>
                  <input
                    type="text"
                    value={ch.chapterTitle}
                    onChange={(e) => updateChapterTitle(ci, e.target.value)}
                    placeholder={`Chapter ${ci + 1} title`}
                    className="input flex-1"
                  />
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChapter(ci)}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition-all hover:bg-[#FFEBEE] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Lectures */}
                <div className="ml-8 space-y-4">
                  {ch.chapterContent.map((lec, li) => (
                    <div
                      key={lec.lectureId}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Lecture {li + 1}
                        </span>
                        {ch.chapterContent.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLecture(ci, li)}
                            className="text-[var(--text-secondary)] transition-colors hover:text-[var(--danger)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={lec.lectureTitle}
                          onChange={(e) =>
                            updateLecture(ci, li, "lectureTitle", e.target.value)
                          }
                          placeholder="Lecture title"
                          className="input"
                        />
                        <input
                          type="text"
                          value={lec.lectureUrl}
                          onChange={(e) =>
                            updateLecture(ci, li, "lectureUrl", e.target.value)
                          }
                          placeholder="Video URL"
                          className="input"
                        />
                        <input
                          type="number"
                          min="0"
                          value={lec.lectureDuration}
                          onChange={(e) =>
                            updateLecture(ci, li, "lectureDuration", e.target.value)
                          }
                          placeholder="Duration (min)"
                          className="input"
                        />
                        <label className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] transition-all">
                          <input
                            type="checkbox"
                            checked={lec.isPreviewFree}
                            onChange={(e) =>
                              updateLecture(ci, li, "isPreviewFree", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          Free Preview
                        </label>
                      </div>

                      <div className="mt-4">
                        <label className="mb-1 block text-sm font-bold text-[var(--text-primary)]">
                          Lecture Description
                        </label>
                        <textarea
                          value={lec.lectureDescription || ""}
                          onChange={(e) =>
                            updateLecture(ci, li, "lectureDescription", e.target.value)
                          }
                          placeholder="Used as fallback for AI quiz generation..."
                          rows={2}
                          className="input"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addLecture(ci)}
                    className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--primary)] transition-all hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Lecture
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => navigate("/educator/courses")}
            className="text-sm font-bold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <Button type="submit" loading={saving} disabled={saving}>
            {isEdit ? "Update Course" : "Create Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}