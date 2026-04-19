# LMS Backend API

A robust, production-ready Learning Management System (LMS) REST API built with Node.js and Express. Features AI-powered quiz generation, Stripe payments, Clerk authentication, and role-based access control.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication & Roles](#authentication--roles)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Features

- 🔐 **Authentication** via [Clerk](https://clerk.com) with webhook sync
- 👥 **Role-based access control** — Student, Educator, Admin
- 🎓 **Course management** — create, update, publish/unpublish, delete
- 🛒 **Stripe payments** — checkout sessions, webhook fulfillment, idempotent enrollment
- 🤖 **AI quiz generation** — powered by Google Gemini, using YouTube transcripts
- 📊 **Analytics dashboards** — per educator and platform-wide admin view
- 📁 **Image uploads** — Cloudinary integration via Multer
- 📈 **Pagination** — standardised across all list endpoints
- 🛡️ **Security** — Helmet, CORS, rate limiting, input validation
- 🪵 **Structured logging** — Winston with environment-aware formatting
- ♻️ **Idempotent webhooks** — safe Stripe retry handling
- 🔁 **Transaction support** — auto-detects MongoDB replica set capability

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | Clerk |
| Payments | Stripe |
| AI | Google Gemini (`gemini-2.5-flash`) |
| File Storage | Cloudinary |
| File Upload | Multer |
| Validation | express-validator |
| Logging | Winston + Morgan |
| Rate Limiting | express-rate-limit |
| YouTube | youtubei.js |

---

## Project Structure

```
├── app.js                    # Express app setup
├── server.js                 # Entry point
├── config/
│   ├── ai.js                 # Gemini AI client
│   ├── cloudinary.js         # Cloudinary configuration
│   ├── database.js           # MongoDB connection
│   ├── env.js                # Environment validation & defaults
│   └── multer.js             # File upload configuration
├── controllers/
│   ├── admin.controller.js   # Admin operations
│   ├── course.controller.js  # Public course browsing
│   ├── educator.controller.js# Educator course management
│   ├── quiz.controller.js    # Quiz generation & attempts
│   ├── user.controller.js    # User data & purchases
│   └── webhook.controller.js # Clerk & Stripe webhooks
├── middleware/
│   ├── auth.js               # authenticate / authorize guards
│   ├── errorHandler.js       # Global error handler
│   ├── rateLimiter.js        # Rate limit presets
│   ├── requestLogger.js      # Morgan HTTP logging
│   └── validate.js           # express-validator runner
├── models/
│   ├── Course.js
│   ├── CourseProgress.js
│   ├── Purchase.js
│   ├── Quiz.js
│   ├── QuizAttempt.js
│   └── User.js
├── routes/
│   ├── index.js              # Route aggregator
│   ├── admin.routes.js
│   ├── course.routes.js
│   ├── educator.routes.js
│   ├── quiz.routes.js
│   ├── user.routes.js
│   └── webhook.routes.js
├── utils/
│   ├── ApiError.js           # Standardised error class
│   ├── asyncHandler.js       # Async route wrapper
│   ├── logger.js             # Winston logger
│   ├── pagination.js         # Pagination helpers
│   ├── roles.js              # Role constants
│   └── youtubeService.js     # Transcript fetching + caching
└── validators/
    ├── admin.validator.js
    ├── course.validator.js
    ├── educator.validator.js
    ├── quiz.validator.js
    └── user.validator.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (replica set recommended for transactions)
- Clerk account
- Stripe account
- Cloudinary account
- Google AI Studio API key (Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/AnupamNeon/SkiilsUp.git
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env
# Fill in your values (see Environment Variables section)

# Start development server
npm run dev

# Start production server
npm start
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `CLERK_WEBHOOK_SECRET` | ✅ | — | Clerk webhook signing secret |
| `STRIPE_SECRET_KEY` | ✅ | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — | Stripe webhook signing secret |
| `CLOUDINARY_NAME` | ✅ | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | — | Cloudinary API key |
| `CLOUDINARY_SECRET_KEY` | ✅ | — | Cloudinary API secret |
| `GEMINI_API_KEY` | ⚠️ | — | Required for AI quiz generation |
| `AI_PROVIDER` | ❌ | `gemini` | AI provider selection |
| `NODE_ENV` | ❌ | `development` | `development`, `production`, or `test` |
| `PORT` | ❌ | `5000` | Server port |
| `CORS_ORIGIN` | ❌ | `*` | Comma-separated allowed origins |
| `CURRENCY` | ❌ | `inr` | Stripe currency code (supports aliases: `Rs`→`inr`, `$`→`usd`) |
| `ADMIN_CLERK_USER_IDS` | ❌ | — | Comma-separated bootstrap admin Clerk IDs |
| `RATE_LIMIT_WINDOW_MS` | ❌ | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX` | ❌ | `100` | Max requests per window |
| `MONGODB_URI` | ✅ | - | Database mongoDb connection string |
| `FRONTEND_URL` | ❌ | — | Used as fallback in Stripe redirects |

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

### Health Check

```
GET /health           # Basic server health
GET /api/health       # Database-aware health check
```

---

### Public Course Routes `/api/course`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/all` | List published courses (search, filter, sort, paginate) |
| `GET` | `/:id` | Get course detail (paid lecture URLs stripped) |


### User Routes `/api/user`

> All routes require authentication (Clerk JWT).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/sync` | Sync Clerk user to MongoDB |
| `GET` | `/data` | Get current user profile |
| `GET` | `/enrolled-courses` | List enrolled courses |
| `GET` | `/enrolled-courses/:courseId/content` | Full course content (enrolled only) |
| `POST` | `/purchase` | Create Stripe checkout session |
| `POST` | `/update-course-progress` | Mark a lecture as completed |
| `GET` | `/course-progress/:courseId` | Get progress for a course |
| `PUT` | `/ratings` | Add or update a course rating (1–5) |

### Educator Routes `/api/educator`

> Requires Educator or Admin role.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/add-course` | Create a course (multipart/form-data) |
| `GET` | `/courses` | List educator's own courses |
| `GET` | `/courses/:courseId` | Get single course (owner only) |
| `PUT` | `/courses/:courseId` | Update course (multipart/form-data) |
| `DELETE` | `/courses/:courseId` | Delete course (no enrolled students) |
| `PATCH` | `/courses/:courseId/publish` | Toggle publish state |
| `PUT` | `/courses/:courseId/lecture-descriptions` | Bulk update lecture descriptions |
| `GET` | `/dashboard` | Earnings, courses, student data |
| `GET` | `/enrolled-students` | Paginated enrolled student list |

### Quiz Routes `/api/quiz`

#### Educator-only

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/check-content` | Check if AI quiz can be generated for a chapter |
| `POST` | `/generate` | Generate AI quiz from YouTube transcript |
| `POST` | `/manual` | Create a manually written quiz |
| `PUT` | `/:quizId` | Update quiz settings or questions |
| `DELETE` | `/:quizId` | Delete quiz (only if no attempts exist) |
| `GET` | `/educator/analytics/:quizId` | View attempt analytics |

#### Student / Mixed

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/course/:courseId` | List active quizzes for a course |
| `GET` | `/:quizId` | Fetch quiz (answers hidden for students) |
| `POST` | `/:quizId/submit` | Submit quiz answers (students only) |
| `GET` | `/:quizId/results` | Get detailed results for an attempt |
| `GET` | `/my-attempts/:courseId` | List student's own attempts |

### Admin Routes `/api/admin`

> Requires Admin role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Platform-wide stats and recent purchases |
| `GET` | `/users` | List all users (filter, search, paginate) |
| `GET` | `/educators` | List all educators |
| `PUT` | `/users/:userId/role` | Update a user's role |
| `DELETE` | `/users/:userId` | Delete a user (no purchases/courses) |
| `POST` | `/purchases/:purchaseId/fulfill` | Manually fulfill a stuck purchase |

---

## Authentication & Roles

Authentication is handled by **Clerk**. Every protected request must include a valid Clerk session token in the `Authorization` header.

```
Authorization: Bearer <clerk_session_token>
```

### Role Hierarchy

| Role | Capabilities |
|---|---|
| `student` | Browse courses, enroll, take quizzes, track progress |
| `educator` | All student capabilities + create/manage own courses and quizzes |
| `admin` | Full platform access, user management, manual purchase fulfillment |

### Bootstrap Admins

Add Clerk user IDs to `ADMIN_CLERK_USER_IDS` in your `.env` to grant admin access without a database record. This is useful for initial setup.

```env
ADMIN_CLERK_USER_IDS=user_abc123,user_def456
```

---

## Webhooks

Webhooks require the **raw request body** for signature verification. They are mounted at `/webhooks` — **before** body parsers run.

### Clerk Webhook — `POST /webhooks/clerk`

Handles user lifecycle events:

| Event | Action |
|---|---|
| `user.created` | Upsert user in MongoDB |
| `user.updated` | Sync name, email, image, role |
| `user.deleted` | Ignored — use Admin API instead |

### Stripe Webhook — `POST /webhooks/stripe`

Handles payment events:

| Event | Action |
|---|---|
| `checkout.session.completed` | Fulfill enrollment (idempotent) |
| `payment_intent.payment_failed` | Mark purchase as failed |
| `checkout.session.expired` | Mark purchase as failed |

### Enrollment Fulfillment

The `fulfillEnrollment` function is **idempotent** — calling it multiple times for the same purchase is safe. It:

1. Checks if the purchase is already completed and returns early if so
2. Auto-detects MongoDB replica set support and uses transactions if available
3. Atomically updates `Purchase`, `Course.enrolledStudents`, and `User.enrolledCourses`

---

## AI Quiz Generation

Quizzes are generated using **Google Gemini** from YouTube video transcripts.

### Fallback Chain (per lecture)

```
1. YouTube transcript (via youtubei.js)
       ↓ (if unavailable)
2. Lecturer-provided description (stored on lecture, min 50 chars)
       ↓ (if unavailable)
3. Lecture marked as "unavailable" — skipped
```

### Pre-flight Check

Before generating, use `POST /api/quiz/check-content` to verify content is available. The response includes per-lecture status and actionable instructions if generation is not possible.

### Transcript Caching

Fetched transcripts are cached in-memory (TTL: 1 hour, max: 500 entries) to avoid redundant YouTube API calls.

---

## Error Handling

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "courseId", "message": "Invalid courseId format" }
  ]
}
```

The `errors` array is only present when there are validation details.

In `development` mode, a `stack` field is also included.

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Not authenticated |
| `403` | Forbidden (wrong role or ownership) |
| `404` | Resource not found |
| `409` | Conflict (duplicate resource) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Rate Limiting

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| Global | 15 min | 100 (configurable) | All `/api` routes |
| Auth | 15 min | 20 | Authentication endpoints |
| Purchase | 60 min | 10 | `/api/user/purchase` |
| Admin writes | 15 min | 30 | Admin mutation endpoints |

---