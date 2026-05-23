// api/tracks.js
export default async function handler(req, res) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        const { search } = req.query;

        let queryUrl = `${supabaseUrl}/rest/v1/tracks?select=*&order=created_at.desc`;
        if (search) {
            queryUrl += `&or=(title.ilike.%${encodeURIComponent(search)}%,artist.ilike.%${encodeURIComponent(search)}%)`;
        }

        const response = await fetch(queryUrl, {
            headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey }
        });
        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}