import { maskPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from './phonePrivacy';

// In-memory set to prevent duplicate SMS sends for the same (recipient_id + alert_id)
const sentAlertsSet = new Set<string>();

// Mock/Default lookup for resident phone numbers by recipient_id
const RESIDENT_PHONE_MAP: Record<string, string> = {
  'FLAT-1': '+919876504822',
  'FLAT-2': '+919876504823',
  'FLAT-3': '+919876504824',
  'FLAT-4': '+919876504825',
  'FLAT-5': '+919876504826',
  'RECIPIENT-001': '+15550192834',
};

export async function handleSmsNotificationRequest(reqBody: any) {
  try {
    const {
      recipient_id,
      alert_id,
      vehicle_id = 'EV-04',
      departure_time = '07:00 AM',
      test_phone,
      sms_consent = true,
      sms_enabled = true,
    } = reqBody || {};

    // 1. Validation of required identifiers
    if (!recipient_id || !alert_id) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Missing required parameters: recipient_id and alert_id are required.',
        },
      };
    }

    // 2. Prevent duplicate sends for the same recipient and alert
    const duplicateKey = `${recipient_id}:${alert_id}`;
    if (sentAlertsSet.has(duplicateKey)) {
      return {
        statusCode: 409,
        body: {
          success: false,
          duplicate: true,
          status: 'Duplicate - SMS alert has already been sent to this recipient for this alert.',
          recipient_id,
          alert_id,
        },
      };
    }

    // 3. Consent and SMS enabled checks
    if (sms_consent === false) {
      return {
        statusCode: 403,
        body: {
          success: false,
          error: 'SMS notification blocked: Recipient has not granted SMS consent.',
        },
      };
    }

    if (sms_enabled === false) {
      return {
        statusCode: 403,
        body: {
          success: false,
          error: 'SMS notification blocked: SMS delivery channel is currently disabled.',
        },
      };
    }

    // 4. Resolve phone number server-side
    let rawPhone = test_phone || RESIDENT_PHONE_MAP[recipient_id.toUpperCase()] || RESIDENT_PHONE_MAP[recipient_id] || test_phone;

    if (!rawPhone) {
      // Fallback default test number format if not in lookup map
      const flatNumMatch = String(recipient_id).match(/\d+/);
      const flatNum = flatNumMatch ? parseInt(flatNumMatch[0], 10) : 1;
      rawPhone = `+9198765${(4821 + flatNum).toString().padStart(5, '0')}`;
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);

    // E.164 phone format validation: ^\+[1-9]\d{1,14}$
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(normalizedPhone)) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Invalid phone format. Recipient phone number must be in E.164 format (e.g. +1234567890).',
        },
      };
    }

    // 5. Construct required message format
    const messageText = `GridMind alert: EV charging capacity is currently constrained. Vehicle ${vehicle_id} may not reach its target before ${departure_time}. Please check the dashboard.`;

    // 6. Check Twilio Server Credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim().replace(/^["']|["']$/g, '');
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim().replace(/^["']|["']$/g, '');
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim().replace(/^["']|["']$/g, '') || process.env.TWILIO_PHONE_NUMBER?.trim().replace(/^["']|["']$/g, '');

    const maskedPhone = maskPhoneNumber(normalizedPhone);

    // Validate if the credentials look like real Twilio SID and Token or if they are placeholders/missing
    const isPlaceholder = (val?: string) => {
      if (!val) return true;
      const lower = val.toLowerCase();
      return (
        lower.includes('placeholder') ||
        lower.includes('your_') ||
        lower.includes('my_') ||
        lower === 'twilio_account_sid' ||
        lower === 'twilio_auth_token' ||
        lower === 'twilio_from_number' ||
        lower === 'twilio_phone_number'
      );
    };

    const hasSid = accountSid && !isPlaceholder(accountSid);
    const hasToken = authToken && !isPlaceholder(authToken);
    const hasFrom = fromNumber && !isPlaceholder(fromNumber);

    // Standard Twilio SIDs start with "AC" and are 34 chars long.
    const isSidWellFormed = hasSid && /^AC[0-9a-fA-F]{32}$/.test(accountSid);
    const isTokenWellFormed = hasToken && /^[0-9a-fA-F]{32}$/.test(authToken);

    if (!hasSid || !hasToken || !hasFrom) {
      return {
        statusCode: 200,
        body: {
          success: false,
          mode: 'demo',
          status: 'Demo mode',
          message: 'Demo mode — no real SMS was sent because Twilio environment variables are unconfigured or empty.',
          maskedPhone,
          messagePreview: messageText,
          recipient_id,
          alert_id,
        },
      };
    }

    if (!isSidWellFormed || !isTokenWellFormed) {
      return {
        statusCode: 200,
        body: {
          success: false,
          mode: 'demo',
          status: 'Demo mode',
          message: `Demo mode — Twilio credentials appear to be invalid or placeholder formats (SID should start with 'AC' followed by 32 characters, and Token should be a 32-character hex string).`,
          maskedPhone,
          messagePreview: messageText,
          recipient_id,
          alert_id,
        },
      };
    }

    // 7. Send real SMS using Twilio REST API
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({
      To: normalizedPhone,
      From: fromNumber,
      Body: messageText,
    });

    const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const twilioData: any = await twilioRes.json();

    if (!twilioRes.ok) {
      const twilioErrorMsg = twilioData?.message || 'Twilio SMS dispatch failed';
      console.error('[Twilio SMS Error]:', twilioErrorMsg);
      return {
        statusCode: 400,
        body: {
          success: false,
          error: twilioErrorMsg,
          mode: 'twilio_error',
        },
      };
    }

    // Mark as sent in duplicate prevention tracker
    sentAlertsSet.add(duplicateKey);

    return {
      statusCode: 200,
      body: {
        success: true,
        mode: 'twilio_live',
        messageId: twilioData.sid,
        status: twilioData.status || 'sent',
        maskedPhone,
        message: messageText,
        recipient_id,
        alert_id,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error('[SMS Handler Exception]:', err?.message || err);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'Internal server error while processing SMS notification.',
      },
    };
  }
}

// Reset function for testing purposes
export function clearSentAlertsCache() {
  sentAlertsSet.clear();
}
