import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';


const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY // Use service role for server-side inserts
);

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { Allow: 'POST' },
            body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
        };
    }
    try {
        const { email } = JSON.parse(event.body);
        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing email' }),
            };
        }
        console.log(email)
        const { data, error } = await supabase
            .from('users')
            .select('priceId')
            .eq('email', email)
        if (!data || data.length === 0) return {
            statusCode: 404,
            body: JSON.stringify({ error: 'No user found' }),
        };

        // Return just the first one
        return {
            statusCode: 200,
            body: JSON.stringify(data[0]),
        };
    } catch (err) {
        console.log(err)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
}; 