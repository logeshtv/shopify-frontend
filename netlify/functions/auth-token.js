import { exchangeCodeForToken } from '../../src/api/auth.js';
import cookie from 'cookie';
import 'dotenv/config';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { Allow: 'POST' },
            body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
        };
    }

    let code, shop, state;
    try {
        const body = JSON.parse(event.body);
        code = body.code;
        shop = body.shop;
        state = body.state;
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body' }),
        };
    }

    if (!code || !shop || !state) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters' }),
        };
    }

    const apiKey = process.env.VITE_SHOPIFY_API_KEY;
    const apiSecret = process.env.VITE_SHOPIFY_API_SECRET;

    if (!apiKey || !apiSecret) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: Missing API credentials' }),
        };
    }

    try {
        const tokenResponse = await exchangeCodeForToken(code, shop, apiKey, apiSecret);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        };

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': cookie.serialize('shopify_access_token', String(tokenResponse.access_token), cookieOptions),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: true, access_token: tokenResponse.access_token }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to exchange token' }),
        };
    }
}; 