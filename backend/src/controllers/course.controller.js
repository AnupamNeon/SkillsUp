import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getPaginationParams,
  paginatedResponse,
} from '../utils/pagination.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/course/all
 * Public — list published courses with search, filter, sort, pagination.
 */
export const getAllCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, minPrice, maxPrice, educator, sortBy, sortOrder } =
    req.query;

  const filter = { isPublished: true };

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { courseTitle: regex },
      { courseDescription: regex },
    ];
  }

  if (minPrice || maxPrice) {
    filter.coursePrice = {};
    if (minPrice) filter.coursePrice.$gte = parseFloat(minPrice);
    if (maxPrice) filter.coursePrice.$lte = parseFloat(maxPrice);
  }

  if (educator) filter.educator = educator;

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('-enrolledStudents') // ✅ REMOVED -courseContent
      .populate('educator', 'name imageUrl')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  // ✅ Compute totalLectures per course and strip heavy content
  const sanitizedCourses = courses.map((course) => {
    const totalLectures = course.courseContent?.reduce(
      (sum, ch) => sum + (ch.chapterContent?.length || 0),
      0
    ) || 0;

    // Remove courseContent after computing — keep payload light
    const { courseContent, ...rest } = course;

    return {
      ...rest,
      totalLectures, // ✅ Send only the count
    };
  });

  res.json({
    success: true,
    ...paginatedResponse(sanitizedCourses, total, { page, limit }),
  });
});

/**
 * GET /api/course/:id
 * Public — single course detail (non-free lecture URLs are stripped).
 */
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('educator', 'name imageUrl')
    .lean();

  if (!course) throw ApiError.notFound('Course not found');

  // Strip paid lecture URLs
  if (course.courseContent) {
    course.courseContent.forEach((chapter) => {
      chapter.chapterContent?.forEach((lecture) => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = '';
        }
      });
    });
  }

  res.json({ success: true, courseData: course });
});