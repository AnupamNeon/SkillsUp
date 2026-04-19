import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useAppContext } from '../context/AppContext';
import {
  Menu,
  X,
  Shield,
  BookOpen,
  User,
  Sparkles,
} from 'lucide-react';
import Logo from '/logo-1.jpeg';

const linkClass = ({ isActive }) =>
  `relative text-sm font-semibold transition-all duration-200 ${
    isActive
      ? 'text-[var(--primary)]'
      : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'
  } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-[var(--primary)] after:transition-all after:duration-300 ${
    isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
  }`;

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    dot: 'bg-[var(--danger)]',
    bgColor: 'bg-[#FEF2F2]', // Light red tint for surface
    textColor: 'text-[var(--danger)]',
    borderColor: 'border-[var(--danger)]/30',
  },
  educator: {
    label: 'Educator',
    icon: BookOpen,
    dot: 'bg-[var(--primary)]',
    bgColor: 'bg-[var(--primary-light)]',
    textColor: 'text-[var(--primary)]',
    borderColor: 'border-[var(--primary)]/30',
  },
  student: {
    label: 'Student',
    icon: User,
    dot: 'bg-[var(--success)]',
    bgColor: 'bg-[#ECFDF5]', // Light green tint for surface
    textColor: 'text-[var(--success)]',
    borderColor: 'border-[var(--success)]/30',
  },
};

function RoleBadge({ role, size = 'default' }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const Icon = config.icon;

  if (size === 'small') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

export default function Navbar() {
  const { user, isSignedIn, isAdmin, loading } = useAppContext();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  const role = user?.role;
  const isStudent = isSignedIn && role === 'student';
  const isEducator = isSignedIn && role === 'educator';
  const showStudentNav = !isSignedIn || isStudent || (isSignedIn && !user);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--surface)]/80 shadow-sm backdrop-blur-xl'
          : 'border-b border-transparent bg-[var(--surface)]/60 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={Logo}
            alt="SkillsUp LMS"
            className="h-10 w-auto rounded-md"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {showStudentNav && (
            <NavLink to="/courses" className={linkClass}>
              Courses
            </NavLink>
          )}

          {isStudent && (
            <NavLink to="/my-enrollments" className={linkClass}>
              My Enrollments
            </NavLink>
          )}

          {isEducator && (
            <>
              <NavLink to="/educator" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/educator/courses" className={linkClass}>My Courses</NavLink>
              <NavLink to="/educator/students" className={linkClass}>Students</NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/admin/users" className={linkClass}>Manage Users</NavLink>
            </>
          )}
        </nav>

        {/* Auth Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {!loading && !isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-sm">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                {/* Button Primary Rules applied completely */}
                <button className="rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.24)]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Get Started
                  </span>
                </button>
              </SignUpButton>
            </>
          )}

          {isSignedIn && (
            <div className="flex items-center gap-3">
              {user && <RoleBadge role={user.role} />}
              <div className="rounded-full ring-2 ring-[var(--border)] transition-all hover:ring-[var(--primary)]">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="relative rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text-primary)] md:hidden"
          onClick={() => setOpen(!open)}
        >
          <div className="relative h-5 w-5">
            <Menu className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
            <X className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">

          {showStudentNav && (
            <NavLink to="/courses" className={linkClass}>
              <span className="block py-2">Courses</span>
            </NavLink>
          )}

          {isStudent && (
            <NavLink to="/my-enrollments" className={linkClass}>
              <span className="block py-2">My Enrollments</span>
            </NavLink>
          )}

          {isEducator && (
            <>
              <NavLink to="/educator" className={linkClass}>
                <span className="block py-2">Dashboard</span>
              </NavLink>

              <NavLink to="/educator/courses" className={linkClass}>
                <span className="block py-2">My Courses</span>
              </NavLink>

              <NavLink to="/educator/students" className={linkClass}>
                <span className="block py-2">Students</span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClass}>
                <span className="block py-2">Dashboard</span>
              </NavLink>

              <NavLink to="/admin/users" className={linkClass}>
                <span className="block py-2">Manage Users</span>
              </NavLink>
            </>
          )}

          <div className="mt-2 flex items-center gap-3 border-t border-[var(--border)] pt-4 pb-2">

            {!loading && !isSignedIn && (
              <div className="flex w-full flex-col gap-2">
                <SignInButton mode="modal">
                  <button className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[var(--primary-hover)]">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            )}

            {isSignedIn && (
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full ring-2 ring-[var(--border)]">
                    <UserButton afterSignOutUrl="/" />
                  </div>

                  {user && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {user.name}
                      </span>
                      <RoleBadge role={user.role} size="small" />
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </nav>
      </div>
    </header>
  );
}