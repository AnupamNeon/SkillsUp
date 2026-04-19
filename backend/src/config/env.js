const requiredVars = [
  'MONGODB_URI',
  'CLOUDINARY_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_SECRET_KEY',
  'CLERK_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const optionalVars = {
  NODE_ENV: 'development',
  PORT: '5000',
  CURRENCY: 'inr',                   
  CORS_ORIGIN: '*',
  ADMIN_CLERK_USER_IDS: '',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
};

// ─── Common aliases → valid Stripe currency code ──────────
const CURRENCY_ALIASES = {
  rs: 'inr',
  'rs.': 'inr',
  rupee: 'inr',
  rupees: 'inr',
  '₹': 'inr',
  dollar: 'usd',
  dollars: 'usd',
  $: 'usd',
  '€': 'eur',
  euro: 'eur',
  '£': 'gbp',
  pound: 'gbp',
};

const VALID_CURRENCIES = [
  'inr', 'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'sgd', 'aed',
];

export function validateEnv() {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  // Apply defaults for optional vars
  for (const [key, defaultValue] of Object.entries(optionalVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  // Validate specific formats
  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  const port = parseInt(process.env.PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }

  // ─── Normalise CURRENCY ────────────────────────────────────
  let currency = process.env.CURRENCY.toLowerCase().trim();

  // Map aliases like "Rs" → "inr"
  if (CURRENCY_ALIASES[currency]) {
    currency = CURRENCY_ALIASES[currency];
  }

  if (!VALID_CURRENCIES.includes(currency)) {
    throw new Error(
      `CURRENCY "${process.env.CURRENCY}" is not a valid Stripe currency code.\n` +
        `  Valid: ${VALID_CURRENCIES.join(', ')}\n` +
        `  Common aliases: Rs → inr, $ → usd, € → eur, £ → gbp`
    );
  }

  // Write back the normalised value so every module reads "inr" not "Rs"
  process.env.CURRENCY = currency;
}

export function getAdminUserIds() {
  return (process.env.ADMIN_CLERK_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}