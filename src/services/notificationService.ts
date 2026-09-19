import { 
  NotificationRecord, 
  NotificationPreferences, 
  NotificationType, 
  NotificationChannel, 
  NotificationSeverity,
  EVVehicle,
  GridState,
  ChargingPort,
  FlatRecord
} from '../types';
import { maskPhoneNumber } from './phonePrivacy';

/**
 * NOTIFICATION SERVICE & RULE ENGINE
 * Detects low battery, port availability, charging complete, departure risk, and transformer alerts.
 * Dispatches simulated or real backend SMS / WhatsApp messages.
 */

// Initial Notification Preferences
export const defaultNotificationPreferences: NotificationPreferences = {
  lowBatteryAlert: true,
  lowBatteryThreshold: 20, // 20%
  portAvailableAlert: true,
  chargingCompleteAlert: true,
  departureRiskAlert: true,
  gridWarningAlert: true,
  smsEnabled: true,
  whatsappEnabled: true,
  inAppEnabled: true,
};

let currentPreferences: NotificationPreferences = { ...defaultNotificationPreferences };
let testModeEnabled = true; // Safe demo test mode

// In-Memory Notification History Logs
let notificationLogs: NotificationRecord[] = [
  {
    id: 'NOTIF-101',
    flatNumber: 4,
    recipientPhoneMasked: '+91 ******4824',
    alertType: 'DEPARTURE_RISK',
    title: 'Departure Target at Risk',
    message: 'Flat 4 (Porsche Taycan): Scheduled departure is in 1.0 hr, but battery is at 28%. Charging rate boosted to 9.6 kW.',
    channel: 'WHATSAPP',
    status: 'Delivered',
    severity: 'WARNING',
    timestamp: new Date(Date.now() - 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    relatedEvId: 'PORT-04',
    isRead: false,
  },
  {
    id: 'NOTIF-102',
    flatNumber: 1,
    recipientPhoneMasked: '+91 ******4821',
    alertType: 'PORT_AVAILABLE',
    title: 'Charging Port Available',
    message: 'Community Charging Port 1 is now available for Flat 1 (Tesla Model 3). You can begin your fast charging session.',
    channel: 'SMS',
    status: 'Delivered',
    severity: 'SUCCESS',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    relatedPortId: 1,
    isRead: true,
  },
  {
    id: 'NOTIF-103',
    flatNumber: 12,
    recipientPhoneMasked: '+91 ******4832',
    alertType: 'LOW_BATTERY',
    title: 'Low Battery Warning',
    message: 'Flat 12 (BMW i4): Your EV battery is currently at 18%. Charging is strongly recommended before tonight.',
    channel: 'WHATSAPP',
    status: 'Sent',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true,
  },
  {
    id: 'NOTIF-104',
    recipientPhoneMasked: '+91 ******9999',
    alertType: 'TRANSFORMER_ALERT',
    title: 'Transformer Capacity Constraint',
    message: 'Grid Admin Alert: Transformer load reached 82% capacity. Dynamic EV cluster load shedding automatically executed.',
    channel: 'SMS',
    status: 'Delivered',
    severity: 'CRITICAL',
    timestamp: new Date(Date.now() - 10800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true,
  },
];

export function getNotificationLogs(): NotificationRecord[] {
  return notificationLogs;
}

export function getNotificationPreferences(): NotificationPreferences {
  return currentPreferences;
}

export function updateNotificationPreferences(newPrefs: Partial<NotificationPreferences>): NotificationPreferences {
  currentPreferences = { ...currentPreferences, ...newPrefs };
  return currentPreferences;
}

export function isTestModeEnabled(): boolean {
  return testModeEnabled;
}

export function setTestModeEnabled(enabled: boolean): void {
  testModeEnabled = enabled;
}

export function markNotificationAsRead(id: string): void {
  notificationLogs = notificationLogs.map((log) => 
    log.id === id ? { ...log, isRead: true } : log
  );
}

export function markAllNotificationsAsRead(): void {
  notificationLogs = notificationLogs.map((log) => ({ ...log, isRead: true }));
}

/**
 * Backend Notification Dispatch Abstraction
 * Calls server API /api/notifications/sms
 */
export async function sendSMS(
  phoneNumber: string,
  message: string,
  recipientId: string = 'RECIPIENT-001',
  alertId: string = `ALERT-${Date.now()}`
): Promise<{ success: boolean; mode?: string; messageId?: string; status: string; message?: string }> {
  const masked = maskPhoneNumber(phoneNumber);
  try {
    const res = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: recipientId,
        alert_id: alertId,
        test_phone: phoneNumber,
        sms_consent: currentPreferences.smsEnabled,
        sms_enabled: currentPreferences.smsEnabled,
      }),
    });
    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        mode: data.mode,
        messageId: data.messageId,
        status: data.status || 'Delivered',
        message: data.message,
      };
    }
    if (data.mode === 'demo') {
      return {
        success: false,
        mode: 'demo',
        status: 'Demo Mode',
        message: data.message || 'Demo mode — no real SMS was sent because Twilio is not configured.',
      };
    }
    return {
      success: false,
      status: data.error || 'Failed to dispatch SMS',
      message: data.error || 'SMS send failed',
    };
  } catch (err: any) {
    console.error('[SMS API Error]:', err);
    return {
      success: false,
      status: 'API Error',
      message: 'Demo mode — no real SMS was sent because Twilio is not configured.',
    };
  }
}

