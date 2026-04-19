
# 🎓 SkillsUp LMS – Full Stack Learning Management System

A modern, production-ready **Learning Management System (LMS)** built with **React (Frontend)** and **Node.js + Express (Backend)**. It supports students, educators, and admins in a unified ecosystem with **AI-powered quizzes, Stripe payments, role-based access control, and analytics dashboards**.

---

## 📌 Key Features

### 👨‍🎓 Learning Platform

* Course browsing, purchasing, and enrollment
* Video-based learning with progress tracking
* Interactive quizzes with scoring system
* Student dashboard with attempt history

### 👨‍🏫 Educator System

* Create and manage courses
* Upload lectures with descriptions
* AI-powered quiz generation (YouTube-based)
* View analytics (performance, students, revenue)

### 🛡️ Admin Panel

* User management (students, educators)
* Platform analytics dashboard
* Role management system

### 🤖 AI Features

* Quiz generation using **Google Gemini**
* YouTube transcript extraction
* Smart fallback (descriptions → skip logic)
* Content validation before generation

### 💳 Payments

* Stripe checkout integration
* Webhook-based enrollment fulfillment
* Idempotent payment handling

### 🔐 Authentication

* Clerk-based authentication
* JWT session management
* Role-based access control (RBAC)

---

## 🏗️ Tech Stack

### Frontend

* React 18 + Vite
* Tailwind CSS
* React Router v6
* Axios
* Clerk Auth
* React Hot Toast

### Backend

* Node.js + Express
* MongoDB + Mongoose
* Stripe API
* Google Gemini AI
* Cloudinary (file uploads)
* Clerk Webhooks
* YouTube transcript API
* Winston (logging)

---

## 📁 Project Structure

### 🔹 Backend

```id="backend-structure"
backend/
├── app.js
├── server.js
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
└── validators/
```

### 🔹 Frontend

```id="frontend-structure"
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
```

---

## 🚀 Getting Started

## 1️⃣ Clone Repository

```bash id="clone"
git clone https://github.com/AnupamNeon/SkiilsUp.git
cd SkillsUp
```

---

## 2️⃣ Backend Setup

```bash 
cd backend
npm install
```

### Environment Variables

```env 
PORT=5000
MONGODB_URI=your_mongo_url
CLERK_WEBHOOK_SECRET=your_secret
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_secret
CLOUDINARY_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_SECRET_KEY=your_secret
GEMINI_API_KEY=your_key
FRONTEND_URL=http://localhost:5173
```

### Run Backend

```bash id="backend-run"
npm run dev
```

---

## 3️⃣ Frontend Setup

```bash id="frontend-install"
cd frontend
npm install
```

### Environment Variables

```env id="frontend-env"
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_CURRENCY=usd
```

### Run Frontend

```bash id="frontend-run"
npm run dev
```

---

## 🌐 Application Flow

```
User (Frontend)
   ↓
React App (Vite)
   ↓
Axios API Calls
   ↓
Express Backend
   ↓
MongoDB Database
   ↓
External Services:
   - Stripe (Payments)
   - Clerk (Auth)
   - Gemini AI (Quiz)
   - Cloudinary (Media)
```

---

## 🔐 Authentication & Roles

Authentication is handled by **Clerk**.

### Roles

| Role     | Permissions                    |
| -------- | ------------------------------ |
| Student  | Enroll, learn, take quizzes    |
| Educator | Create courses, manage quizzes |
| Admin    | Full system control            |

### Flow

```
Login (Clerk)
   ↓
JWT Token
   ↓
Backend Validation
   ↓
Role Assignment
   ↓
Protected Routes
```

---

## 📚 Core Modules

### 🎓 Course System

* Course listing with filters
* Course details page
* Enrollment system
* Progress tracking

### 🎥 Learning System

* Lecture-based video player
* Chapter navigation
* Completion tracking

### 📝 Quiz System

* AI-generated quizzes
* Manual quiz creation
* Timed assessments
* Auto scoring

### 📊 Analytics

* Educator performance dashboard
* Student attempt history
* Platform-wide admin stats

---

## 🤖 AI Quiz Generation

### Process

```
Lecture Content
   ↓
YouTube Transcript Fetch
   ↓
Gemini AI Processing
   ↓
Quiz Generation
```

### Fallback Strategy

1. YouTube transcript
2. Lecture description
3. Skip generation

---

## 💳 Payment System

### Stripe Flow

```
User clicks "Buy Course"
   ↓
Stripe Checkout Session
   ↓
Payment Success
   ↓
Stripe Webhook
   ↓
Enrollment Created
```

### Safety

* Idempotent webhook handling
* Transaction-safe enrollment
* Duplicate payment protection

---

## ⚡ Performance Optimizations

### Frontend

* Memoized components
* Lazy loading
* API caching
* Optimized re-renders
* Safe state updates

### Backend

* Pagination everywhere
* Rate limiting
* Structured logging
* Optimized database queries

---

## 🛡️ Security Features

* JWT authentication via Clerk
* Role-based route protection
* Rate limiting (API abuse prevention)
* Helmet security headers
* Input validation (express-validator)
* Webhook signature verification

---

## 🔌 API Overview

### Base URL

```
http://localhost:5000/api
```

### Main Routes

| Module    | Endpoint        |
| --------- | --------------- |
| Auth/User | `/api/user`     |
| Courses   | `/api/course`   |
| Educator  | `/api/educator` |
| Quiz      | `/api/quiz`     |
| Admin     | `/api/admin`    |

---

## 🚀 Deployment

### Frontend

* Vercel / Netlify

### Backend

* Render / AWS / Railway

### Database

* MongoDB Atlas

---

## 📊 Project Stats

* 🧩 40+ API endpoints
* 📚 20+ React pages
* 🧠 AI-powered quiz system
* 💳 Fully integrated Stripe payments
* 🔐 Secure authentication system
* ⚡ Optimized for production

---

## 🧑‍💻 Contributing

```bash id="contrib"
git checkout -b feature-name
git commit -m "feat: add feature"
git push origin feature-name
```

### Guidelines

* Follow clean architecture
* Use reusable components
* Avoid hardcoded values
* Handle errors properly

---

## 📄 License

MIT License © SkillsUp Team

---

## 🎯 Summary

SkillsUp LMS is a **full-stack, scalable education platform** combining:

* Modern frontend (React)
* Robust backend (Node + Express)
* AI-powered learning
* Secure payments
* Role-based architecture

---