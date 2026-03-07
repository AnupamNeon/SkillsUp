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
  `relative text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'text-blue-600'
      : 'text-gray-600 hover:text-gray-900'
  } after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-blue-600 after:to-indigo-600 after:transition-all after:duration-300 ${
    isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
  }`;

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    gradient: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200/50',
    ringColor: 'ring-red-500/20',
  },
  educator: {
    label: 'Educator',
    icon: BookOpen,
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200/50',
    ringColor: 'ring-purple-500/20',
  },
  student: {
    label: 'Student',
    icon: User,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200/50',
    ringColor: 'ring-emerald-500/20',
  },
};

function RoleBadge({ role, size = 'default' }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const Icon = config.icon;

  if (size === 'small') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.ringColor}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${config.gradient}`} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.ringColor}`}
    >
      <Icon className="h-3 w-3" />
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
          ? 'border-b border-gray-200/50 bg-white/80 shadow-lg shadow-gray-200/20 backdrop-blur-xl'
          : 'border-b border-transparent bg-white/60 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={Logo}
            alt="Role LMS"
            className="h-15 w-full"
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
                <button className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5">
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
              <div className="ring-2 ring-gray-100 rounded-full">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="relative rounded-lg p-2 transition-colors hover:bg-gray-100 md:hidden"
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
        className={`overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
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

          <div className="mt-2 flex items-center gap-3 border-t border-gray-100 pt-4">

            {!loading && !isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}

            {isSignedIn && (
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />

                  {user && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900">
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