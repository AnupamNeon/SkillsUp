const CURRENCY_SYMBOLS = {
  inr: "₹",
  usd: "$",
  eur: "€",
  gbp: "£",
};

const currencyCode = (import.meta.env.VITE_CURRENCY || "inr").toLowerCase();
export const CURRENCY_SYMBOL =
  CURRENCY_SYMBOLS[currencyCode] || currencyCode.toUpperCase() + " ";

// Format a numeric amount with the app currency symbol.
export function formatPrice(amount) {
  const num = Number(amount || 0);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;
  return num % 1 === 0
    ? `${CURRENCY_SYMBOL}${num.toLocaleString()}`
    : `${CURRENCY_SYMBOL}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
