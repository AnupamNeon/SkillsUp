# SkillsUp – Learning Management System

A modern, full-featured Learning Management System (LMS) built with **React**, featuring **role-based access control**, **course management**, **video streaming**, and **payment integration**.

---

## 📋 Table of Contents

* [Features](#-features)
* [Tech Stack](#-tech-stack)
* [Project Structure](#-project-structure)
* [Environment Variables](#-environment-variables)
* [User Roles](#-user-roles)
* [Role-Specific Features](#-role-specific-features)
* [API Integration](#-api-integration)
* [Components Overview](#-components-overview)
* [Pages Overview](#-pages-overview)
* [State Management](#-state-management)
* [Acknowledgments](#-acknowledgments)

---

## ✨ Features

### 🎓 Students

* Browse, search, and filter courses
* Preview free lectures before enrollment
* Secure payments with **Stripe/Razorpay**
* Track learning progress
* Video playback (YouTube & direct uploads)
* Rate and review courses
* Responsive course player with chapter navigation

### 👨‍🏫 Educators

* Full course creation & editing workflow
* Drag-and-drop chapter & lecture management
* Video upload and YouTube integration
* Publish/unpublish courses
* Track enrolled students and revenue
* Bulk content management

### 🛡️ Admins

* Complete user management (CRUD & role assignment)
* Platform analytics dashboard
* Monitor recent transactions
* Track user activity across the platform

---

## 🛠️ Tech Stack

**Frontend:**

* React 18+ (Hooks)
* React Router v6
* Clerk (Auth & user management)
* Axios (HTTP client with interceptors)
* React Hot Toast (Notifications)
* Lucide React (Icons)
* Tailwind CSS (Utility-first styling)

**Build Tools:**

* Vite (Fast build tool)
* PostCSS (CSS processing)

---

## 📁 Project Structure

```
src/
├── api/                  # API client & endpoints
├── components/           # Reusable UI components
├── context/              # Global state (AppContext)
├── pages/                # Page components (Student, Educator, Admin)
├── utils/                # Utility functions
├── App.jsx               # Route configuration
├── main.jsx              # Entry point
└── index.css             # Global styles
```

---

## 🔐 Environment Variables

Create `.env` in the root directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:5000
```

* `VITE_CLERK_PUBLISHABLE_KEY` – from [Clerk Dashboard](https://dashboard.clerk.dev)
* `VITE_API_URL` – backend API base URL

---

## 👥 User Roles

| Role     | Permissions                                                                    |
| -------- | ------------------------------------------------------------------------------ |
| Student  | Browse courses, enroll, track progress, rate courses                           |
| Educator | All student permissions + create/manage courses, view students, track earnings |
| Admin    | Full platform access, manage users/roles, view analytics, monitor transactions |

---

## 🎯 Role-Specific Features & Routes

### Public

* `/` – Home
* `/courses` – Course catalog
* `/course/:id` – Course details

### Student Only

* `/my-enrollments` – Enrolled courses
* `/player/:courseId` – Video player

### Educator & Admin

* `/educator` – Dashboard
* `/educator/courses` – My courses
* `/educator/courses/new` – Create course
* `/educator/courses/:id/edit` – Edit course
* `/educator/students` – Student list

### Admin Only

* `/admin` – Dashboard
* `/admin/users` – User management

---

## 🔌 API Integration

**Axios Client with Interceptors:**

```javascript
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => Promise.reject(new Error(err.response?.data?.message || 'Something went wrong'))
);
```

**Key Endpoints:**

| Role     | Actions                                                               |
| -------- | --------------------------------------------------------------------- |
| Public   | fetchCourses(), fetchCourseById()                                     |
| User     | syncUser(), fetchUserData(), purchaseCourse(), updateCourseProgress() |
| Educator | addCourse(), updateCourse(), togglePublish()                          |
| Admin    | fetchAdminUsers(), updateUserRole()                                   |

---

## 🧩 Components Overview

| Component      | Description                                 | Key Features                                   |
| -------------- | ------------------------------------------- | ---------------------------------------------- |
| CourseCard     | Displays course info, rating, price, badges | Image, title, educator, discount badges        |
| Navbar         | Dynamic navigation with role-based menus    | Role badges: 🔴 Admin, 🟣 Educator, 🟢 Student |
| Pagination     | Smart pagination with ellipsis              | Handles large page sets                        |
| ProtectedRoute | Role-based route protection                 | Restricts access per user role                 |
| Rating         | Interactive or display-only star rating     | Supports callbacks                             |

---

## 📄 Pages Overview

* **Home** – Hero, stats, featured courses
* **CourseDetail** – Full info, chapter/lecture previews, enrollment
* **CoursePlayer** – Video player with progress tracking
* **Educator Dashboard** – Revenue, courses, students
* **CourseForm** – Create/edit courses, drag-and-drop chapters
* **Admin Dashboard** – User stats, revenue, recent purchases

---

## 🔄 State Management

**AppContext** provides global state for:

* Current user & authentication status
* Role-based access flags
* Loading states

```jsx
const { user, isSignedIn, isEducator, isAdmin, refreshUser } = useAppContext();
```

**User Sync Flow:**

1. Sign in via Clerk
2. Call `/api/user/sync`
3. Backend creates/updates user record
4. Context stores user data & UI updates

---

## 🙏 Acknowledgments

* **Clerk** – Authentication
* **Lucide** – Icon library
* **Tailwind CSS** – Styling
* **Vite** – Build tool

**Built with ❤️ by the SkillsUp Team**

---
