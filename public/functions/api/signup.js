// api/signup.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, username, password } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ error: "All registration fields are required." });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: "Server missing Supabase credentials." });
        }

        // 1. Register the user profile
        const signUpResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, options: { data: { display_name: username } } })
        });
        const signUpData = await signUpResponse.json();
        if (!signUpResponse.ok || signUpData.error) {
            return res.status(signUpResponse.status).json({ error: signUpData.error?.message || "Registration failed." });
        }

        // 2. Instantly sign in to create a session token
        const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginResponse.json();

        return res.status(200).json({
            success: true,
            user: loginData.user?.email,
            token: loginData.access_token,
            username: loginData.user?.user_metadata?.display_name || username
        });
    } catch (err) {
        return res.status(500).json({ error: "Server registration error: " + err.message });
    }
}