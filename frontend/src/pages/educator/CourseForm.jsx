import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addCourse, updateCourse, fetchEducatorCourse } from "../../api";
import Loading from "../../components/Loading";
import {
  Plus,
  Trash2,
  GripVertical,
  ImagePlus,
  BookOpen,
  FileText,
  Video,
  ArrowLeft,
} from "lucide-react";

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const emptyLecture = () => ({
  lectureId: uid(),
  lectureTitle: "",
  lectureDuration: 0,
  lectureUrl: "",
  isPreviewFree: false,
  lectureOrder: 0,
});

const emptyChapter = () => ({
  chapterId: uid(),
  chapterOrder: 0,
  chapterTitle: "",
  chapterContent: [emptyLecture()],
});

export default function CourseForm() {
  const { courseId } = useParams();
  const isEdit = !!courseId;
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [chapters, setChapters] = useState([emptyChapter()]);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

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
        if (c.courseContent?.length) setChapters(c.courseContent);
      })
      .catch(() => toast.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [courseId, isEdit]);

  const addChapter = () =>
    setChapters((prev) => [
      ...prev,
      { ...emptyChapter(), chapterOrder: prev.length },
    ]);

  const removeChapter = (idx) =>
    setChapters((prev) => prev.filter((_, i) => i !== idx));

  const updateChapterTitle = (idx, val) =>
    setChapters((prev) =>
      prev.map((ch, i) => (i === idx ? { ...ch, chapterTitle: val } : ch)),
    );

  const addLecture = (chIdx) =>
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? {
              ...ch,
              chapterContent: [
                ...ch.chapterContent,
                {
                  ...emptyLecture(),
                  lectureOrder: ch.chapterContent.length,
                },
              ],
            }
          : ch,
      ),
    );

  const removeLecture = (chIdx, lecIdx) =>
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? {
              ...ch,
              chapterContent: ch.chapterContent.filter((_, j) => j !== lecIdx),
            }
          : ch,
      ),
    );

  const updateLecture = (chIdx, lecIdx, field, val) =>
    setChapters((prev) =>
      prev.map((ch, i) =>
        i === chIdx
          ? {
              ...ch,
              chapterContent: ch.chapterContent.map((lec, j) =>
                j === lecIdx ? { ...lec, [field]: val } : lec,
              ),
            }
          : ch,
      ),
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
    if (!isEdit && !thumbnail) return toast.error("Thumbnail is required");

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
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate("/educator/courses")}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Courses
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {isEdit ? "Edit Course" : "Create New Course"}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEdit
            ? "Update your course details and content"
            : "Fill in the details to create your course"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
            <div className="rounded-xl bg-blue-50 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Basic Information
              </h2>
              <p className="text-xs text-gray-500">
                Course details visible to students
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="e.g., Complete React Developer Course"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="Describe what students will learn…"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Thumbnail {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-5">
                {thumbnailPreview && (
                  <div className="relative overflow-hidden rounded-xl shadow-md">
                    <img
                      src={thumbnailPreview}
                      alt="preview"
                      className="h-24 w-40 object-cover"
                    />
                  </div>
                )}
                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-8 py-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30">
                  <div className="rounded-xl bg-gray-100 p-3 transition-colors group-hover:bg-blue-100">
                    <ImagePlus className="h-6 w-6 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    {thumbnail ? thumbnail.name : "Upload image"}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400">
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

        {/* Chapters & lectures */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2">
                <Video className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Course Content
                </h2>
                <p className="text-xs text-gray-500">
                  Organize your chapters and lectures
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={addChapter}
              className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" /> Add Chapter
            </button>
          </div>

          <div className="space-y-5 p-6">
            {chapters.map((ch, ci) => (
              <div
                key={ch.chapterId}
                className="rounded-2xl border border-gray-200/60 bg-gradient-to-b from-gray-50/50 to-white p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-gray-200/50 p-1.5 text-gray-400">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white">
                    {ci + 1}
                  </span>
                  <input
                    type="text"
                    value={ch.chapterTitle}
                    onChange={(e) => updateChapterTitle(ci, e.target.value)}
                    placeholder={`Chapter ${ci + 1} title`}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChapter(ci)}
                      className="rounded-xl border border-gray-200 p-2 text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Lectures */}
                <div className="ml-8 space-y-3">
                  {ch.chapterContent.map((lec, li) => (
                    <div
                      key={lec.lectureId}
                      className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Lecture {li + 1}
                        </span>
                        {ch.chapterContent.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLecture(ci, li)}
                            className="text-gray-400 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={lec.lectureTitle}
                          onChange={(e) =>
                            updateLecture(
                              ci,
                              li,
                              "lectureTitle",
                              e.target.value,
                            )
                          }
                          placeholder="Lecture title"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        />
                        <input
                          type="text"
                          value={lec.lectureUrl}
                          onChange={(e) =>
                            updateLecture(ci, li, "lectureUrl", e.target.value)
                          }
                          placeholder="Video URL"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        />
                        <input
                          type="number"
                          min="0"
                          value={lec.lectureDuration}
                          onChange={(e) =>
                            updateLecture(
                              ci,
                              li,
                              "lectureDuration",
                              e.target.value,
                            )
                          }
                          placeholder="Duration (min)"
                          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        />
                        <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 transition-all hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={lec.isPreviewFree}
                            onChange={(e) =>
                              updateLecture(
                                ci,
                                li,
                                "isPreviewFree",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Free Preview
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addLecture(ci)}
                    className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Lecture
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/educator/courses")}
            className="rounded-2xl border border-gray-200 px-7 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving ? "Saving…" : isEdit ? "Update Course" : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
