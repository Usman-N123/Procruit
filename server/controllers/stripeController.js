const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Interview = require('../models/Interview');
const User = require('../models/User');

// @desc    Create a Stripe Checkout Session for an Interview Booking
// @route   POST /api/payments/create-checkout-session
// @access  Private (Recruiter)
const createCheckoutSession = async (req, res) => {
    try {
        const { interviewId } = req.body;

        if (!interviewId) {
            return res.status(400).json({ message: 'Interview ID is required' });
        }

        // 1. Verify Interview Exists and is valid
        const interview = await Interview.findById(interviewId).populate('candidateId', 'name profile');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // 2. Ensure only the Recruiter who made the booking can pay
        if (interview.recruiterId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to pay for this interview' });
        }

        // 3. Ensure it hasn't been paid already
        if (interview.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'This interview has already been paid for' });
        }

        // 4. Get Interviewer's Profile to find their Hourly Rate
        const interviewerUser = await User.findById(interview.candidateId._id).populate('profile');
        if (!interviewerUser || !interviewerUser.profile || !interviewerUser.profile.hourlyRate) {
            return res.status(400).json({ message: "Interviewer's hourly rate is not set" });
        }

        const hourlyRate = interviewerUser.profile.hourlyRate; // in dollars
        const amountInCents = Math.round(hourlyRate * 100);

        // 5. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Interview Session with ${interviewerUser.name}`,
                            description: `Booking for ${new Date(interview.scheduledTime).toLocaleString()}`,
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                interviewId: interview._id.toString(), // Important: Used in Webhook to fulfill the order
            },
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/recruiter/schedule?payment=success`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/recruiter/schedule?payment=cancelled`,
        });

        res.json({ id: session.id, url: session.url });

    } catch (error) {
        console.error("Stripe Session Error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Stripe Webhook Endpoint
// @route   POST /api/payments/webhook
// @access  Public (Called by Stripe)
const stripeWebhook = async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        // Stripe requires the raw body to verify the signature
        // Note: Express needs `express.raw({type: 'application/json'})` configured for this route in server.js
        event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Fulfill the purchase...
        const interviewId = session.metadata.interviewId;

        if (interviewId) {
            try {
                const interview = await Interview.findByIdAndUpdate(
                    interviewId,
                    { paymentStatus: 'Paid' },
                    { new: true }
                );
                console.log(`Payment successful for interview: ${interviewId}`);
            } catch (err) {
                console.error(`Error updating interview ${interviewId} to Paid:`, err);
            }
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send();
};

module.exports = {
    createCheckoutSession,
    stripeWebhook
};
