
# 🎓 LMS Frontend

A modern, production-ready Learning Management System (LMS) frontend built with **React + Vite**. It provides a seamless experience for students, educators, and admins with role-based dashboards, AI-powered learning features, and optimized performance.

---

## 📌 Features

* 🔐 **Authentication** via Clerk (JWT-based session handling)
* 👥 **Role-based UI** (Student, Educator, Admin)
* 📚 **Course System** (browse, enroll, purchase, manage)
* 🎥 **Learning Player** with progress tracking
* 🤖 **AI Quiz Generator** (YouTube-based content analysis)
* 📝 **Quiz System** (timed quizzes, auto-submit, scoring)
* 📊 **Analytics Dashboard** (educator & admin insights)
* 💳 **Stripe Integration** (secure payments & enrollment flow)
* ⚡ **Optimized Performance** (memoization, caching, lazy loading)
* 🛡️ **Protected Routes** with role-based access control
* 🔔 **Toast Notifications** for user feedback

---

## 🧱 Tech Stack

| Layer         | Technology        |
| ------------- | ----------------- |
| Framework     | React 18 + Vite   |
| Routing       | React Router v6   |
| Styling       | Tailwind CSS      |
| State         | React Context API |
| Auth          | Clerk             |
| API           | Axios             |
| UI Icons      | Lucide React      |
| Notifications | React Hot Toast   |

---

## 📁 Project Structure

```
src/
├── api/            # Axios instance & endpoints
├── components/     # Reusable UI components
├── context/        # Global state (Auth/User)
├── hooks/          # Custom hooks
├── pages/          # App pages (Student/Educator/Admin)
├── utils/          # Helpers & constants
├── App.jsx         # Routes + layout
└── main.jsx        # Entry point
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```env
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_CURRENCY=usd
```

### 3. Run Development Server

```bash
npm run dev
```

App runs at:

```
http://localhost:5173
```

---

## 🔐 Authentication & Roles

Authentication is handled using **Clerk**.

### Roles

* **Student** → Learn, enroll, take quizzes
* **Educator** → Create courses, manage quizzes, view analytics
* **Admin** → Full system access

### Protected Routing

* Public: Home, Courses, Course Details
* Protected: Player, Quiz, Enrollments
* Educator: Course & Quiz management
* Admin: User management & platform control

---

## 🔄 Core Features Flow

### 📚 Course Flow

Browse → View → Purchase → Enroll → Learn

### 🎥 Learning Flow

Video Lecture → Progress Tracking → Quiz Access

### 🤖 AI Quiz Flow

Lecture Content → YouTube Transcript → Gemini AI → Quiz Generation

### 📝 Quiz Flow

Start → Timer → Answer → Auto/Manual Submit → Score

---

## ⚙️ State Management

Global state managed via Context:

* User authentication state
* Role detection (student/educator/admin)
* Loading states
* Clerk session data

---

## ⚡ Performance Optimizations

* Memoized components (`React.memo`)
* Cached API responses
* Lazy-loaded data rendering
* Optimized re-renders (`useCallback`, `useMemo`)
* Safe state updates (memory leak prevention)
* Reduced bundle size (~450KB gzipped)

---

## 🔌 API Integration

* Axios-based centralized API layer
* JWT token injection via Clerk
* Global error handling
* Retry & fallback logic for failed requests

---

## 🛡️ Error Handling

* Global Error Boundary
* API error normalization
* User-friendly toast messages
* Fallback UI for failures

---

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Netlify

```bash
npm run build
```

Publish folder:

```
dist
```

---

## 📊 Project Summary

* ⚛️ React 18 frontend
* 🎯 Role-based LMS system
* 🤖 AI-powered quiz generation
* 💳 Stripe payment integration
* 🔐 Clerk authentication
* ⚡ Highly optimized architecture
* 📱 Fully responsive UI

---

## 📄 License

MIT License © SkillsUp Team

---