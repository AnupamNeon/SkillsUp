export const POLL_CONFIG = {
  MAX_ATTEMPTS: 10,
  INTERVAL: 2000, // ms
  RETRY_DELAY: 1000,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  STUDENTS_LIMIT: 15,
  QUIZ_ATTEMPTS_LIMIT: 10,
};

export const QUIZ = {
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 20,
  DEFAULT_TIME_LIMIT: 10, // minutes
  DEFAULT_PASSING_SCORE: 60, // percentage
};

export const ROUTES = {
  HOME: "/",
  COURSES: "/courses",
  MY_ENROLLMENTS: "/my-enrollments",
  EDUCATOR_DASHBOARD: "/educator",
  ADMIN_DASHBOARD: "/admin",
};

export const ROLES = {
  STUDENT: "student",
  EDUCATOR: "educator",
  ADMIN: "admin",
};

export const BADGE_VARIANTS = {
  SUCCESS: {
    bg: "bg-[#E8F5E9]",
    text: "text-[var(--success)]",
    border: "border-[var(--success)]/20",
  },
  WARNING: {
    bg: "bg-[#FFF3E0]",
    text: "text-[var(--accent)]",
    border: "border-[var(--accent)]/20",
  },
  DANGER: {
    bg: "bg-[#FFEBEE]",
    text: "text-[var(--danger)]",
    border: "border-[var(--danger)]/20",
  },
  INFO: {
    bg: "bg-[var(--primary-light)]",
    text: "text-[var(--primary)]",
    border: "border-[var(--primary)]/20",
  },
};