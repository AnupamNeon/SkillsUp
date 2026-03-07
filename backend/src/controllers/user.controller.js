import Stripe from "stripe";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

let _stripe;
const getStripe = () => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
};


/**
 * POST /api/user/sync
 * Creates or updates user in MongoDB based on Clerk data.
 * Called from frontend when user signs in but doesn't exist in DB.
 */
export const syncUser = asyncHandler(async (req, res) => {
  const userId = req.userId; // ← Use authenticated identity ONLY

  // Fetch real user data server-side from Clerk
  const clerkUser = await clerkClient.users.getUser(userId);

  let user = await User.findById(userId);
  if (user) {
    user.name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
    user.email = clerkUser.emailAddresses?.[0]?.emailAddress || user.email;
    user.imageUrl = clerkUser.imageUrl || user.imageUrl;
    user.role = clerkUser.publicMetadata?.role || user.role;
    await user.save();
  } else {
    user = await User.create({
      _id: userId,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      imageUrl: clerkUser.imageUrl || 'https://via.placeholder.com/150',
      role: clerkUser.publicMetadata?.role || 'student',
    });
  }
  res.json({ success: true, user });
});

/**
 * GET /api/user/data
 */
export const getUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) throw ApiError.notFound("User not found");
  res.json({ success: true, user });
});

/**
 * GET /api/user/enrolled-courses
 */
export const userEnrolledCourses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .populate({
      path: "enrolledCourses",
      select: "courseTitle courseThumbnail educator coursePrice discount",
      populate: { path: "educator", select: "name" },
    })
    .lean();
  if (!user) throw ApiError.notFound("User not found");
  res.json({ success: true, enrolledCourses: user.enrolledCourses });
});

/**
 * GET /api/user/enrolled-courses/:courseId/content
 * ──────────────────────────────────────────────────
 * Returns FULL course content (all lecture URLs) for enrolled students.
 * This is the fix for "no enrolled-user course content endpoint".
 */
export const getEnrolledCourseContent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.userId;

  // Verify the student is enrolled
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound("User not found");

  const isEnrolled = user.enrolledCourses
    .map(String)
    .includes(String(courseId));

  if (!isEnrolled) {
    throw ApiError.forbidden("You are not enrolled in this course");
  }

  const course = await Course.findById(courseId)
    .populate("educator", "name imageUrl")
    .lean();

  if (!course) throw ApiError.notFound("Course not found");

  // ✅ No URL stripping — enrolled students see everything
  res.json({ success: true, courseData: course });
});

/**
 * POST /api/user/purchase
 */
export const purchaseCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.userId;

  const origin =
    req.headers.origin ||
    req.headers.referer?.replace(/\/$/, "") ||
    process.env.FRONTEND_URL ||
    `http://localhost:${process.env.PORT || 5000}`;

  const [user, course] = await Promise.all([
    User.findById(userId),
    Course.findById(courseId),
  ]);

  if (!user) throw ApiError.notFound("User not found");
  if (!course) throw ApiError.notFound("Course not found");
  if (!course.isPublished) throw ApiError.badRequest("Course is not available");

  if (user.enrolledCourses.map(String).includes(String(courseId))) {
    throw ApiError.conflict("You are already enrolled in this course");
  }

  const amount = parseFloat(
    (course.coursePrice - (course.discount * course.coursePrice) / 100).toFixed(
      2
    )
  );

  // 🔒 Prevent duplicate pending purchases
  let purchase = await Purchase.findOne({
    userId,
    courseId: course._id,
    status: "pending",
  });

  if (!purchase) {
    purchase = await Purchase.create({
      courseId: course._id,
      userId,
      amount,
      status: "pending",
    });
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    success_url: `${origin}/my-enrollments`,
    cancel_url: `${origin}/`,
    line_items: [
      {
        price_data: {
          currency: (process.env.CURRENCY || "inr").toLowerCase(),
          product_data: { name: course.courseTitle },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: { purchaseId: purchase._id.toString() },
  });

  res.json({ success: true, session_url: session.url });
});

/**
 * POST /api/user/update-course-progress
 */
export const updateUserCourseProgress = asyncHandler(async (req, res) => {
  const { courseId, lectureId } = req.body;
  const userId = req.userId;

  const progress = await CourseProgress.findOne({ userId, courseId });

  if (progress) {
    if (progress.lectureCompleted.includes(lectureId)) {
      return res.json({
        success: true,
        message: "Lecture already completed",
      });
    }
    progress.lectureCompleted.push(lectureId);
    await progress.save();
  } else {
    await CourseProgress.create({
      userId,
      courseId,
      lectureCompleted: [lectureId],
    });
  }

  res.json({ success: true, message: "Progress updated" });
});

/**
 * GET /api/user/course-progress/:courseId
 * ─────────────────────────────────────────
 * FIX: Changed from POST (body) → GET (param).
 */
export const getUserCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params; // ← was req.body

  const progress = await CourseProgress.findOne({
    userId: req.userId,
    courseId,
  }).lean();

  res.json({ success: true, progressData: progress });
});

/**
 * PUT /api/user/ratings
 * ──────────────────────
 * FIX: Changed from POST /add-rating → PUT /ratings (idempotent upsert).
 */
export const addUserRating = asyncHandler(async (req, res) => {
  const { courseId, rating } = req.body;
  const userId = req.userId;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound("Course not found");

  const user = await User.findById(userId).lean();
  if (!user || !user.enrolledCourses.map(String).includes(String(courseId))) {
    throw ApiError.forbidden("You must be enrolled to rate this course");
  }

  const existingRatingIndex = course.courseRatings.findIndex(
    (r) => String(r.userId) === String(userId),
  );

  if (existingRatingIndex > -1) {
    course.courseRatings[existingRatingIndex].rating = rating;
  } else {
    course.courseRatings.push({ userId, rating });
  }

  await course.save();

  res.json({ success: true, message: "Rating saved" });
});
