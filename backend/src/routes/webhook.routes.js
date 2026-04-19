import { Router } from "express";
import express from "express";
import {
  clerkWebhooks,
  stripeWebhooks,
} from "../controllers/webhook.controller.js";

const router = Router();

// Clerk webhook — requires raw body for svix signature verification
router.post(
  "/clerk",
  express.raw({ type: "application/json" }),  // ← Properly buffers the stream
  clerkWebhooks
);

// Stripe webhook — requires raw body for Stripe signature verification
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),  // ← Properly buffers the stream
  stripeWebhooks
);

export default router;