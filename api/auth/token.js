import cookie from 'cookie';
import 'dotenv/config';

const exchangeCodeForToken = async (code, shop, apiKey, apiSecret) => {
    const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
        client_id: apiKey,
        client_secret: apiSecret,
        code,
    };

    const response = await fetch(accessTokenRequestUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(accessTokenPayload),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for access token');
    }

    return response.json();
}; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { code, shop, state } = req.body;

        if (!code || !shop || !state) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const apiKey = process.env.VITE_SHOPIFY_API_KEY;
        const apiSecret = process.env.VITE_SHOPIFY_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.error('Missing environment variables: SHOPIFY_API_KEY or VITE_SHOPIFY_API_SECRET');
            return res.status(500).json({ error: 'Server configuration error: Missing API credentials' });
        }

        const tokenResponse = await exchangeCodeForToken(code, shop, apiKey, apiSecret);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        };

        res.setHeader('Set-Cookie', cookie.serialize('shopify_access_token', String(tokenResponse.access_token), cookieOptions));

        res.status(200).json({ success: true, access_token: tokenResponse.access_token });
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
} 