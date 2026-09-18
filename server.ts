import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client lazily to prevent startup crashes if key is missing
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
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

  // API AI Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          reply: `Hello! I am **Voltra AI Assistant** (offline mode).\n\nHere is a quick overview of terms:\n- **SoC (State of Charge)**: Current battery percentage.\n- **Priority Score**: Higher score given to low battery & urgent departure.\n- **5-Port Queue**: Rotates charging across 5 ports for 30 flats.\n\n*To enable real-time Gemini AI answers, please configure GEMINI_API_KEY in Secrets.*`,
        });
      }

      // Build context from conversation history
      const formattedHistory = Array.isArray(history) && history.length > 0
        ? history.slice(-6).map((h: { role: string; text: string }) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
        : '';

      const fullPrompt = formattedHistory
        ? `${formattedHistory}\nUser: ${message}\nAssistant:`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: VOLTRA_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const reply = response.text || "I'm sorry, I couldn't generate a response. Please ask again!";
      res.json({ reply });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({
        error: 'Failed to process AI chat request',
        details: error?.message || 'Unknown error',
        reply: "I encountered a temporary issue with the AI backend. Feel free to ask about **SoC**, **Priority Scores**, **5-Port Queueing**, or **Flat Lookup**!",
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
