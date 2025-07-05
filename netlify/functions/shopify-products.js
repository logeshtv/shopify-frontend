export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { Allow: 'POST' },
            body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
        };
    }

    let shop, accessToken;
    try {
        const body = JSON.parse(event.body);
        shop = body.shop;
        accessToken = body.accessToken;
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body' }),
        };
    }

    if (!shop || !accessToken) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing shop or access token' }),
        };
    }

    try {
        const response = await fetch(`https://${shop}/admin/api/2023-10/products.json?limit=5`, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to fetch products from Shopify:', errorData);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch products from Shopify' }),
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Failed to fetch products' }),
        };
    }
}; 