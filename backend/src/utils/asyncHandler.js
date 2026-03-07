/**
 * Wraps an async route handler / middleware so that rejected
 * promises are automatically forwarded to Express error handling.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;