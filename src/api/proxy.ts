import { exchangeCodeForToken, validateShopifyRequest } from './auth';

export const handleTokenExchange = async (req: Request): Promise<Response> => {
    try {
        const { code, shop, state } = await req.json();

        if (!code || !shop || !state) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validate the request
        const apiKey = process.env.VITE_SHOPIFY_API_KEY;
        const apiSecret = process.env.VITE_SHOPIFY_API_SECRET;

        if (!apiKey || !apiSecret) {
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Exchange the code for an access token
        const tokenResponse = await exchangeCodeForToken(code, shop, apiKey, apiSecret);

        // Set the access token in an HTTP-only cookie
        const response = new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

        // Set the access token in a secure, HTTP-only cookie
        response.headers.append(
            'Set-Cookie',
            `shopify_access_token=${tokenResponse.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/`
        );

        return response;
    } catch (error) {
        console.error('Token exchange error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to exchange token' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

export const handleShopifyRequest = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const shop = url.searchParams.get('shop');
        const accessToken = req.headers.get('X-Shopify-Access-Token');

        if (!shop || !accessToken) {
            return new Response(
                JSON.stringify({ error: 'Missing required parameters' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Forward the request to Shopify's API
        const shopifyResponse = await fetch(
            `https://${shop}/admin/api/2024-01/graphql.json`,
            {
                method: req.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: req.method !== 'GET' ? await req.text() : undefined,
            }
        );

        const data = await shopifyResponse.json();
        return new Response(JSON.stringify(data), {
            status: shopifyResponse.status,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Shopify request error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process Shopify request' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}; 