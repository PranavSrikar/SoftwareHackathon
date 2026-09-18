import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Settings, 
  MessageSquare, 
  Smartphone, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Zap, 
  X,
  Send
} from 'lucide-react';
import { 
  NotificationRecord, 
  NotificationSeverity 
} from '../types';
import { 
  getNotificationLogs, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  triggerNotification,
  isTestModeEnabled,
  setTestModeEnabled
} from '../services/notificationService';

interface NotificationCenterDropdownProps {
  onOpenPreferences: () => void;
  onSelectPort?: (portId: number) => void;
}

export const NotificationCenterDropdown: React.FC<NotificationCenterDropdownProps> = ({
  onOpenPreferences,
  onSelectPort,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<NotificationRecord[]>(() => getNotificationLogs());
  const [testMode, setTestMode] = useState<boolean>(() => isTestModeEnabled());

  const unreadCount = logs.filter((l) => !l.isRead).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    setLogs(getNotificationLogs());
  };

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    setLogs(getNotificationLogs());
  };

  const handleSendTestAlert = () => {
    triggerNotification({
      flatNumber: 3,
      type: 'PORT_AVAILABLE',
      title: 'Charging Port 3 Now Free',
      message: 'Charging Port 3 is now available for Flat 3 (Tata Nexon EV). Click to view station.',
      severity: 'SUCCESS',
      portId: 3,
    });
    setLogs(getNotificationLogs());
  };

  const handleToggleTestMode = () => {
    const next = !testMode;
    setTestMode(next);
    setTestModeEnabled(next);
  };

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950/90 border-rose-500/50 text-rose-300';
      case 'WARNING':
        return 'bg-amber-950/90 border-amber-500/50 text-amber-300';
      case 'SUCCESS':
        return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300';
      case 'INFO':
        return 'bg-sky-950/90 border-sky-500/50 text-sky-300';
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center"
        title="Notification Center (SMS & WhatsApp)"
      >
        <Bell className="w-4 h-4 text-cyan-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl z-50 overflow-hidden font-sans"
          style={{ maxHeight: '85vh' }}
        >
          {/* Panel Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">NOTIFICATIONS</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                {unreadCount} NEW
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPreferences}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all"
                title="Notification Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Test Mode & Mark All Read */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <button
              onClick={handleToggleTestMode}
              className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${
                testMode ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300' : 'bg-amber-950 border-amber-500/50 text-amber-300'
              }`}
            >
              TEST MODE: {testMode ? 'ON (SIMULATED)' : 'OFF (LIVE)'}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No notifications logged yet.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => {
                    handleMarkRead(log.id);
                    if (log.relatedPortId && onSelectPort) {
                      onSelectPort(log.relatedPortId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 transition-all hover:bg-slate-900/80 cursor-pointer flex flex-col gap-1.5 ${
                    log.isRead ? 'opacity-80' : 'bg-slate-900/40 border-l-2 border-l-cyan-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityBadge(log.severity)}`}>
                      {log.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-snug">
                    {log.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      {log.channel === 'SMS' ? <Smartphone className="w-3 h-3 text-sky-400" /> : <MessageSquare className="w-3 h-3 text-emerald-400" />}
                      <span>To: {log.recipientPhoneMasked}</span>
                    </span>
                    <span className="text-cyan-400 font-bold">
                      [{log.status}]
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Footer / Send Test Trigger */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleSendTestAlert}
              className="w-full py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Port Availability Alert</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
