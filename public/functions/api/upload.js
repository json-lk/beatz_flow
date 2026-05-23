// api/upload.js
export const config = { api: { bodyParser: { sizeLimit: '15mb' } } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { title, artist, fileData, fileName, fileType } = req.body;
        if (!fileData || !title || !artist) {
            return res.status(400).json({ error: "Missing required upload parameters." });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        // Clean paths to prevent collision bugs
        const uniqueFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const rawBuffer = Buffer.from(fileData, 'base64');

        // 1. Post Binary file payload to Supabase Object Storage
        const storageUrl = `${supabaseUrl}/storage/v1/object/music-files/${uniqueFileName}`;
        const storageRes = await fetch(storageUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': fileType || 'audio/mpeg'
            },
            body: rawBuffer
        });

        if (!storageRes.ok) {
            const errLog = await storageRes.json().catch(() => ({}));
            return res.status(400).json({ error: errLog.message || "Failed posting binary object to storage." });
        }

        // 2. Generate accessible streaming link
        const publicAudioUrl = `${supabaseUrl}/storage/v1/object/public/music-files/${uniqueFileName}`;

        // 3. Document audio payload row entry inside relational database
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ title, artist, audio_url: publicAudioUrl, filename: uniqueFileName })
        });

        const dbData = await dbRes.json();
        return res.status(201).json({ success: true, track: dbData[0] });
    } catch (err) {
        return res.status(500).json({ error: "Internal transmission block error: " + err.message });
    }
}