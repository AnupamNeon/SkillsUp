# 📚 Role-LMS Backend

A production-ready **Learning Management System (LMS)** REST API built with **Express.js**, **MongoDB**, **Clerk** authentication, and **Stripe** payments. Features full **Role-Based Access Control (RBAC)**, search, pagination, structured logging, and comprehensive security hardening.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Role-Based Access Control](#-role-based-access-control)
- [Search & Filtering](#-search--filtering)
- [Pagination](#-pagination)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)
- [Logging](#-logging)
- [Security](#-security)
- [Webhooks](#-webhooks)
- [License](#-license)

---

## ✨ Features

| Category | Details |
|----------|---------|
| **Authentication** | Clerk-based auth with JWT verification |
| **Authorization** | 3-tier RBAC — Admin, Educator, Student |
| **Courses** | CRUD with thumbnail upload (Cloudinary) |
| **Payments** | Stripe Checkout integration with webhook processing |
| **Search** | Regex-based search on course titles & descriptions |
| **Filtering** | Price range, educator, role-based filters |
| **Pagination** | Consistent cursor across all list endpoints |
| **Security** | Helmet, CORS, mongo sanitization, HPP, rate limiting |
| **Logging** | Structured Winston logging with file rotation |
| **Error Handling** | Centralized with standardized response format |
| **API Docs** | Auto-generated Swagger/OpenAPI documentation |
| **Env Validation** | Startup validation of all required configuration |

---

## 🏗 Architecture

```
Client (React/Next.js)
    │
    ▼
┌──────────────────────────────────────────────────────┐
│                    Express Server                    │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Helmet  │  │   CORS   │  │   Rate Limiter       │ │
│  └────┬────┘  └────┬─────┘  └──────────┬───────────┘ │
│       ▼            ▼                    ▼            │
│  ┌──────────────────────────────────────────────────┐│
│  │              Clerk Middleware                    ││
│  └──────────────────┬───────────────────────────────┘│
│                     ▼                                │
│  ┌──────────────────────────────────────────────────┐│
│  │                 API Routes                       ││
│  │  /api/course  /api/user  /api/educator /api/admin│
│  └──────────────────┬───────────────────────────────┘│
│                     ▼                                │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐           │
│  │Validators│→ │  Auth    │→ │Controllers│           │
│  └──────────┘  │Middleware│  └─────┬─────┘           │
│                └──────────┘        ▼                 │
│                            ┌──────────────┐          │
│                            │   Models     │          │
│                            │  (Mongoose)  │          │
│                            └──────┬───────┘          │
│                                   ▼                  │
│                            ┌──────────────┐          │
│                            │   MongoDB    │          │
│                            └──────────────┘          │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │           Global Error Handler                   ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
   ┌───────────┐            ┌──────────────┐
   │ Cloudinary│            │    Stripe    │
   └───────────┘            └──────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (≥ 18) |
| Framework | Express.js 4.x |
| Database | MongoDB with Mongoose ODM |
| Authentication | Clerk |
| Payments | Stripe |
| File Storage | Cloudinary |
| Logging | Winston + Morgan |
| Validation | express-validator |
| Documentation | Swagger (OpenAPI 3.0) |
| Security | helmet, cors, express-mongo-sanitize, hpp, express-rate-limit |

---

## 📋 Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **MongoDB** (Atlas or local instance)
- **Clerk** account with API keys
- **Stripe** account with API keys
- **Cloudinary** account with API keys

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `PORT` | No | `5000` | Server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `CLERK_WEBHOOK_SECRET` | **Yes** | — | Clerk webhook signing secret |
| `CLOUDINARY_NAME` | **Yes** | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | — | Cloudinary API key |
| `CLOUDINARY_SECRET_KEY` | **Yes** | — | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | **Yes** | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | — | Stripe webhook signing secret |
| `CURRENCY` | No | `inr` | Payment currency code |
| `CORS_ORIGIN` | No | `*` | Allowed origins (comma-separated) |
| `ADMIN_CLERK_USER_IDS` | No | — | Bootstrap admin Clerk user IDs (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |

---

## 📁 Project Structure

```
backend/
├── logs/                          # Generated log files (gitignored)
│   ├── error.log
│   └── combined.log
├── src/
│   ├── config/
│   │   ├── cloudinary.js          # Cloudinary SDK setup
│   │   ├── database.js            # MongoDB/Mongoose connection
│   │   ├── env.js                 # Environment validation
│   │   ├── multer.js              # File upload config
│   │   └── swagger.js             # OpenAPI spec generation
│   ├── constants/
│   │   └── roles.js               # RBAC role constants
│   ├── controllers/
│   │   ├── admin.controller.js    # Admin user management
│   │   ├── course.controller.js   # Public course endpoints
│   │   ├── educator.controller.js # Educator course management
│   │   ├── user.controller.js     # Student endpoints
│   │   └── webhook.controller.js  # Clerk & Stripe webhooks
│   ├── middleware/
│   │   ├── auth.js                # authenticate() & authorize()
│   │   ├── errorHandler.js        # Global error handler + 404
│   │   ├── rateLimiter.js         # Rate limiting configs
│   │   ├── requestLogger.js       # Morgan → Winston bridge
│   │   └── validate.js            # express-validator runner
│   ├── models/
│   │   ├── Course.js              # Course + Chapter + Lecture schemas
│   │   ├── CourseProgress.js      # Per-user progress tracking
│   │   ├── Purchase.js            # Payment records
│   │   └── User.js                # User with role field
│   ├── routes/
│   │   ├── admin.routes.js        # /api/admin/*
│   │   ├── course.routes.js       # /api/course/*
│   │   ├── educator.routes.js     # /api/educator/*
│   │   ├── index.js               # Route aggregator
│   │   ├── user.routes.js         # /api/user/*
│   │   └── webhook.routes.js      # /webhooks/*
│   ├── utils/
│   │   ├── ApiError.js            # Custom error class
│   │   ├── asyncHandler.js        # Async try-catch wrapper
│   │   ├── logger.js              # Winston logger instance
│   │   ├── roles.js               # RBAC role constants
│   │   └── pagination.js          # Pagination helpers 
│   ├── validators/
│   │   ├── admin.validator.js     # Admin input validation
│   │   ├── course.validator.js    # Course query/param validation
│   │   ├── educator.validator.js  # Course creation validation
│   │   └── user.validator.js      # User action validation
│   └── app.js                     # Express app configuration
├── .env                           # Environment template
├── .gitignore
├── package.json
├── README.md
└── server.js                      # Entry point
```

---

## 📖 API Documentation

### Interactive Docs

When running in development mode, Swagger UI is available at:

```
http://localhost:5000/api-docs
```

### Endpoint Overview

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status |
| `GET` | `/health` | Health check |
| `GET` | `/api/course/all` | List published courses |
| `GET` | `/api/course/:id` | Get course details |

#### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/clerk` | Clerk user events |
| `POST` | `/webhooks/stripe` | Stripe payment events |

#### Student Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/data` | Get profile |
| `GET` | `/api/user/enrolled-courses` | List enrolled courses |
| `POST` | `/api/user/purchase` | Purchase a course |
| `POST` | `/api/user/update-course-progress` | Mark lecture complete |
| `POST` | `/api/user/get-course-progress` | Get progress for course |
| `POST` | `/api/user/add-rating` | Rate a course |

#### Educator Endpoints (Educator/Admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/educator/add-course` | Create course |
| `GET` | `/api/educator/courses` | List own courses |
| `GET` | `/api/educator/dashboard` | Educator analytics |
| `GET` | `/api/educator/enrolled-students` | List enrolled students |

#### Admin Endpoints (Admin role only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/dashboard` | Platform analytics |
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/educators` | List educators |
| `PUT` | `/api/admin/users/:userId/role` | Update user role |
| `DELETE` | `/api/admin/users/:userId` | Delete user |

---

## 🔑 Role-Based Access Control

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Student** | Default role on signup | Browse courses, purchase, track progress, rate |
| **Educator** | Promoted by Admin | All student permissions + create/manage own courses |
| **Admin** | Bootstrap via env or promoted | Full platform access, user management, analytics |

### How It Works

```
Request → authenticate() → authorize(ROLES.ADMIN) → Controller
               │                    │
               │                    ├── Check bootstrap admin list
               │                    ├── Lookup user.role in DB
               │                    └── Compare against allowed roles
               │
               └── Extract userId from Clerk JWT
```

### Bootstrap Admin Setup

Set initial admin users via environment variable:

```env
ADMIN_CLERK_USER_IDS=user_2abc123,user_2xyz456
```

These Clerk user IDs will always pass admin authorization checks, even before their DB role is updated.

### Promoting Users

```bash
# Promote a user to educator
curl -X PUT http://localhost:5000/api/admin/users/user_2abc123/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "educator"}'
```

---

## 🔍 Search & Filtering

### Course Search

```bash
# Text search
GET /api/course/all?search=javascript

# Price range filter
GET /api/course/all?minPrice=10&maxPrice=50

# Filter by educator
GET /api/course/all?educator=user_2abc123

# Sort by price descending
GET /api/course/all?sortBy=coursePrice&sortOrder=desc

# Combine multiple filters
GET /api/course/all?search=react&minPrice=0&maxPrice=100&sortBy=createdAt&sortOrder=desc&page=1&limit=12
```

### Admin User Search

```bash
# Search users by name or email
GET /api/admin/users?search=john

# Filter by role
GET /api/admin/users?role=educator

# Combined
GET /api/admin/users?search=john&role=student&page=1&limit=20
```

---

## 📄 Pagination

All list endpoints return a standardized pagination envelope:

### Request

```bash
GET /api/course/all?page=2&limit=10
```

### Response

```json
{
  "success": true,
  "items": [
    { "courseTitle": "...", "coursePrice": 29.99 }
  ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

### Defaults & Limits

| Parameter | Default | Min | Max |
|-----------|---------|-----|-----|
| `page` | 1 | 1 | — |
| `limit` | 10 | 1 | 100 |

---

## ❌ Error Handling

### Standardized Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "courseId", "message": "Invalid courseId format" },
    { "field": "rating", "message": "Rating must be between 1 and 5" }
  ]
}
```

### Error Types Handled

| Error Type | HTTP Status | Example |
|------------|-------------|---------|
| Validation | `400` | Missing/invalid fields |
| Authentication | `401` | No/invalid token |
| Authorization | `403` | Insufficient role |
| Not Found | `404` | Resource doesn't exist |
| Conflict | `409` | Duplicate enrollment |
| Rate Limit | `429` | Too many requests |
| Server Error | `500` | Unexpected failures |

### Development vs Production

- **Development**: Includes `stack` trace in error response
- **Production**: Generic message, no stack trace, no internal details leaked

---

## 🚦 Rate Limiting

| Limiter | Window | Max Requests | Applied To |
|---------|--------|-------------|------------|
| Global | 15 min | 100 | All `/api` routes |
| Auth | 15 min | 20 | Authentication endpoints |
| Purchase | 1 hour | 10 | `/api/user/purchase` |
| Admin Write | 15 min | 50 | Admin create/update/delete |

Rate limit headers included in responses:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640000000
```

---

## 📝 Logging

### Log Levels

| Level | Usage |
|-------|-------|
| `error` | Application errors, unhandled rejections |
| `warn` | Operational issues, failed payments |
| `info` | Server events, user actions, purchases |
| `http` | HTTP request/response logs (Morgan) |
| `debug` | Detailed debugging info (dev only) |

### Development Output

```
14:32:05 info: Server running on http://localhost:5000 {"env":"development","port":5000}
14:32:10 http: GET /api/course/all 200 45ms
14:32:15 info: Purchase completed {"purchaseId":"...","userId":"..."}
14:32:20 warn: Payment failed {"purchaseId":"..."}
```

### Production Output

Structured JSON written to:
- `logs/error.log` — Errors only (5 MB rotation, 5 files)
- `logs/combined.log` — All levels (5 MB rotation, 5 files)

```json
{
  "level": "info",
  "message": "User role updated",
  "service": "lms-api",
  "targetUserId": "user_2abc",
  "newRole": "educator",
  "byAdmin": "user_2xyz",
  "timestamp": "2024-01-15T14:32:05.000Z"
}
```

---

## 🛡 Security

### Measures Implemented

| Security Layer | Implementation |
|---------------|----------------|
| **HTTP Headers** | `helmet` — sets security headers (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | Configurable origin whitelist via `CORS_ORIGIN` env var |
| **NoSQL Injection** | `express-mongo-sanitize` — strips `$` and `.` from user input |
| **Parameter Pollution** | `hpp` — protects against duplicate query params |
| **Body Size Limit** | JSON body capped at 10 KB |
| **File Upload** | MIME type whitelist, 5 MB max size |
| **Rate Limiting** | Per-route rate limiting with configurable windows |
| **Input Validation** | `express-validator` on all endpoints |
| **Auth** | Clerk JWT verification on protected routes |
| **RBAC** | Role checks against local DB + bootstrap admin list |
| **Webhook Security** | Svix signature verification (Clerk), Stripe signature verification |
| **Error Masking** | No stack traces or internal details in production |
| **Swagger** | Disabled in production by default |

### CORS Configuration

```env
# Single origin
CORS_ORIGIN=http://localhost:5173

# Multiple origins
CORS_ORIGIN=http://localhost:5173,https://myapp.com

# Allow all (development only)
CORS_ORIGIN=*
```

---

## 🔗 Webhooks

### Clerk Webhook

**Endpoint**: `POST /webhooks/clerk`

Handles user lifecycle events:

| Event | Action |
|-------|--------|
| `user.created` | Creates local User document with default student role |
| `user.updated` | Syncs name, email, image, role |
| `user.deleted` | Removes local User document |

### Stripe Webhook

**Endpoint**: `POST /webhooks/stripe`

Handles payment events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Enrolls student, updates purchase status |
| `payment_intent.payment_failed` | Marks purchase as failed |

> ⚠️ Webhook routes are mounted **before** body parsers. Stripe requires raw body for signature verification.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for modern education
</p>