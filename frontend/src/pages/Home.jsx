import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCourses } from "../api";
import CourseCard from "../components/CourseCard";
import Loading from "../components/Loading";
import {
  BookOpen,
  Users,
  Award,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses({ limit: 8, sortBy: "createdAt", sortOrder: "desc" })
      .then((r) => setCourses(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-indigo-900 via-blue-950 to-indigo-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block mb-4 rounded-full bg-blue-500/20 px-4 py-1 text-sm font-medium text-blue-300">
                Learn at Your Own Pace
              </span>
              <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
                Unlock Your Potential{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Anywhere
                </span>
              </h1>
              <p className="mt-6 text-lg text-blue-200/80 max-w-lg">
                Discover high-quality courses designed to help you grow your
                skills, explore new subjects, and take your career to the next
                level.
              </p>
              <div className="mt-8 flex gap-4 flex-wrap">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold shadow hover:bg-blue-500 transition"
                >
                  Browse All Courses <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#featured"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-medium hover:bg-white/10 transition"
                >
                  <Play className="h-4 w-4" /> See Demo
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-blue-300">
                {[
                  "Hands-on Projects",
                  "Skill-Focused Learning",
                  "Flexible Schedule",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:block rounded-3xl bg-white/5 p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    icon: Users,
                    label: "Global Community",
                    desc: "Connect with learners worldwide",
                  },
                  {
                    icon: Award,
                    label: "Skill Validation",
                    desc: "Showcase your achievements",
                  },
                  {
                    icon: BookOpen,
                    label: "Expert-Led Courses",
                    desc: "Learn from top instructors",
                  },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/10 p-5 text-center"
                  >
                    <div className="mb-3 inline-flex p-3 rounded-full bg-blue-500/30">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white">{label}</h3>
                    <p className="text-sm text-blue-200">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-6 grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              label: "Curated Courses",
              value: "5+",
              description: "Hand-picked to maximize learning",
            },
            {
              icon: Users,
              label: "Active Learners",
              value: "50+",
              description: "Join a growing learning community",
            },
            {
              icon: Award,
              label: "Practical Projects",
              value: "10+",
              description: "Apply skills with real exercises",
            },
          ].map(({ icon: Icon, label, value, description }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow hover:shadow-lg transition text-center"
            >
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-semibold text-gray-500">{label}</p>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section id="featured" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Latest Courses
            </h2>
            <p className="text-gray-500 mt-2">
              Check out our newest courses and start learning today.
            </p>
          </div>
          <Link
            to="/courses"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 border rounded-xl text-gray-700 hover:shadow-sm transition"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 text-center px-6 rounded-xl mx-6 lg:mx-auto lg:max-w-7xl">
        <h2 className="text-3xl font-extrabold mb-4">
          Ready to Expand Your Skills?
        </h2>
        <p className="mb-8 text-blue-100/90 max-w-xl mx-auto">
          Start learning from expert instructors and join a global learning
          community today.
        </p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-full font-bold shadow hover:shadow-xl transition"
        >
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
