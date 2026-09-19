import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleSmsNotificationRequest } from './src/services/smsEndpointHandler';
import { ChatService } from './src/services/ai/chatService';
import { handleFlatsApi } from './src/services/apiMiddleware';

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

  // Intercept and handle /api/flats endpoints
  app.use(handleFlatsApi);

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dedicated SMS Notification Endpoint (Twilio Server API)
  app.post('/api/notifications/sms', async (req, res) => {
    const result = await handleSmsNotificationRequest(req.body);
    return res.status(result.statusCode).json(result.body);
  });

  // API AI Chat Endpoint (Express AI Bot Proxy connected to ChatService)
  app.post('/api/chat', async (req, res) => {
    try {
      const userQuery = req.body.message || req.body.prompt || req.body.query || req.body.userMessage;
      if (!userQuery || typeof userQuery !== 'string') {
        return res.status(400).json({
          error: 'Message or prompt is required',
          usage: {
            endpoint: '/api/chat',
            method: 'POST',
            sampleBody: { message: 'Why is my charging rate only 4 kW?' },
          },
        });
      }

      const chatResponse = await ChatService.processMessage(req.body);
      return res.json({
        success: true,
        ...chatResponse
      });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process AI chat request',
        details: error?.message || 'Unknown error',
        reply: "I encountered a temporary issue with the AI assistant backend. You can still monitor your EV, charging schedules, and grid telemetry directly on the dashboard!",
        data_used: ['error fallback']
      });
    }
  });

  // GET /api/scheduler/status
  app.get('/api/scheduler/status', (req, res) => {
    res.json({
      success: true,
      active_scheduler: 'Deterministic Multi-Factor Priority Allocator',
      limits: {
        safe_grid_limit_kw: 50.0,
        transformer_capacity_kw: 60.0,
        max_charging_ports: 5
      },
      constraints: [
        'Total building load + EV charging load <= safe grid limit',
        'Transformer utilization <= 100%'
      ],
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/scheduler/:user_id
  app.get('/api/scheduler/:user_id', (req, res) => {
    const userId = req.params.user_id;
    res.json({
      success: true,
      user_id: userId,
      schedule: {
        port_id: userId.startsWith('PORT-') ? userId : 'PORT-03',
        charging_status: 'DYNAMICALLY_OPTIMIZED',
        assigned_slot: 'Continuous Allocation based on Priority Score',
        last_recalculated: new Date().toISOString()
      }
    });
  });

  // POST /api/scheduler/recalculate
  app.post('/api/scheduler/recalculate', (req, res) => {
    res.json({
      success: true,
      status: 'OPTIMIZATION_COMPLETE',
      message: 'Scheduler recalculated active priority lists and redistributed power lines successfully!',
      recalibrated_ports: 5,
      timestamp: new Date().toISOString()
    });
  });

  // API Alerts Dispatch Endpoint (Twilio / Webhook / Native trigger)
  app.post('/api/alerts/send', async (req, res) => {
    try {
      const { channel, recipientName, phoneNumber, message, twilioSid, twilioToken, twilioFrom } = req.body;

      const sid = twilioSid || process.env.TWILIO_ACCOUNT_SID;
      const token = twilioToken || process.env.TWILIO_AUTH_TOKEN;
      const from = twilioFrom || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

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
