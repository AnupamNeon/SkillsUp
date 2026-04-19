import mongoose from "mongoose";
import { Webhook } from "svix";
import Stripe from "stripe";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import { ROLES } from "../utils/roles.js";
import logger from "../utils/logger.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// ─── Stripe singleton ─────────────────────────────────────────────────────
let _stripe;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

// ─────────────────────────────────────────────────────────────────────────
// Clerk Webhook Handler (UPDATED)
// ─────────────────────────────────────────────────────────────────────────
export const clerkWebhooks = async (req, res) => {
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Convert to string for svix
    const payload = req.body.toString("utf8");

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify will throw if signature is invalid
    const event = wh.verify(payload, headers);
    const { data, type } = event;

    switch (type) {
      case "user.created": {
        // Use upsert to handle race conditions
        await User.findByIdAndUpdate(
          data.id,
          {
            $setOnInsert: {
              _id: data.id,
              email: data.email_addresses?.[0]?.email_address,
              name:
                `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
                "User",
              imageUrl: data.image_url,
              role: data.public_metadata?.role || ROLES.STUDENT,
            },
          },
          { upsert: true, new: true }
        );
        logger.info("Clerk user created/synced", { userId: data.id });
        break;
      }

      case "user.updated": {
        await User.findByIdAndUpdate(data.id, {
          email: data.email_addresses?.[0]?.email_address,
          name:
            `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          imageUrl: data.image_url,
          role: data.public_metadata?.role || ROLES.STUDENT,
        });
        logger.info("Clerk user updated", { userId: data.id });
        break;
      }

      case "user.deleted": {
        logger.warn(
          "Clerk user.deleted event IGNORED — use admin API for deletion.",
          { userId: data.id }
        );
        break;
      }

      default:
        logger.debug("Unhandled Clerk event", { type });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Clerk webhook error", { 
      error: error.message,
      stack: error.stack 
    });
    // Return 400 so Clerk knows verification failed and can retry
    return res
      .status(400)
      .json({ success: false, message: "Webhook verification failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// Stripe Webhook Handler (UPDATED)
// ─────────────────────────────────────────────────────────────────────────

export const stripeWebhooks = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];

  // ── 1. Verify Stripe signature ────────────────────────────────────────
  // ✅ FIX: req.body is already a Buffer from express.raw()
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,  // ← Already a Buffer, no conversion needed
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error("Stripe signature verification failed", {
      error: err.message,
      sigPrefix: sig?.substring(0, 20),
    });
    return res
      .status(400)
      .json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
  }

  logger.info("Stripe webhook received", {
    type: event.type,
    eventId: event.id,
  });

  // ── 2. Route to appropriate handler ───────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object, stripe);
        break;
      }

      case "payment_intent.payment_failed": {
        await handlePaymentFailed(event.data.object, stripe);
        break;
      }

      case "checkout.session.expired": {
        await handleSessionExpired(event.data.object);
        break;
      }

      default:
        logger.debug("Unhandled Stripe event type", { type: event.type });
    }

    // ── 3. Send success response ONLY after processing ─────────────────
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed", {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack,
    });

    // ── 4. Return 500 so Stripe WILL retry this webhook ────────────────
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed — will retry",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// Transaction Support Detection (FIXED)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Reliably detect if the MongoDB connection supports multi-document
 * transactions (requires replica set or MongoDB Atlas M10+).
 *
 * FIX: The original code had an operator precedence bug AND used
 * deprecated `serverConfig` API from old MongoDB driver versions.
 */
