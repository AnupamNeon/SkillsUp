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

// ─── Security headers ─────────────────────────────
app.use(helmet());

// ─── Allowed origins ──────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// ─── CORS configuration (Express 5 compatible) ───
app.use(
  cors({
    origin(origin, callback) {
      // allow server-to-server or Postman
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

// ─── Webhooks (before body parser) ────────────────
app.use("/webhooks", webhookRouter);

// ─── Body parsers ─────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Request logging ──────────────────────────────
app.use(requestLogger);

// ─── Rate limiter ─────────────────────────────────
app.use("/api", globalLimiter);

// ─── Clerk authentication ─────────────────────────
app.use(clerkMiddleware());

// ─── Root route ───────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "LMS API is running",
  });
});

// ─── Health check ─────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger docs (non-production) ────────────────
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─── API routes ───────────────────────────────────
app.use("/api", apiRoutes);

// ─── Error handling ───────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;