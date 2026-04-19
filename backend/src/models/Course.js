import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    lectureId:       { type: String,  required: true },
    lectureTitle:    { type: String,  required: true, trim: true },
    lectureDuration: { type: Number,  required: true, min: 0 },
    lectureUrl:      { type: String,  required: true },
    isPreviewFree:   { type: Boolean, default: false },
    lectureOrder:    { type: Number,  required: true, min: 0 },
    lectureDescription: {
      type: String,
      default: '',
      maxlength: 5000,
      trim: true,
    },
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    chapterId:      { type: String, required: true },
    chapterOrder:   { type: Number, required: true, min: 0 },
    chapterTitle:   { type: String, required: true, trim: true },
    chapterContent: [lectureSchema],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseTitle:       { type: String, required: true, trim: true },
    courseDescription: { type: String, required: true, trim: true },
    courseThumbnail:   { type: String },
    coursePrice:       { type: Number, required: true, min: 0 },
    isPublished:       { type: Boolean, default: true },
    discount:          { type: Number, required: true, min: 0, max: 100 },
    courseContent:     [chapterSchema],
    courseRatings: [
      {
        userId: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
      },
    ],
    educator:         { type: String, ref: 'User', required: true },
    enrolledStudents: [{ type: String, ref: 'User' }],
  },
  { timestamps: true, minimize: false }
);

courseSchema.index({ courseTitle: 'text', courseDescription: 'text' });
courseSchema.index({ isPublished: 1, coursePrice: 1 });
courseSchema.index({ educator: 1 });
courseSchema.index({ createdAt: -1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;