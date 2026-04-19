import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Logo from "/logo-1.jpeg";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();

    if (!email.includes("@")) return;

    // fake submit (you can replace with API later)
    console.log("Subscribed email:", email);

    setSubscribed(true);
    setEmail("");

    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="SkillsUp" className="h-10 w-auto rounded-md" />
              <span className="text-lg font-bold text-[var(--text-primary)]">
                SkillsUp
              </span>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              A modern Learning Management System built for students and
              educators to learn, teach, and grow together.
            </p>

            <p className="mt-5 flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)]">
              Made with <Heart className="h-3.5 w-3.5 fill-[var(--danger)] text-[var(--danger)]" />{" "}
              for learners worldwide
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-bold tracking-wide text-[var(--text-primary)] uppercase">
              Explore
            </h3>

            <ul className="mt-4 space-y-3 text-sm font-medium">
              {[
                { to: "/courses", label: "Courses" },
                { to: "/my-enrollments", label: "My Learning" },
                { to: "/", label: "Home" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter (Strict Form Input Rules Applied) */}
          <div>
            <h3 className="text-sm font-bold tracking-wide text-[var(--text-primary)] uppercase">
              Newsletter
            </h3>

            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Get updates on new courses and features.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-all placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] focus:outline-none"
              />

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-hover)]"
              >
                Subscribe
              </button>

              {subscribed && (
                <p className="text-xs font-semibold text-[var(--success)]">
                  Thanks for subscribing!
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            © {new Date().getFullYear()} SkillsUp. Built for learning purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}