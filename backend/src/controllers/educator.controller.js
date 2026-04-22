import Quiz from '../models/Quiz.js';
import { v2 as cloudinary } from 'cloudinary';
import Course from '../models/Course.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import {
  getPaginationParams,
  paginatedResponse,
} from '../utils/pagination.js';

/**
 * POST /api/educator/add-course
 */
export const addCourse = asyncHandler(async (req, res) => {
  const { courseData } = req.body;
  const imageFile = req.file;
  if (!imageFile) throw ApiError.badRequest('Thumbnail required');

  const parsed = JSON.parse(courseData);
  parsed.educator = req.userId;

  const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
    folder: 'lms/courses',
    transformation: [{ width: 800, height: 450, crop: 'fill' }],
  });
  parsed.courseThumbnail = uploadResult.secure_url;

  const newCourse = await Course.create(parsed);

  res.status(201).json({
    success: true,
    message: 'Course created',
    courseId: newCourse._id,
  });
});

/**
 * PUT /api/educator/courses/:courseId
 * Update an existing course (only the owning educator or admin).
 */
export const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const educatorId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound('Course not found');

  // Only the owning educator (or admin) may update
  if (course.educator !== educatorId && req.userRole !== 'admin') {
    throw ApiError.forbidden('You can only update your own courses');
  }

  const { courseData } = req.body;
  const imageFile = req.file;

  let parsed = {};
  if (courseData) {
    parsed = JSON.parse(courseData);
  }

  // Upload new thumbnail if provided
  if (imageFile) {
    const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
      folder: 'lms/courses',
      transformation: [{ width: 800, height: 450, crop: 'fill' }],
    });
    parsed.courseThumbnail = uploadResult.secure_url;
  }

  // Prevent overwriting protected fields
  delete parsed.educator;
  delete parsed.enrolledStudents;
  delete parsed.courseRatings;

  Object.assign(course, parsed);
  await course.save();

  logger.info('Course updated', { courseId, byUser: educatorId });

  res.json({
    success: true,
    message: 'Course updated',
    course,
  });
});

/**
 * DELETE /api/educator/courses/:courseId
 */
export const deleteCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const educatorId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  if (
    String(course.educator) !== String(educatorId) &&
    req.userRole !== "admin"
  ) {
    throw ApiError.forbidden("You can only delete your own courses");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔍 Dependency checks inside transaction
    const [quizCount, purchaseCount, enrolledCount] = await Promise.all([
      Quiz.countDocuments({ courseId }).session(session),
      Purchase.countDocuments({
        courseId,
        status: "completed",
      }).session(session),
      Course.countDocuments({
        _id: courseId,
        enrolledStudents: { $exists: true, $not: { $size: 0 } },
      }).session(session),
    ]);

    if (enrolledCount > 0 || quizCount > 0 || purchaseCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete course. Found ${enrolledCount ? "students, " : ""}` +
          `${quizCount} quizzes, ${purchaseCount} purchases. ` +
          `Unpublish the course instead.`
      );
    }

    // 🗑️ Delete course inside transaction
    await Course.findByIdAndDelete(courseId).session(session);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  // ☁️ Cloudinary cleanup (outside transaction)
  if (course.courseThumbnail) {
    try {
      const urlParts = course.courseThumbnail.split("/");
      const folder = urlParts.at(-2);
      const fileWithExt = urlParts.at(-1);
      const publicId = `lms/${folder}/${fileWithExt.replace(/\.[^/.]+$/, "")}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.warn("Failed to delete thumbnail from Cloudinary", {
        error: err.message,
      });
    }
  }

  logger.info("Course deleted", { courseId, byUser: educatorId });

  res.json({ success: true, message: "Course deleted" });
});

/**
 * PATCH /api/educator/courses/:courseId/publish
 * Toggle or explicitly set the publish state.
 * Body: { isPublished: true|false }   (optional — omit to toggle)
 */
export const togglePublish = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const educatorId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound('Course not found');

  if (course.educator !== educatorId && req.userRole !== 'admin') {
    throw ApiError.forbidden('You can only modify your own courses');
  }

  course.isPublished =
    req.body.isPublished !== undefined
      ? req.body.isPublished
      : !course.isPublished;

  await course.save();

  logger.info('Course publish toggled', {
    courseId,
    isPublished: course.isPublished,
    byUser: educatorId,
  });

  res.json({
    success: true,
    message: `Course ${course.isPublished ? 'published' : 'unpublished'}`,
    isPublished: course.isPublished,
  });
});

/**
 * GET /api/educator/courses
 */
export const getEducatorCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const educatorId = req.userId;

  const filter = { educator: educatorId };

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  res.json({
    success: true,
    ...paginatedResponse(courses, total, { page, limit }),
  });
});

/**
 * GET /api/educator/dashboard
 */
export const educatorDashboardData = asyncHandler(async (req, res) => {
  const educatorId = req.userId;

  const courses = await Course.find({ educator: educatorId }).lean();
  const courseIds = courses.map((c) => c._id);

  const purchases = await Purchase.find({
    courseId: { $in: courseIds },
    status: 'completed',
  }).lean();

  const totalEarning = purchases.reduce((sum, p) => sum + p.amount, 0);

  const studentIds = [
    ...new Set(courses.flatMap((c) => c.enrolledStudents || [])),
  ];
  const students = await User.find(
    { _id: { $in: studentIds } },
    'name imageUrl'
  ).lean();

  const enrolledStudentsData = [];
  for (const course of courses) {
    for (const sid of course.enrolledStudents || []) {
      const student = students.find((s) => String(s._id) === String(sid));
      if (student) {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student,
        });
      }
    }
  }

  res.json({
    success: true,
    dashboardData: {
      totalEarning,
      totalCourses: courses.length,
      enrolledStudentsData,
    },
  });
});

/**
 * GET /api/educator/enrolled-students
 */
export const getEnrolledStudentsData = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const educatorId = req.userId;

  const courses = await Course.find({ educator: educatorId })
    .select('_id')
    .lean();
  const courseIds = courses.map((c) => c._id);

  const filter = { courseId: { $in: courseIds }, status: 'completed' };

  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .populate('userId', 'name imageUrl email')
      .populate('courseId', 'courseTitle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Purchase.countDocuments(filter),
  ]);

  const enrolledStudents = purchases.map((p) => ({
    student: p.userId,
    courseTitle: p.courseId?.courseTitle,
    purchaseDate: p.createdAt,
  }));

  res.json({
    success: true,
    ...paginatedResponse(enrolledStudents, total, { page, limit }),
  });
});

export const getEducatorCourseById = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate('educator', 'name imageUrl')
    .lean();

  if (!course) throw ApiError.notFound('Course not found');

  // Handle both populated object and raw ObjectId
  const educatorId =
    typeof course.educator === 'object'
      ? course.educator?._id?.toString()
      : course.educator?.toString();

  if (educatorId !== req.userId && req.userRole !== 'admin') {
    throw ApiError.forbidden('You can only view your own courses');
  }

  res.json({
    success: true,
    courseData: course,
  });
});