async function detectTransactionSupport() {
  // Explicit env override takes precedence
  if (process.env.MONGODB_SUPPORTS_TRANSACTIONS === "true") return true;
  if (process.env.MONGODB_SUPPORTS_TRANSACTIONS === "false") return false;

  try {
    // Must be connected first
    if (mongoose.connection.readyState !== 1) return false;

    // Modern MongoDB driver v4+ way to check replica set membership
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.command({ isMaster: 1 });

    // A replica set member will have a 'setName' field
    const isReplicaSet = Boolean(serverStatus?.setName);

    logger.debug("Transaction support detection", {
      isReplicaSet,
      setName: serverStatus?.setName,
    });

    return isReplicaSet;
  } catch (err) {
    logger.warn("Could not detect transaction support, defaulting to false", {
      error: err.message,
    });
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Core Enrollment Fulfillment Logic
// ─────────────────────────────────────────────────────────────────────────

/**
 * Atomically fulfill a purchase: update status to 'completed',
 * add student to course, add course to student's enrolled list.
 *
 * Designed to be idempotent — safe to call multiple times.
 */
export async function fulfillEnrollment(purchaseId) {
  // ── Step 1: Fetch and validate the purchase ──────────────────────────
  const purchase = await Purchase.findById(purchaseId);

  if (!purchase) {
    logger.error("fulfillEnrollment: purchase not found", { purchaseId });
    return { success: false, reason: "purchase_not_found" };
  }

  // ── Step 2: Idempotency check ────────────────────────────────────────
  // If already completed, return success without doing anything.
  // This handles Stripe's webhook retry mechanism gracefully.
  if (purchase.status === "completed") {
    logger.info("fulfillEnrollment: already completed (idempotent skip)", {
      purchaseId,
    });
    return { success: true, reason: "already_completed" };
  }

  // ── Step 3: Load related documents ──────────────────────────────────
  const [user, course] = await Promise.all([
    User.findById(purchase.userId),
    Course.findById(purchase.courseId),
  ]);

  if (!user) {
    logger.error("fulfillEnrollment: user not found", {
      purchaseId,
      userId: purchase.userId,
    });
    await Purchase.findByIdAndUpdate(purchaseId, { status: "failed" });
    return { success: false, reason: "user_not_found" };
  }

  if (!course) {
    logger.error("fulfillEnrollment: course not found", {
      purchaseId,
      courseId: purchase.courseId,
    });
    await Purchase.findByIdAndUpdate(purchaseId, { status: "failed" });
    return { success: false, reason: "course_not_found" };
  }

  // ── Step 4: Choose execution strategy based on DB capabilities ───────
  const supportsTransactions = await detectTransactionSupport();

  if (supportsTransactions) {
    return await fulfillWithTransaction(purchase, user, course);
  } else {
    return await fulfillWithoutTransaction(purchase);
  }
}

/**
 * Fulfillment using MongoDB multi-document transactions.
 * All three operations succeed or all three roll back.
 */

async function fulfillWithTransaction(purchase, user, course) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });

    await Course.findByIdAndUpdate(
      course._id,
      { $addToSet: { enrolledStudents: String(purchase.userId) } },
      { session, new: true }
    );

    await User.findByIdAndUpdate(
      purchase.userId,
      { $addToSet: { enrolledCourses: purchase.courseId } },
      { session, new: true }
    );

    // ✅ FIX: Mark completion timestamp
    await Purchase.findByIdAndUpdate(
      purchase._id,
      { 
        status: "completed",
        fulfilledAt: new Date(),  // ← Track when enrollment happened
      },
      { session, new: true }
    );

    await session.commitTransaction();

    logger.info("fulfillEnrollment: completed with transaction", {
      purchaseId: String(purchase._id),
      userId: String(purchase.userId),
      courseId: String(purchase.courseId),
      fulfilledAt: new Date().toISOString(),
    });

    return { success: true, reason: "fulfilled_with_transaction" };
  } catch (err) {
    await session.abortTransaction();
    logger.error("fulfillEnrollment: transaction aborted", {
      purchaseId: String(purchase._id),
      error: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    await session.endSession();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Same for fulfillWithoutTransaction
// ─────────────────────────────────────────────────────────────────────────

async function fulfillWithoutTransaction(purchase) {
  const purchaseId = String(purchase._id);

  try {
    await Course.findByIdAndUpdate(
      purchase.courseId,
      { $addToSet: { enrolledStudents: String(purchase.userId) } },
      { new: true }
    );

    logger.debug("fulfillEnrollment: course enrollment updated", {
      purchaseId,
    });

    await User.findByIdAndUpdate(
      purchase.userId,
      { $addToSet: { enrolledCourses: purchase.courseId } },
      { new: true }
    );

    logger.debug("fulfillEnrollment: user enrollment updated", { purchaseId });

    // ✅ FIX: Mark completion timestamp
    await Purchase.findByIdAndUpdate(
      purchase._id,
      { 
        status: "completed",
        fulfilledAt: new Date(),  // ← Track when enrollment happened
      },
      { new: true }
    );

    logger.info("fulfillEnrollment: completed without transaction", {
      purchaseId,
      userId: String(purchase.userId),
      courseId: String(purchase.courseId),
      fulfilledAt: new Date().toISOString(),
    });

    return { success: true, reason: "fulfilled_without_transaction" };
  } catch (err) {
    logger.error("fulfillEnrollment: write failed", {
      purchaseId,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session, stripe) {
  const { purchaseId } = session.metadata || {};

  if (!purchaseId) {
    logger.warn("Stripe webhook: no purchaseId in session metadata", {
      sessionId: session.id,
    });
    return;
  }

  logger.info("Stripe checkout.session.completed received", {
    purchaseId,
    sessionId: session.id,
    paymentStatus: session.payment_status,
  });

  // Verify payment actually succeeded
  // payment_status can be 'paid', 'unpaid', or 'no_payment_required'
  if (session.payment_status !== "paid") {
    logger.warn("Stripe webhook: session not fully paid, skipping fulfillment", {
      purchaseId,
      paymentStatus: session.payment_status,
    });
    return;
  }

  const result = await fulfillEnrollment(purchaseId);

  logger.info("Enrollment fulfillment result", {
    purchaseId,
    sessionId: session.id,
    ...result,
  });
}

/**
 * Handle failed payment intent
 */
async function handlePaymentFailed(paymentIntent, stripe) {
  // Look up the checkout session that created this payment intent
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });

  const purchaseId = sessions.data[0]?.metadata?.purchaseId;

  if (purchaseId) {
    // Only mark as failed if still pending (don't overwrite completed)
    const result = await Purchase.findOneAndUpdate(
      { _id: purchaseId, status: "pending" },
      { status: "failed" },
      { new: true }
    );

    if (result) {
      logger.warn("Payment failed — purchase marked as failed", {
        purchaseId,
        paymentIntentId: paymentIntent.id,
        failureMessage: paymentIntent.last_payment_error?.message,
      });
    }
  }
}

/**
 * Handle expired checkout session
 */
async function handleSessionExpired(session) {
  const { purchaseId } = session.metadata || {};

  if (purchaseId) {
    const result = await Purchase.findOneAndUpdate(
      { _id: purchaseId, status: "pending" },
      { status: "failed" },
      { new: true }
    );

    if (result) {
      logger.info("Checkout session expired — purchase marked as failed", {
        purchaseId,
        sessionId: session.id,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Manual Recovery Endpoint
// ─────────────────────────────────────────────────────────────────────────

export const manuallyFulfillPurchase = asyncHandler(async (req, res) => {
  const { purchaseId } = req.params;

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw ApiError.notFound("Purchase not found");

  if (purchase.status === "completed") {
    return res.json({
      success: true,
      message: "Purchase already completed",
    });
  }

  if (!purchase.stripeSessionId) {
    throw ApiError.badRequest(
      "Purchase missing Stripe session ID. Cannot verify payment status."
    );
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(
    purchase.stripeSessionId
  );

  if (!session) {
    throw ApiError.badRequest("Stripe session not found");
  }

  if (session.payment_status !== "paid") {
    throw ApiError.badRequest(
      `Cannot fulfill — payment status is '${session.payment_status}', not 'paid'`
    );
  }

  const result = await fulfillEnrollment(purchaseId);

  logger.info("Manual enrollment fulfillment triggered", {
    purchaseId,
    byAdmin: req.userId,
    stripeSessionId: purchase.stripeSessionId,
    result,
  });

  res.json({
    success: true,
    message: "Enrollment fulfilled successfully",
    result,
  });
});