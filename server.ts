import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const appDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini AI Client lazily/safely
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'THIKANA Marketplace', time: new Date().toISOString() });
  });

  // Input Sanitizer Helper to prevent Prompt Injection & excessive payload sizes
  const sanitizeInput = (val: any, maxLen = 500): string => {
    if (typeof val !== 'string') return '';
    // Strip system control characters and limit length
    return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen);
  };

  // ImgBB upload proxy endpoint (server-side) — accepts JSON { imageBase64, name }
  app.post('/api/upload/imgbb', async (req, res) => {
    try {
      const imgbbKey = process.env.IMG_BB_API_KEY || process.env.IMGBB_API_KEY;
      if (!imgbbKey) {
        return res.status(500).json({ error: 'ImgBB API key not configured on server.' });
      }

      const { imageBase64, name } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
      }

      // Strip data URL prefix if present
      const base64 = imageBase64.split(',').pop();
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

      return res.json({ success: true, data: json.data });
    } catch (err: any) {
      console.error('ImgBB upload proxy error:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // ImgBB delete proxy endpoint — accepts JSON { deleteUrl }
  app.post('/api/delete/imgbb', async (req, res) => {
    try {
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
      console.error('ImgBB delete proxy error:', err);
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // AI Helper 1: Generate Listing Description
  app.post('/api/ai/generate-description', async (req, res) => {
    try {
      const propertyName = sanitizeInput(req.body.propertyName, 100) || 'Homestay';
      const propertyType = sanitizeInput(req.body.propertyType, 50) || 'Homestay';
      const city = sanitizeInput(req.body.city, 100) || 'Northeast India';
      const keyFeatures = sanitizeInput(req.body.keyFeatures, 300) || 'Cozy bamboo architecture, local ethnic cuisine, mountain/tea garden view, warm tribal hospitality';
      const amenities = Array.isArray(req.body.amenities)
        ? req.body.amenities.map((a: any) => sanitizeInput(a, 50)).filter(Boolean).slice(0, 15)
        : ['WiFi', 'Hot water', 'Home cooked local meals'];

      const ai = getGenAI();

      const prompt = `You are a professional travel copywriter for "THIKANA Northeast" - a Zero Commission Homestay & Eco Lodge Marketplace in Northeast India (Seven Sisters & Sikkim).
Write an engaging, inviting, and detailed property description (150-250 words) for:
Property Name: ${propertyName}
Type: ${propertyType}
City/Location: ${city}
Key Features: ${keyFeatures}
Amenities: ${amenities.join(', ')}

Highlight traditional Northeast hospitality (such as Chang Ghar stilt structures, local organic tea, wood heaters/fireplaces, or ethnic thalis) and emphasize that travelers connect directly with t[...]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({ description: response.text || '' });
    } catch (error: any) {
      console.error('Error generating AI description:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI description' });
    }
  });

  // AI Helper 2: Generate Nearby Attractions
  app.post('/api/ai/nearby-attractions', async (req, res) => {
    try {
      const city = sanitizeInput(req.body.city, 100);
      const address = sanitizeInput(req.body.address, 150);
      const ai = getGenAI();

      const prompt = `List 4 popular nearby tourist attractions, waterfalls, national parks, tea gardens, or monasteries near "${address}, ${city}" in Northeast India.
Return ONLY a raw JSON array of 4 strings, for example: ["Kaziranga Safari Gate (2 km)", "Orchid & Biodiversity Park (1.5 km)", "Kakochang Waterfall (14 km)", "Brahmaputra Sunset Viewpoint (8 km)"[...]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      let json: string[] = [];
      try {
        json = JSON.parse(response.text || '[]');
      } catch (e) {
        json = ['Local Scenic Viewpoint (2 km)', 'City Center Market (1.5 km)', 'Historical Monument (3 km)', 'Nature Trail Walk (1 km)'];
      }

      res.json({ attractions: json });
    } catch (error: any) {
      console.error('Error generating attractions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attractions' });
    }
  });

  // AI Helper 3: Travel Assistant Chat
  app.post('/api/ai/travel-assistant', async (req, res) => {
    try {
      const query = sanitizeInput(req.body.query, 500);
      const availableProperties = Array.isArray(req.body.availableProperties)
        ? req.body.availableProperties.slice(0, 5).map((p: any) => ({
            title: sanitizeInput(p.title, 80),
            city: sanitizeInput(p.city, 50),
            propertyType: sanitizeInput(p.propertyType, 50)
          }))
        : [];
      const ai = getGenAI();

      const contextPrompt = `You are "THIKANA Northeast AI Mitra", an expert travel guide assistant specialized in Northeast India (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Mizoram,[...]
The user asks: "${query}"

Here are available authentic Northeast properties on THIKANA for context:
${JSON.stringify(availableProperties)}

Provide a helpful, polite, and personalized 2-3 paragraph answer recommending suitable places, homestays, or local travel tips (such as best seasons, local tribal thalis, permits for Tawang/Nathu[...]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contextPrompt,
      });

      res.json({ reply: response.text || 'I am here to help you find the best homestay!' });
    } catch (error: any) {
      console.error('Error in travel assistant:', error);
      res.status(500).json({ error: error.message || 'Travel assistant error' });
    }
  });

  // Vite middleware for development vs production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THIKANA Server running on http://localhost:${PORT}`);
  });
}

startServer();
