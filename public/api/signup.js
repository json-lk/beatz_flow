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

        // 1. Provision user profile inside Supabase Auth system
        const signUpResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: { 
                'apikey': supabaseKey, 
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                email, 
                password, 
                options: { data: { display_name: username } } 
            })
        });
        
        const signUpData = await signUpResponse.json();
        if (!signUpResponse.ok || signUpData.error) {
            return res.status(signUpResponse.status || 400).json({ error: signUpData.error?.message || "Registration failed." });
        }

        // 2. Exchange credentials for an access token immediately so they stay logged in
        const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: { 
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            return res.status(tokenResponse.status || 400).json({ error: tokenData.error?.message || "Automatic login failed." });
        }

        // 3. Hand back token payload back to front-end browser context
        return res.status(200).json({
            success: true,
            user: tokenData.user?.email,
            token: tokenData.access_token,
            username: tokenData.user?.user_metadata?.display_name || username
        });
    } catch (err) {
        return res.status(500).json({ error: "Server registration error: " + err.message });
    }
}