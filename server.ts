import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS middleware for website integration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Initialize Gemini Client lazily to prevent startup crashes if key is missing or invalid
  const getGeminiClient = () => {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    // Clean potential quotes or trailing whitespace
    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    if (!apiKey) {
      return null;
    }
    try {
      return new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  };

  // Voltra Domain Knowledge Base for system instructions
  const VOLTRA_SYSTEM_INSTRUCTION = `
You are Voltra AI Assistant, a smart, friendly, and expert guide embedded in the Voltra Smart EV Charging Portal.
Your primary role is to:
1. Help users navigate and use the Voltra website.
2. Explain terms, definitions, parameters, and algorithms used in the Voltra EV charging platform.
3. Answer any questions about EV charging, grid load management, fair queueing, solar energy, priority scores, and resident flat management.

Key Website Features & Navigation:
- **Citizen / Resident Portal**: Allows residents (Flats 1-30) to look up their assigned flat, view current battery SoC %, set target battery goal %, set departure time, plug/unplug cable, and calculate fair priority score.
- **5-Port Multi-Factor Queue System**: Voltra manages 5 physical high-speed charging ports for 30 resident flats with guaranteed wait times <= 1 hour.
- **Priority Scores**:
  - P1 High Emergency / Critical (<20% SoC or departure within 1-2 hours)
  - P2 Medium Priority (20-60% SoC)
  - P3 Low Priority (>60% SoC or late departure)
- **Grid Load & Solar Optimization**: Real-time telemetry monitoring building demand (kW), solar generation (kW), and grid limit (kW) to prevent transformer overloads.
- **Live Map & Resident Database**: Visual map of charging hubs and administrative database for managing flat details.

Glossary & Terms:
- **SoC (State of Charge)**: Current battery charge percentage (0% = empty, 100% = full).
- **Priority Score (0-100)**: Calculated score based on formula combining battery deficit, departure urgency, solar surplus, and queue wait time.
- **Grid Limit (kW)**: Maximum safe power capacity drawn from the electrical grid before triggering overload protection.
- **Peak / Off-Peak Hours**: High electricity tariff demand hours vs low-cost night charging windows.
- **Solar Surplus (kW)**: Excess solar power generated on-site that can be directed to EVs free of grid cost.
- **5-Port Fair Queue**: System that dynamically rotates EV charging sessions to guarantee wait times <= 1 hour for all residents.

Instructions for your responses:
- Keep answers clear, well-formatted, and helpful.
- Use markdown formatting, bullet points, and bold text for readability.
- Be concise yet thorough when explaining terms.
- Offer actionable next steps on the Voltra portal when appropriate.
`;

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API AI Chat Endpoint (Express AI Bot Proxy)
  app.post('/api/chat', async (req, res) => {
    try {
      // Support flexible input field names from different website integration types
      const userQuery = req.body.message || req.body.prompt || req.body.query || req.body.userMessage;
      const history = req.body.history || [];

      if (!userQuery || typeof userQuery !== 'string') {
        return res.status(400).json({
          error: 'Message or prompt is required',
          usage: {
            endpoint: '/api/chat',
            method: 'POST',
            sampleBody: { message: 'How does the priority score work?' },
          },
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const fallbackReply = `Hello! I am **Voltra AI Assistant** (offline mode).\n\nHere is a quick overview of terms:\n- **SoC (State of Charge)**: Current battery percentage.\n- **Priority Score**: Higher score given to low battery & urgent departure.\n- **5-Port Queue**: Rotates charging across 5 ports for 30 flats.\n\n*To enable real-time Gemini AI answers, please configure GEMINI_API_KEY in Secrets.*`;
        return res.json({
          success: true,
          reply: fallbackReply,
          response: fallbackReply,
          text: fallbackReply,
          mode: 'offline_knowledge_base',
        });
      }

      // Build context from conversation history
      const formattedHistory = Array.isArray(history) && history.length > 0
        ? history.slice(-6).map((h: { role: string; text?: string; message?: string }) => {
            const textContent = h.text || h.message || '';
            return `${h.role === 'user' ? 'User' : 'Assistant'}: ${textContent}`;
          }).join('\n')
        : '';

      const fullPrompt = formattedHistory
        ? `${formattedHistory}\nUser: ${userQuery}\nAssistant:`
        : userQuery;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: VOLTRA_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const reply = response.text || "I'm sorry, I couldn't generate a response. Please ask again!";
      return res.json({
        success: true,
        reply,
        response: reply,
        text: reply,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      const errReply = "I encountered a temporary issue with the AI backend. Feel free to ask about **SoC**, **Priority Scores**, **5-Port Queueing**, or **Flat Lookup**!";
      res.status(500).json({
        success: false,
        error: 'Failed to process AI chat request',
        details: error?.message || 'Unknown error',
        reply: errReply,
        response: errReply,
        text: errReply,
      });
    }
  });

  // API Alerts Dispatch Endpoint (Twilio / Webhook / Native trigger)
  app.post('/api/alerts/send', async (req, res) => {
    try {
      const { channel, recipientName, phoneNumber, message, twilioSid, twilioToken, twilioFrom } = req.body;

      const sid = twilioSid || process.env.TWILIO_ACCOUNT_SID;
      const token = twilioToken || process.env.TWILIO_AUTH_TOKEN;
      const from = twilioFrom || process.env.TWILIO_PHONE_NUMBER;

      // If Twilio credentials are provided, attempt real REST API dispatch
      if (sid && token && from) {
        const cleanPhone = phoneNumber.replace(/[^+\d]/g, '');
        const auth = Buffer.from(`${sid}:${token}`).toString('base64');

        if (channel === 'SMS') {
          const body = new URLSearchParams({
            To: cleanPhone,
            From: from,
            Body: message,
          });

          const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
          });

          const twilioData: any = await twilioRes.json();
          if (!twilioRes.ok) {
            return res.status(400).json({
              success: false,
              mode: 'twilio_error',
              error: twilioData.message || 'Twilio SMS dispatch failed',
            });
          }

          return res.json({
            success: true,
            mode: 'twilio_sms',
            sid: twilioData.sid,
            status: 'Delivered via Twilio Live Gateway',
          });
        }
      }

      // Default safe response instructing frontend to trigger Web Speech / Device Protocol
      return res.json({
        success: true,
        mode: 'browser_native_dispatch',
        status: 'Delivered (In-Browser TTS & Native Device Protocol Ready)',
        recipientName,
        phoneNumber,
        message,
      });
    } catch (err: any) {
      console.error('Error in /api/alerts/send:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Server error during alert dispatch',
      });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
