# 📚 SkillsUp LMS — Learning Management System

A full-stack Learning Management System with role-based access control (Student, Educator, Admin), Stripe payments, Clerk authentication, and a modern React frontend.

---

## 🏗️ Tech Stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS, React Router, Clerk, Axios       |
| Backend    | Node.js, Express, MongoDB, Mongoose                            |
| Auth       | Clerk (JWT + Webhooks)                                         |
| Payments   | Stripe Checkout                                                |
| Storage    | Cloudinary (course thumbnails)                                 |
| Logging    | Winston + Morgan                                               |
| Docs       | Swagger / OpenAPI 3.0 (dev only)                               |

---

## 📁 Project Structure

```
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/               # Axios API client
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React Context (auth, user state)
│   │   ├── pages/             # Route pages
│   │   │   ├── admin/         # Admin dashboard & user management
│   │   │   └── educator/      # Educator dashboard, course CRUD
│   │   └── utils/             # Helpers (currency formatting, etc.)
│   └── .env                   # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB, Cloudinary, Multer, Swagger, Env
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/         # Auth, error handling, rate limiting
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express routers
│   │   ├── utils/             # ApiError, logger, pagination, roles
│   │   └── validators/        # express-validator rules
│   └── .env                   # See Environment Variables below
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Clerk account → [clerk.com](https://clerk.com)
- Stripe account → [stripe.com](https://stripe.com)
- Cloudinary account → [cloudinary.com](https://cloudinary.com)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/skillsup-lms.git
cd skillsup-lms

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Environment Variables

**Backend** (`server/.env`)

```env
# Required
MONGODB_URI=mongodb+srv://...
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret
CLERK_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
NODE_ENV=development
PORT=5000
CURRENCY=inr
CORS_ORIGIN=http://localhost:5173
ADMIN_CLERK_USER_IDS=user_abc123,user_def456
```

**Frontend** (`client/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- **Frontend** → `http://localhost:5173`
- **Backend** → `http://localhost:5000`
- **API Docs** → `http://localhost:5000/api-docs` (dev only)

---

## 👥 Roles & Permissions

| Feature                  | Student | Educator | Admin |
| ------------------------ | :-----: | :------: | :---: |
| Browse & search courses  |   ✅    |    ✅    |  ✅   |
| Purchase / enroll        |   ✅    |    —     |   —   |
| Watch course content     |   ✅    |    —     |   —   |
| Track progress & rate    |   ✅    |    —     |   —   |
| Create / edit courses    |    —    |    ✅    |  ✅   |
| View enrolled students   |    —    |    ✅    |  ✅   |
| Educator dashboard       |    —    |    ✅    |  ✅   |
| Manage users & roles     |    —    |    —     |  ✅   |
| Platform-wide dashboard  |    —    |    —     |  ✅   |
| Delete users             |    —    |    —     |  ✅   |

> **Bootstrap Admin:** Add your Clerk user ID to `ADMIN_CLERK_USER_IDS` in `.env` to grant yourself admin access without DB changes.

---

## 🔌 API Overview

