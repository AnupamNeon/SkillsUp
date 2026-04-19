import { Router } from "express";
import courseRouter from "./course.routes.js";
import educatorRouter from "./educator.routes.js";
import userRouter from "./user.routes.js";
import adminRouter from "./admin.routes.js";
import webhookRouter from "./webhook.routes.js";
import mongoose from "mongoose";
import quizRouter from "./quiz.routes.js";

const router = Router();

router.use("/health", async (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const status = dbState === 1 ? "ok" : "degraded";
  res.status(status === "ok" ? 200 : 503).json({
    status,
    database: dbState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

router.use("/course", courseRouter);
router.use("/educator", educatorRouter);
router.use("/user", userRouter);
router.use("/admin", adminRouter);

router.use("/quiz", quizRouter);

export { webhookRouter };
export default router;
