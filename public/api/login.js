// api/login.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: "Server missing Supabase credentials." });
        }

        const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok || loginData.error) {
            return res.status(loginResponse.status).json({ 
                error: loginData.error?.message || "Invalid login details." 
            });
        }

        return res.status(200).json({ 
            success: true, 
            user: loginData.user.email,
            token: loginData.access_token,
            username: loginData.user.user_metadata?.display_name || "User"
        });
    } catch (err) {
        return res.status(500).json({ error: "Authentication system error: " + err.message });
    }
}