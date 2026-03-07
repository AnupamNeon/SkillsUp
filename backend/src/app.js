import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import requestLogger from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes, { webhookRouter } from './routes/index.js';

const app = express();

// ─── Security headers ────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.CORS_ORIGIN;
      if (allowed === '*') {
        // In development: allow any origin but with credentials
        // you must echo back the requesting origin, not '*'
        callback(null, origin || true);
      } else {
        const origins = allowed.split(',').map((o) => o.trim());
        if (!origin || origins.includes(origin)) {
          callback(null, origin);
        } else {
          callback(new Error('CORS not allowed'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// ─── Webhook routes (BEFORE body parsers — Stripe needs raw body) ─
app.use('/webhooks', webhookRouter);

// ─── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


// ─── Request logging ─────────────────────────────────────────
app.use(requestLogger);

// ─── Rate limiting (global) ──────────────────────────────────
app.use('/api', globalLimiter);

// ─── Clerk auth middleware ────────────────────────────────────
app.use(clerkMiddleware());

// ─── Health & root ────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'LMS API is running' });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger docs ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─── API routes ───────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── Error handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;