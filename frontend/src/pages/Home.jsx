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
    let isMounted = true;

    async function loadCourses() {
      try {
        const response = await fetchCourses({
          limit: 8,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (!isMounted) return;

        const items = response?.data?.items;
        setCourses(Array.isArray(items) ? items : []);
      } catch (error) {
        if (isMounted) {
          setCourses([]);
        }
        console.error("Failed to fetch courses:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] pb-16 pt-20 sm:pb-20 sm:pt-24 lg:pb-28 lg:pt-32">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary-light)] bg-[var(--primary-light)] px-4 py-2 text-xs font-semibold text-[var(--primary)] sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
                </span>
                Learn by practice, not just watching.
              </div>

              <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl">
                Learn what matters. <br />
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--primary), #818CF8)",
                  }}
                  className="bg-clip-text text-transparent"
                >
                  From the experts.
                </span>
              </h1>

              <p className="mb-8 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg md:text-xl">
                Practical courses taught by industry professionals. Build real
                skills with project-based learning and an active community.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  to="/courses"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.24)] sm:w-auto sm:gap-3 sm:px-8 sm:py-4 sm:text-lg"
                >
                  Browse Courses
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm font-semibold text-[var(--text-secondary)] sm:gap-6 lg:justify-start">
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

            {/* Right Visual */}
            <div
              id="demo-video"
              className="relative mt-4 scroll-mt-24 sm:mt-6 lg:mt-0"
            >
              <div className="absolute -inset-4 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />

              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                {/* Mockup Header */}
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-[var(--danger)]" />
                  <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                  <div className="h-3 w-3 rounded-full bg-[var(--success)]" />
                </div>

                {/* Video with browser built-in controls */}
                <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-black">
                  <video
                    className="aspect-video w-full object-cover"
                    src="/LMS.mp4"
                    controls
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 text-center sm:gap-8">
            {[
              { number: "10", label: "Courses" },
              { number: "35+", label: "Lessons" },
              { number: "5", label: "Educators" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="mb-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl md:text-4xl">
                  {stat.number}
                </div>
                <div className="text-xs font-medium text-[var(--text-secondary)] sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Learn With Us */}
      <section className="bg-[var(--bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Why learners choose us
            </h2>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
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
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.12)] sm:p-8"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)] sm:mb-6 sm:h-14 sm:w-14">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Latest Courses */}
      <section id="featured" className="bg-[var(--surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col items-start gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] sm:text-sm">
                NEW & POPULAR
              </span>
              <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Latest courses
              </h2>
            </div>
            <Link
              to="/courses"
              className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--primary)] sm:text-base"
            >
              View all courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center sm:p-10">
              <p className="font-medium text-[var(--text-secondary)]">
                No courses available right now.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--bg)] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-5 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:mb-6 sm:text-4xl">
            Ready to build something new?
          </h2>
          <p className="mb-8 text-base text-[var(--text-secondary)] sm:mb-10 sm:text-lg">
            Start with a free course or explore our full catalog. No pressure —
            learn at your own speed.
          </p>

          <Link
            to="/courses"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--accent), #FDBA74)",
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:gap-3 sm:px-10 sm:py-4 sm:text-lg"
          >
            Start Learning Today
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="mt-5 text-xs font-medium text-[var(--text-secondary)] sm:mt-6">
            Free to browse • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}