import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { exchangeCodeForToken } from '../../src/api/auth.js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY // Use service role for server-side inserts
);

export const handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: { Allow: 'GET' },
            body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
        };
    }

    const params = event.queryStringParameters;

    try {
        const { code, shop, state, email, name } = params;

        if (!code || !shop || !state || !email || !name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required parameters' }),
            };
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
            return {
                statusCode: 500,
                body: JSON.stringify({ error: supabaseError.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to complete callback' }),
        };
    }
};
