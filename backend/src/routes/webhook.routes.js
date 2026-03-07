import { Router } from 'express';
import express from 'express';
import { clerkWebhooks, stripeWebhooks } from '../controllers/webhook.controller.js';

const router = Router();

// Clerk requires raw body
router.post( '/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

// Stripe requires raw body for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

export default router;