| Method   | Endpoint                                  | Auth     | Description                   |
| -------- | ----------------------------------------- | -------- | ----------------------------- |
| `GET`    | `/api/course/all`                         | Public   | List published courses        |
| `GET`    | `/api/course/:id`                         | Public   | Course detail (URLs stripped) |
| `POST`   | `/api/user/sync`                          | Required | Sync Clerk user to DB         |
| `GET`    | `/api/user/data`                          | Required | Get current user              |
| `GET`    | `/api/user/enrolled-courses`              | Required | User's enrollments            |
| `GET`    | `/api/user/enrolled-courses/:id/content`  | Required | Full course content (enrolled)|
| `POST`   | `/api/user/purchase`                      | Required | Start Stripe checkout         |
| `POST`   | `/api/user/update-course-progress`        | Required | Mark lecture complete          |
| `GET`    | `/api/user/course-progress/:courseId`      | Required | Get progress                  |
| `PUT`    | `/api/user/ratings`                       | Required | Rate a course                 |
| `POST`   | `/api/educator/add-course`                | Educator | Create course                 |
| `PUT`    | `/api/educator/courses/:id`               | Educator | Update course                 |
| `DELETE` | `/api/educator/courses/:id`               | Educator | Delete course                 |
| `PATCH`  | `/api/educator/courses/:id/publish`       | Educator | Toggle publish                |
| `GET`    | `/api/educator/dashboard`                 | Educator | Educator stats                |
| `GET`    | `/api/admin/dashboard`                    | Admin    | Platform stats                |
| `GET`    | `/api/admin/users`                        | Admin    | List users                    |
| `PUT`    | `/api/admin/users/:id/role`               | Admin    | Change user role              |
| `DELETE` | `/api/admin/users/:id`                    | Admin    | Delete user                   |
| `POST`   | `/webhooks/clerk`                         | Webhook  | Clerk events                  |
| `POST`   | `/webhooks/stripe`                        | Webhook  | Stripe events                 |

Full Swagger docs available at `/api-docs` in development.

---

## 💳 Payment Flow

```
Student clicks "Enroll Now"
        │
        ▼
  POST /api/user/purchase
        │
        ├── Free course → Instant enrollment (DB transaction)
        │
        └── Paid course → Stripe Checkout session created
                │
                ▼
        Redirect to Stripe hosted page
                │
                ▼
        Payment completes → Stripe webhook fires
                │
                ▼
        POST /webhooks/stripe (checkout.session.completed)
                │
                ▼
        DB transaction: enroll student + mark purchase complete
                │
                ▼
        Redirect to /my-enrollments
```

---

## 🔒 Security Features

- **Clerk JWT authentication** with middleware validation
- **Role-based authorization** (student / educator / admin)
- **Helmet** security headers
- **CORS** with origin whitelist
- **Rate limiting** (global + per-endpoint)
- **Input validation** via `express-validator`
- **MongoDB transactions** for purchase atomicity
- **Webhook signature verification** (Clerk + Stripe)
- **File upload restrictions** (5MB, images only)
- **Request body size limit** (10KB)

---

## 🛠️ Webhook Setup

### Clerk Webhook

1. Go to **Clerk Dashboard → Webhooks**
2. Add endpoint: `https://your-domain.com/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret → `CLERK_WEBHOOK_SECRET`

### Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-domain.com/webhooks/stripe`
3. Subscribe to: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

**Local testing:**

```bash
# Stripe CLI
stripe listen --forward-to localhost:5000/webhooks/stripe

# ngrok (for Clerk)
ngrok http 5000
```

---

## 📝 Available Scripts

### Backend

```bash
npm run dev          # Start with nodemon (development)
npm start            # Start production server
```

### Frontend

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 🗄️ Database Models

```
User
├── _id (Clerk user ID — String)
├── name, email, imageUrl
├── role (student | educator | admin)
└── enrolledCourses[] → Course

Course
├── courseTitle, courseDescription, courseThumbnail
├── coursePrice, discount, isPublished
├── educator → User
├── enrolledStudents[] → User
├── courseRatings[] { userId, rating }
└── courseContent[]
    └── Chapter { chapterTitle, chapterOrder }
        └── Lecture { lectureTitle, lectureUrl, lectureDuration, isPreviewFree }

Purchase
├── courseId → Course
├── userId → User
├── amount
└── status (pending | completed | failed)

CourseProgress
├── userId → User
├── courseId → Course
└── lectureCompleted[] (lecture IDs)
```

---

## ⚠️ Known Limitations

- In-memory rate limiter (won't scale across multiple instances — use Redis store for production)
- No real-time notifications (WebSocket/SSE)
- No video upload — lectures use external URLs (YouTube, etc.)
- No certificate generation
- No refund flow

---

## 📄 License

MIT

---

**Built with ❤️ for learners everywhere.**
