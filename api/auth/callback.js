import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { exchangeCodeForToken } from '../../src/api/auth.js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY // Use service role for server-side inserts
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { code, shop, state, email, name } = req.query;

        if (!code || !shop || !state || !email || !name) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Exchange code for Shopify access token
        const apiKey = process.env.SHOPIFY_API_KEY;
        const apiSecret = process.env.SHOPIFY_API_SECRET;
        const tokenResponse = await exchangeCodeForToken(code, shop, apiKey, apiSecret);

        // Insert user into Supabase
        const { error: supabaseError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    name,
                    shopify_domain: shop,
                    shopify_access_token: tokenResponse.access_token,
                },
            ]);

        if (supabaseError) {
            return res.status(500).json({ error: supabaseError.message });
        }

        // Optionally, set a cookie or redirect to dashboard
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: 'Failed to complete callback' });
    }
}
