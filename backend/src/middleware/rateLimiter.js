import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

/** Applied globally */
export const globalLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  'Too many requests, please try again later.'
);

/** Auth-related endpoints */
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts, please try again later.'
);

/** Purchase / payment endpoints */
export const purchaseLimiter = createLimiter(
  60 * 60 * 1000,
  10,
  'Too many purchase attempts, please try again later.'
);

/** Admin write operations */
export const adminWriteLimiter = createLimiter(
  15 * 60 * 1000,
  50,
  'Too many admin requests, please try again later.'
);