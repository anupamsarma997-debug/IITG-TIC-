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

  // AI Helper 1: Generate Listing Description
  app.post('/api/ai/generate-description', async (req, res) => {
    try {
      const { propertyName, propertyType, city, keyFeatures, amenities } = req.body;
      const ai = getGenAI();

      const prompt = `You are a professional travel copywriter for "THIKANA Northeast" - a Zero Commission Homestay & Eco Lodge Marketplace in Northeast India (Seven Sisters & Sikkim).
Write an engaging, inviting, and detailed property description (150-250 words) for:
Property Name: ${propertyName || 'Homestay'}
Type: ${propertyType || 'Homestay'}
City/Location: ${city || 'Northeast India'}
Key Features: ${keyFeatures || 'Cozy bamboo architecture, local ethnic cuisine, mountain/tea garden view, warm tribal hospitality'}
Amenities: ${Array.isArray(amenities) ? amenities.join(', ') : 'WiFi, Hot water, Home cooked local meals'}

Highlight traditional Northeast hospitality (such as Chang Ghar stilt structures, local organic tea, wood heaters/fireplaces, or ethnic thalis) and emphasize that travelers connect directly with the local host via WhatsApp with ZERO middleman commission!`;

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
      const { city, address } = req.body;
      const ai = getGenAI();

      const prompt = `List 4 popular nearby tourist attractions, waterfalls, national parks, tea gardens, or monasteries near "${address}, ${city}" in Northeast India.
Return ONLY a raw JSON array of 4 strings, for example: ["Kaziranga Safari Gate (2 km)", "Orchid & Biodiversity Park (1.5 km)", "Kakochang Waterfall (14 km)", "Brahmaputra Sunset Viewpoint (8 km)"]`;

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
      const { query, availableProperties } = req.body;
      const ai = getGenAI();

      const contextPrompt = `You are "THIKANA Northeast AI Mitra", an expert travel guide assistant specialized in Northeast India (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Mizoram, Manipur & Tripura).
The user asks: "${query}"

Here are available authentic Northeast properties on THIKANA for context:
${JSON.stringify(availableProperties || [])}

Provide a helpful, polite, and personalized 2-3 paragraph answer recommending suitable places, homestays, or local travel tips (such as best seasons, local tribal thalis, permits for Tawang/Nathula, or safari tips). Mention that travelers can click "Chat on WhatsApp" to talk directly with local hosts with zero commission!`;

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
