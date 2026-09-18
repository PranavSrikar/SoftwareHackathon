import type { IncomingMessage, ServerResponse } from 'http';
import { 
  getAllFlats, 
  getFlatByNumber, 
  updateFlatDeparture, 
  updateFlatSession, 
  getFivePortSummary 
} from './flatsData';

export function handleFlatsApi(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url || '';
  if (!url.startsWith('/api/flats')) {
    return next();
  }

  // Parse path
  const parsedUrl = new URL(url, 'http://localhost:3000');
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET /api/flats/ports
  if (pathname === '/api/flats/ports' && req.method === 'GET') {
    const summary = getFivePortSummary(1);
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // GET /api/flats - return all 30 flats
  if (pathname === '/api/flats' || pathname === '/api/flats/') {
    const flats = getAllFlats();
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      count: flats.length,
      data: flats,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // GET /api/flats/:flatNumber
  const singleMatch = pathname.match(/^\/api\/flats\/(\d+)$/);
  if (singleMatch && req.method === 'GET') {
    const flatNum = parseInt(singleMatch[1], 10);
    const flat = getFlatByNumber(flatNum);
    if (!flat) {
      res.statusCode = 404;
      res.end(JSON.stringify({
        success: false,
        message: `Flat ${flatNum} not found. Valid flats are 1 through 30.`,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    const summary = getFivePortSummary(flatNum);
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      flat,
      portSummary: summary,
      message: `Status retrieved for Flat ${flatNum} (${flat.model} - ${flat.vehicleNumber})`,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // POST /api/flats/:flatNumber/session
  const sessionMatch = pathname.match(/^\/api\/flats\/(\d+)\/session$/);
  if (sessionMatch && req.method === 'POST') {
    const flatNum = parseInt(sessionMatch[1], 10);
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const currentSoc = Number(payload.currentSoc ?? 45);
        const targetSoc = Number(payload.targetSoc ?? 85);
        const departureHours = Number(payload.departureHours ?? 2.0);

        const result = updateFlatSession(flatNum, currentSoc, targetSoc, departureHours);
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          flat: result.flat,
          summary: result.summary,
          message: `Flat ${flatNum} charging session updated in dataset. Priority calculated: ${result.flat.priority}.`,
          timestamp: new Date().toISOString()
        }));
      } catch (err: any) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          message: err?.message || 'Invalid session payload.',
          timestamp: new Date().toISOString()
        }));
      }
    });
    return;
  }

  // POST /api/flats/:flatNumber/departure
  const departureMatch = pathname.match(/^\/api\/flats\/(\d+)\/departure$/);
  if (departureMatch && req.method === 'POST') {
    const flatNum = parseInt(departureMatch[1], 10);
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const hoursRemaining = Number(payload.hoursRemaining ?? 1.5);
        const result = updateFlatDeparture(flatNum, hoursRemaining);
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          flat: result.flat,
          speedBoostKw: result.speedBoostKw,
          previousSpeedKw: result.previousSpeedKw,
          summary: result.summary,
          message: result.speedBoostKw > 0
            ? `Earlier departure registered! Charging rate boosted by +${result.speedBoostKw.toFixed(1)} kW to guarantee on-time readiness.`
            : `Departure schedule updated for Flat ${flatNum}.`,
          timestamp: new Date().toISOString()
        }));
      } catch (err: any) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          message: err?.message || 'Invalid departure payload.',
          timestamp: new Date().toISOString()
        }));
      }
    });
    return;
  }

  // Fallback 404 for unknown /api/flats subpath
  res.statusCode = 404;
  res.end(JSON.stringify({
    success: false,
    message: `Endpoint ${pathname} not recognized. Available: GET /api/flats, GET /api/flats/:flatNumber, POST /api/flats/:flatNumber/session, POST /api/flats/:flatNumber/departure`,
    timestamp: new Date().toISOString()
  }));
}
