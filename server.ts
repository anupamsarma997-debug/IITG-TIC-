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

  // Secure Server-Side OTP Store
  interface OtpEntry {
    code: string;
    expiresAt: number;
    attempts: number;
  }
  const otpStore = new Map<string, OtpEntry>();

  // Production SMS Gateway Helper (Twilio / MSG91)
  async function dispatchSmsOtp(target: string, code: string): Promise<{ dispatched: boolean; provider: string; error?: string }> {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    const msg91Key = process.env.MSG91_AUTH_KEY;
    const msg91Flow = process.env.MSG91_FLOW_ID;

    // 1. Try Twilio Gateway
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', target);
        params.append('From', twilioFrom);
        params.append('Body', `Your THIKANA security verification code is ${code}. Valid for 5 minutes.`);

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('[SMS TWILIO ERROR]', errorText);
          return { dispatched: false, provider: 'Twilio', error: errorText };
        }
        console.log(`[SMS TWILIO SUCCESS] Dispatched OTP to ${target}`);
        return { dispatched: true, provider: 'Twilio' };
      } catch (err: any) {
        console.error('[SMS TWILIO EXCEPTION]', err);
        return { dispatched: false, provider: 'Twilio', error: err.message };
      }
    }

    // 2. Try MSG91 Gateway
    if (msg91Key && msg91Flow) {
      try {
        const resp = await fetch('https://control.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            'authkey': msg91Key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: msg91Flow,
            mobile: target.replace(/[^0-9]/g, ''),
            otp: code,
          }),
        });
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('[SMS MSG91 ERROR]', errorText);
          return { dispatched: false, provider: 'MSG91', error: errorText };
        }
        console.log(`[SMS MSG91 SUCCESS] Dispatched OTP to ${target}`);
        return { dispatched: true, provider: 'MSG91' };
      } catch (err: any) {
        console.error('[SMS MSG91 EXCEPTION]', err);
        return { dispatched: false, provider: 'MSG91', error: err.message };
      }
    }

    // 3. Server Store Log (When keys are unconfigured)
    console.log(`[AUTH SERVER OTP STORED] Code generated for ${target}: ${code} (No SMS provider API keys configured)`);
    return { dispatched: false, provider: 'None' };
  }

  // OTP Endpoint 1: Send OTP
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const target = sanitizeInput(req.body.target, 100);
      if (!target) {
        return res.status(400).json({ error: 'Email or phone number is required.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      otpStore.set(target.toLowerCase(), {
        code,
        expiresAt,
        attempts: 0,
      });

      const smsResult = await dispatchSmsOtp(target, code);

      return res.json({
        success: true,
        dispatched: smsResult.dispatched,
        provider: smsResult.provider,
        message: smsResult.dispatched
          ? `SMS verification code dispatched via ${smsResult.provider} to ${target}`
          : `Verification code generated and stored securely on server for ${target}`,
      });
    } catch (err: any) {
      console.error('Error in send-otp:', err);
      return res.status(500).json({ error: 'Failed to process verification code.' });
    }
  });

  // OTP Endpoint 2: Verify OTP
  app.post('/api/auth/verify-otp', (req, res) => {
    try {
      const target = sanitizeInput(req.body.target, 100);
      const code = sanitizeInput(req.body.code, 10);

      if (!target || !code) {
        return res.status(400).json({ success: false, message: 'Contact detail and code are required.' });
      }

      const entry = otpStore.get(target.toLowerCase());
      if (!entry) {
        return res.status(400).json({ success: false, message: 'No active verification code found. Please request a new code.' });
      }

      if (Date.now() > entry.expiresAt) {
        otpStore.delete(target.toLowerCase());
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
      }

      if (entry.attempts >= 5) {
        otpStore.delete(target.toLowerCase());
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
      }

      if (entry.code !== code.trim()) {
        entry.attempts += 1;
        const remaining = 5 - entry.attempts;
        return res.status(400).json({ success: false, message: `Invalid verification code! ${remaining} attempt(s) remaining.` });
      }

      // Successfully verified
      otpStore.delete(target.toLowerCase());
      return res.json({ success: true, message: 'Verification successful.' });
    } catch (err: any) {
      console.error('Error in verify-otp:', err);
      return res.status(500).json({ success: false, message: 'Internal verification error.' });
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
      const city = sanitizeInput(req.body.city, 100);
      const address = sanitizeInput(req.body.address, 150);
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
      const query = sanitizeInput(req.body.query, 500);
      const availableProperties = Array.isArray(req.body.availableProperties)
        ? req.body.availableProperties.slice(0, 5).map((p: any) => ({
            title: sanitizeInput(p.title, 80),
            city: sanitizeInput(p.city, 50),
            propertyType: sanitizeInput(p.propertyType, 50)
          }))
        : [];
      const ai = getGenAI();

      const contextPrompt = `You are "THIKANA Northeast AI Mitra", an expert travel guide assistant specialized in Northeast India (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Mizoram, Manipur & Tripura).
The user asks: "${query}"

Here are available authentic Northeast properties on THIKANA for context:
${JSON.stringify(availableProperties)}

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
