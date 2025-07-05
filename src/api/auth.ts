import crypto from 'crypto';

interface TokenResponse {
    access_token: string;
    scope: string;
}

export const verifyHmac = (query: URLSearchParams, secret: string): boolean => {
    const hmac = query.get('hmac');
    if (!hmac) return false;

    // Remove hmac from query parameters
    const queryParams = new URLSearchParams(query);
    queryParams.delete('hmac');

    // Sort parameters alphabetically
    const sortedParams = Array.from(queryParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    // Create HMAC
    const calculatedHmac = crypto
        .createHmac('sha256', secret)
        .update(sortedParams)
        .digest('hex');

    return hmac === calculatedHmac;
};

export const exchangeCodeForToken = async (
    code: string,
    shop: string,
    apiKey: string,
    apiSecret: string
): Promise<TokenResponse> => {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for access token');
    }

    return response.json();
};

export const validateShopifyRequest = (
    query: URLSearchParams,
    apiSecret: string
): boolean => {
    const shop = query.get('shop');
    const timestamp = query.get('timestamp');
    const nonce = query.get('nonce');

    if (!shop || !timestamp || !nonce) {
        return false;
    }

    // Verify the request is not older than 5 minutes
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - requestTime > 300) {
        return false;
    }

    // Verify HMAC
    return verifyHmac(query, apiSecret);
}; 