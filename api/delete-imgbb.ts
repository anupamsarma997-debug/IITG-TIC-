import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyIdTokenFromHeader } from './_utils/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization || '';
    await verifyIdTokenFromHeader(authHeader);

    const { deleteUrl } = req.body;
    if (!deleteUrl || typeof deleteUrl !== 'string') {
      return res.status(400).json({ error: 'Missing deleteUrl in request body.' });
    }

    const resp = await fetch(deleteUrl, { method: 'GET' });
    if (!resp.ok) {
      const text = await resp.text();
      console.warn('ImgBB delete proxy returned non-OK:', resp.status, text);
      return res.status(502).json({ error: 'ImgBB delete failed', status: resp.status, detail: text });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('delete-imgbb error:', err);
    return res.status(401).json({ error: err?.message || 'Unauthorized or delete failed' });
  }
}
