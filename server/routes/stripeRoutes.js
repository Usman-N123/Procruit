const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook } = require('../controllers/stripeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Stripe Webhook needs the raw body to verify signature. We need to handle this in server.js or isolate it here.
// Assuming we handle raw body parsing in server.js for this specific route.
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protect checkout session creation - only Recruiters can buy interviews
router.post('/create-checkout-session', protect, authorize('RECRUITER'), createCheckoutSession);

module.exports = router;
