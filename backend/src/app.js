import express from "express";
import helmet from "helmet";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./config/swagger.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import requestLogger from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import apiRoutes, { webhookRouter } from "./routes/index.js";

const app = express();

// ─── Security headers ────────────────────────────────────────
app.use(helmet());

// ─── Allowed origins setup ───────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

// ─── CORS configuration ──────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// Handle preflight requests
app.options("*", cors());

// ─── Webhook routes (BEFORE body parsers — Stripe needs raw body) ─
app.use("/webhooks", webhookRouter);

// ─── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Request logging ─────────────────────────────────────────
app.use(requestLogger);

// ─── Rate limiting (global) ──────────────────────────────────
app.use("/api", globalLimiter);

// ─── Clerk auth middleware ───────────────────────────────────
app.use(clerkMiddleware());

// ─── Health & root ───────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "LMS API is running",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger docs (disabled in production) ───────────────────
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─── API routes ───────────────────────────────────────────────
app.use("/api", apiRoutes);

// ─── Error handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;