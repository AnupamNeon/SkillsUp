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
  PlayCircle,
  CheckCircle,
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
    <div className="min-h-screen bg-[var(--bg)]">
      
      {/* Hero - Pristine, High-Contrast, Education-First */}
      <section className="relative overflow-hidden bg-[var(--surface)] pb-20 pt-24 lg:pb-28 lg:pt-32 border-b border-[var(--border)]">
        {/* Subtle grid background pattern to prevent it from looking empty */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary-light)] bg-[var(--primary-light)] px-4 py-2 text-sm font-semibold text-[var(--primary)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]"></span>
                </span>
                Learn by practice, not just watching.
              </div>

              <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-6xl">
                Learn what matters. <br />
                {/* Hero text gradient utilizing the new Indigo */}
                <span style={{ backgroundImage: "linear-gradient(135deg, var(--primary), #818CF8)" }} className="bg-clip-text text-transparent">
                  From the experts.
                </span>
              </h1>

              <p className="mb-10 text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
                Practical courses taught by industry professionals. 
                Build real skills with project-based learning and an active community.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--primary)] px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.24)]"
                >
                  Browse Courses
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <a
                  href="#featured"
                  className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-8 py-4 font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm"
                >
                  <PlayCircle className="h-5 w-5 text-[var(--primary)]" />
                  Watch how it works
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm font-semibold text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                  Lifetime access
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                  Project-based learning
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                  Certificates
                </div>
              </div>
            </div>

            {/* Right Visual - Clean App Mockup Style */}
            <div className="relative hidden lg:block">
              {/* Decorative background glow matching the new Indigo */}
              <div className="absolute -inset-4 rounded-full bg-[var(--primary)] opacity-10 blur-3xl"></div>
              
              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                {/* Mockup Header */}
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-[var(--danger)]"></div>
                  <div className="h-3 w-3 rounded-full bg-[var(--accent)]"></div>
                  <div className="h-3 w-3 rounded-full bg-[var(--success)]"></div>
                </div>
                
                {/* Mockup Body */}
                <div className="p-6">
                  <div className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                    <div className="absolute inset-0 bg-[var(--primary)] opacity-0 transition-opacity duration-300 group-hover:opacity-5"></div>
                    <PlayCircle className="h-16 w-16 text-[var(--primary)] opacity-80 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="h-4 w-1/3 rounded-full bg-[var(--primary-light)]"></div>
                    <div className="h-3 w-3/4 rounded-full bg-[var(--bg)]"></div>
                    <div className="h-3 w-2/3 rounded-full bg-[var(--bg)]"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Simple Stats Bar */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { number: "10", label: "Courses" },
              { number: "35+", label: "Lessons" },
              { number: "5", label: "Educator" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="mb-1 text-4xl font-bold text-[var(--text-primary)]">{stat.number}</div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Learn With Us */}
      <section className="bg-[var(--bg)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">Why learners choose us</h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Expert instructors",
                desc: "Learn directly from professionals working at top companies.",
              },
              {
                icon: Users,
                title: "Active community",
                desc: "Get feedback, ask questions, and grow together.",
              },
              {
                icon: Award,
                title: "Hands-on projects",
                desc: "Build a portfolio you’re proud to show.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div 
                key={title} 
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.12)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[var(--text-primary)]">{title}</h3>
                <p className="leading-relaxed text-[var(--text-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Latest Courses */}
      <section id="featured" className="bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">NEW & POPULAR</span>
              <h2 className="mt-2 text-4xl font-bold text-[var(--text-primary)]">Latest courses</h2>
            </div>
            <Link
              to="/courses"
              className="flex items-center gap-2 font-semibold text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
            >
              View all courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA - Using the strict Orange Accent Gradient */}
      <section className="border-t border-[var(--border)] bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-6 text-4xl font-bold leading-tight text-[var(--text-primary)]">
            Ready to build something new?
          </h2>
          <p className="mb-10 text-lg text-[var(--text-secondary)]">
            Start with a free course or explore our full catalog. 
            No pressure — learn at your own speed.
          </p>

          <Link
            to="/courses"
            style={{ backgroundImage: "linear-gradient(135deg, var(--accent), #FDBA74)" }}
            className="inline-flex items-center gap-3 rounded-xl px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Learning Today
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="mt-6 text-xs font-medium text-[var(--text-secondary)]">Free to browse • Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}