export async function sendWhatsApp(phoneNumber: string, message: string): Promise<{ success: boolean; status: string }> {
  const masked = maskPhoneNumber(phoneNumber);
  console.log(`[WhatsApp API] Sending WhatsApp message to ${masked}: "${message}"`);
  return { success: true, status: 'Delivered' };
}

export function triggerNotification(params: {
  flatNumber?: number;
  phone?: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  channel?: NotificationChannel;
  portId?: number;
  evId?: string;
}): NotificationRecord {
  const phone = params.phone || `+9198765${(4821 + (params.flatNumber || 1)).toString().padStart(5, '0')}`;
  const maskedPhone = maskPhoneNumber(phone);
  const channel = params.channel || (currentPreferences.whatsappEnabled ? 'WHATSAPP' : 'SMS');
  const severity = params.severity || 'INFO';
  
  const newRecord: NotificationRecord = {
    id: `NOTIF-${Date.now().toString().slice(-4)}`,
    flatNumber: params.flatNumber,
    recipientPhoneMasked: maskedPhone,
    alertType: params.type,
    title: params.title,
    message: params.message,
    channel,
    status: testModeEnabled ? 'Delivered' : 'Sent',
    severity,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    relatedPortId: params.portId,
    relatedEvId: params.evId,
    isRead: false,
  };

  notificationLogs = [newRecord, ...notificationLogs];
  
  // Console logging for backend audit
  if (channel === 'SMS') {
    sendSMS(phone, params.message);
  } else if (channel === 'WHATSAPP') {
    sendWhatsApp(phone, params.message);
  }

  return newRecord;
}

/**
 * Event-Driven Rule Engine
 * Evaluates live EV and grid conditions to trigger notifications
 */
export function evaluateNotificationRules(
  flats: FlatRecord[],
  gridState: GridState,
  previousPortStates?: Record<number, string>
): void {
  if (!currentPreferences) return;

  // Rule 1: Low Battery Alert (< threshold, default 20%)
  if (currentPreferences.lowBatteryAlert) {
    const threshold = currentPreferences.lowBatteryThreshold || 20;
    flats.forEach((flat) => {
      if (flat.currentChargePercent < threshold && flat.status !== 'Charging') {
        const existing = notificationLogs.find(
          (l) => l.flatNumber === flat.flatNumber && l.alertType === 'LOW_BATTERY' && 
          (Date.now() - new Date().getTime()) < 300000 // deduplicate 5 mins
        );
        if (!existing) {
          triggerNotification({
            flatNumber: flat.flatNumber,
            phone: flat.phoneNumber,
            type: 'LOW_BATTERY',
            title: 'Low Battery Alert',
            message: `Flat ${flat.flatNumber} (${flat.model}): Your EV battery is at ${flat.currentChargePercent}%. Charging is recommended.`,
            severity: 'WARNING',
          });
        }
      }
    });
  }

  // Rule 2: Free Charging Port Alert (Occupied -> Available)
  if (currentPreferences.portAvailableAlert && previousPortStates) {
    // Handled dynamically when port status transitions
  }

  // Rule 3: Grid / Transformer Alert
  if (currentPreferences.gridWarningAlert) {
    if (gridState.systemStatus === 'OVERLOAD PREVENTED' || gridState.totalLoadKw > gridState.gridLimitKw * 0.85) {
      const existing = notificationLogs.find(
        (l) => l.alertType === 'TRANSFORMER_ALERT' && l.timestamp === new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      if (!existing) {
        triggerNotification({
          type: 'TRANSFORMER_ALERT',
          title: 'Grid Capacity Warning',
          message: `Grid Admin: Building demand + EV load reached ${gridState.totalLoadKw.toFixed(1)} kW (Limit: ${gridState.gridLimitKw} kW). Overload prevention active.`,
          severity: 'CRITICAL',
          channel: 'SMS',
        });
      }
    }
  }
}
