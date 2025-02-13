import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import supabase from '../supabaseClient';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create a payment intent for subscription
router.post('/create-payment-intent', async (req: Request, res: Response): Promise<any> => {
    try {
        const { plan, userId } = req.body;
        
        // Get correct price ID based on plan
        const priceId = plan === 'yearly' 
            ? process.env.STRIPE_PRICE_ID_YEARLY 
            : process.env.STRIPE_PRICE_ID_MONTHLY;

        if (!priceId) {
            throw new Error('Invalid subscription plan');
        }

        // Get or create Stripe customer
        const { data: user } = await supabase
            .from('users')
            .select('email, stripe_customer_id')
            .eq('id', userId)
            .single();

        let customerId = user?.stripe_customer_id;

        if (!customerId) {
            // Create a new customer in Stripe
            const customer = await stripe.customers.create({
                email: user?.email,
                metadata: {
                    supabase_user_id: userId
                }
            });
            customerId = customer.id;

            // Save Stripe customer ID to user
            await supabase
                .from('users')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);
        }

        // Create ephemeral key
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2023-10-16' }
        );

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

        res.json({
            clientSecret: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            subscription: subscription.id
        });

    } catch (error: any) {
        console.error('Subscription error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Webhook to handle subscription events
export const webhookHandler = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature']!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Get user by Stripe customer ID
                const { data: user } = await supabase
                    .from('users')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (user) {
                    // Update user subscription status
                    await supabase
                        .from('users')
                        .update({
                            subscription_tier: 'premium',
                            subscription_valid_until: new Date(subscription.current_period_end * 1000).toISOString()
                        })
                        .eq('id', user.id);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Get user by Stripe customer ID
                const { data: user } = await supabase
                    .from('users')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (user) {
                    // Downgrade user to basic
                    await supabase
                        .from('users')
                        .update({
                            subscription_tier: 'basic',
                            subscription_valid_until: null
                        })
                        .eq('id', user.id);
                }
                break;
            }
        }

        res.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: error.message });
    }
};

export default router; 