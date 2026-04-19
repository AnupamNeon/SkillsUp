import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Public Pages
import Home from "./pages/Home";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";

// Student Pages
import MyEnrollments from "./pages/MyEnrollments";
import CoursePlayer from "./pages/CoursePlayer";
import TakeQuiz from "./pages/student/TakeQuiz";
import QuizResults from "./pages/student/QuizResults";
import QuizAttempts from "./pages/student/QuizAttempts";

// Educator Pages
import EducatorDashboard from "./pages/educator/Dashboard";
import EducatorCourses from "./pages/educator/MyCourses";
import CourseForm from "./pages/educator/CourseForm";
import EducatorStudents from "./pages/educator/Students";
import QuizManagement from "./pages/educator/QuizManagement";
import QuizPreview from "./pages/educator/QuizPreview";
import QuizAnalytics from "./pages/educator/QuizAnalytics";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";

export default function App() {
  const location = useLocation();
  const isPlayerPage = location.pathname.startsWith("/player/");

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {!isPlayerPage && <Navbar />}
        
        <main className="flex-1">
          <Routes>
            {/* ========== PUBLIC ROUTES ========== */}
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/course/:id" element={<CourseDetail />} />

            {/* ========== STUDENT ROUTES (PROTECTED) ========== */}
            <Route element={<ProtectedRoute />}>
              <Route path="/my-enrollments" element={<MyEnrollments />} />
              <Route path="/player/:courseId" element={<CoursePlayer />} />
              
              {/* Quiz Routes */}
              <Route path="/quiz/:quizId" element={<TakeQuiz />} />
              <Route path="/quiz/:quizId/results" element={<QuizResults />} />
              <Route path="/course/:courseId/quiz-attempts" element={<QuizAttempts />} />
            </Route>

            {/* ========== EDUCATOR ROUTES (PROTECTED) ========== */}
            <Route element={<ProtectedRoute roles={["educator", "admin"]} />}>
              <Route path="/educator" element={<EducatorDashboard />} />
              <Route path="/educator/courses" element={<EducatorCourses />} />
              <Route path="/educator/courses/new" element={<CourseForm />} />
              <Route path="/educator/courses/:courseId/edit" element={<CourseForm />} />
              <Route path="/educator/students" element={<EducatorStudents />} />
              
              {/* Quiz Management Routes */}
              <Route path="/educator/courses/:courseId/quiz" element={<QuizManagement />} />
              <Route path="/educator/quiz/:quizId/preview" element={<QuizPreview />} />
              <Route path="/educator/quiz/:quizId/analytics" element={<QuizAnalytics />} />
            </Route>

            {/* ========== ADMIN ROUTES (PROTECTED) ========== */}
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            {/* ========== 404 FALLBACK ========== */}
            <Route
              path="*"
              element={
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-blue-200/50 blur-2xl" />
                    <h1 className="relative text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      404
                    </h1>
                  </div>
                  <p className="text-lg font-medium text-gray-500">
                    Oops! This page doesn't exist.
                  </p>
                  <a
                    href="/"
                    className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                  >
                    Go Home
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
        
        {!isPlayerPage && <Footer />}
      </div>
    </ErrorBoundary>
  );
}