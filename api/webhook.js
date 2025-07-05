// /api/webhook.js

import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
export const config = {
    api: {
        bodyParser: false, // ⛔️ must disable automatic JSON parsing
    },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.VITE_STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
        console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;

    console.log(`✅ Handling event type: ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed': {
            console.log('✅ Processing checkout.session.completed');

            if (!data.customer) {
                console.log('⚠️  No customer ID in checkout.session.completed — skipping.');
                break;
            }

            let customer;
            try {
                customer = await stripe.customers.retrieve(data.customer);
            } catch (err) {
                console.log(`❌ Failed to retrieve customer: ${err.message}`);
                break;
            }

            const { error } = await supabase
                .from('users')
                .update({
                    priceId: data.line_items?.data[0]?.price?.id || null,
                    hasAccess: true,
                    customerId: data.customer,
                    sessionId: data.id,
                })
                .eq('email', customer.email);

            if (error) {
                console.log('❌ Supabase update error:', error);
                return res.status(500).send(error);
            }
            break;
        }

        case 'invoice.payment_succeeded': {
            if (!data.customer) {
                console.log('⚠️  No customer ID in invoice.payment_succeeded — skipping.');
                break;
            }

            const { error } = await supabase
                .from('users')
                .update({ hasAccess: true })
                .eq('customerId', data.customer);

            if (error) {
                console.log('❌ Supabase update error:', error);
                return res.status(500).send(error);
            }
            break;
        }

        case 'invoice.payment_failed': {
            if (!data.customer) {
                console.log('⚠️  No customer ID in invoice.payment_failed — skipping.');
                break;
            }

            const { error } = await supabase
                .from('users')
                .update({ hasAccess: false })
                .eq('customerId', data.customer);

            if (error) {
                console.log('❌ Supabase update error:', error);
                return res.status(500).send(error);
            }
            break;
        }

        case 'customer.subscription.deleted':
        case 'customer.subscription.updated': {
            const subscriptionId = data.id;
            let subscription;
            try {
                subscription = await stripe.subscriptions.retrieve(subscriptionId);
            } catch (err) {
                console.log(`❌ Failed to retrieve subscription: ${err.message}`);
                break;
            }

            const { error } = await supabase
                .from('users')
                .update({
                    hasAccess: subscription.status === 'active',
                    priceId: subscription.items.data[0]?.price?.id || null,
                })
                .eq('customerId', subscription.customer);

            if (error) {
                console.log('❌ Supabase update error:', error);
                return res.status(500).send(error);
            }
            break;
        }

        default:
            console.log(`⚠️  Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
}
