import mongoose from 'mongoose';
import { Webhook } from 'svix';
import Stripe from 'stripe';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import { ROLES } from '../utils/roles.js';
import logger from '../utils/logger.js';

// ─────────────────────────────────────────────
// Clerk Webhook
// ─────────────────────────────────────────────
export const clerkWebhooks = async (req, res) => {
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const payload = req.body.toString();
    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };

    const event = wh.verify(payload, headers);
    const { data, type } = event;

    switch (type) {
      case 'user.created': {
        await User.create({
          _id: data.id,
          email: data.email_addresses?.[0]?.email_address,
          name:
            `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
            'User',
          imageUrl: data.image_url,
          role: data.public_metadata?.role || ROLES.STUDENT,
        });

        logger.info('Clerk user created', { userId: data.id });
        break;
      }

      case 'user.updated': {
        await User.findByIdAndUpdate(data.id, {
          email: data.email_addresses?.[0]?.email_address,
          name:
            `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
            'User',
          imageUrl: data.image_url,
          role: data.public_metadata?.role || ROLES.STUDENT,
        });

        logger.info('Clerk user updated', { userId: data.id });
        break;
      }

      // ──────────────────────────────────────────────────────────
      // FIX: Do NOT auto-delete users from DB.
      // Accounts may only be removed by an admin via
      //   DELETE /api/admin/users/:userId
      // which handles both Clerk + DB deletion.
      //
      // To fully prevent self-deletion, disable
      //   "Allow users to delete their accounts"
      // in Clerk Dashboard → User & Authentication → Settings.
      // ──────────────────────────────────────────────────────────
      case 'user.deleted': {
        logger.warn(
          'Clerk user.deleted event IGNORED — account deletion is admin-only. ' +
            'Disable self-service deletion in Clerk Dashboard.',
          { userId: data.id }
        );
        break;
      }

      default:
        logger.debug('Unhandled Clerk event', { type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Clerk webhook error', { error: error.message });
    res
      .status(400)
      .json({ success: false, message: 'Webhook verification failed' });
  }
};

// ─────────────────────────────────────────────
// Stripe Webhook (TRANSACTION SAFE)
// ─────────────────────────────────────────────
export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe signature verification failed', {
      error: err.message,
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid signature',
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sessionData = event.data.object;
        const { purchaseId } = sessionData.metadata || {};

        if (!purchaseId) break;

        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) break;
        if (purchase.status === 'completed') break;

        const [user, course] = await Promise.all([
          User.findById(purchase.userId),
          Course.findById(purchase.courseId),
        ]);

        if (!user || !course) {
          logger.warn('Stripe webhook: user or course missing', {
            purchaseId,
          });
          break;
        }

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
          course.enrolledStudents.addToSet(purchase.userId);
          await course.save({ session: dbSession });

          user.enrolledCourses.addToSet(purchase.courseId);
          await user.save({ session: dbSession });

          purchase.status = 'completed';
          await purchase.save({ session: dbSession });

          await dbSession.commitTransaction();
        } catch (err) {
          await dbSession.abortTransaction();
          throw err;
        } finally {
          dbSession.endSession();
        }

        logger.info('Purchase completed', {
          purchaseId,
          userId: purchase.userId,
          courseId: purchase.courseId.toString(),
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;

        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const purchaseId = sessions.data[0]?.metadata?.purchaseId;

        if (purchaseId) {
          await Purchase.findByIdAndUpdate(purchaseId, {
            status: 'failed',
          });
          logger.warn('Payment failed', { purchaseId });
        }

        break;
      }

      default:
        logger.debug('Unhandled Stripe event', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing error', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};