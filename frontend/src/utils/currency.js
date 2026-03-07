export const CURRENCY_SYMBOL = "₹";

/**
 * Format a numeric amount with the app currency symbol.
 * Handles null / undefined / NaN gracefully.
 */
export function formatPrice(amount) {
  const num = Number(amount || 0);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;
  // Show decimals only when needed
  return num % 1 === 0
    ? `${CURRENCY_SYMBOL}${num}`
    : `${CURRENCY_SYMBOL}${num.toFixed(2)}`;
}
