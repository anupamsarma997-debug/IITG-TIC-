import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyIdTokenFromHeader } from './_utils/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // verify client is authenticated
    const authHeader = req.headers.authorization || '';
    await verifyIdTokenFromHeader(authHeader);

    const imgbbKey = process.env.IMG_BB_API_KEY || process.env.IMGBB_API_KEY;
    if (!imgbbKey) return res.status(500).json({ error: 'ImgBB API key not configured on server.' });

    const { imageBase64, name } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
    }

    // Strip data URL prefix if present
    const base64 = imageBase64.includes(',') ? imageBase64.split(',').pop() : imageBase64;
    if (!base64) return res.status(400).json({ error: 'Invalid base64 image data.' });

    const params = new URLSearchParams();
    params.append('key', imgbbKey);
    params.append('image', base64);
    if (name) params.append('name', String(name).slice(0, 150));

    const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const json = await imgbbRes.json();
    if (!imgbbRes.ok || !json) {
      return res.status(502).json({ error: 'ImgBB upload failed', detail: json });
    }

    // Return ImgBB data directly to client
    return res.json({ success: true, data: json.data });
  } catch (err: any) {
    console.error('upload-imgbb error:', err);
    return res.status(401).json({ error: err?.message || 'Unauthorized or upload failed' });
  }
}
