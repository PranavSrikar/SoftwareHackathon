import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  Phone,
  Send,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Smartphone,
  Radio,
  Check
} from 'lucide-react';

interface AlertChannelConfig {
  id: string;
  channelName: string;
  icon: React.ReactNode;
  provider: string;
  triggerCondition: string;
  recipientMasked: string;
  status: 'Delivered' | 'Sent' | 'Pending';
  description: string;
  accentColor: string;
}

export const AlertsSection: React.FC = () => {
  const [ownerName, setOwnerName] = useState('John Doe');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 019-2834');
  
  // Channel configurations
  const [channels, setChannels] = useState<AlertChannelConfig[]>([
    {
      id: 'ch-1',
      channelName: 'SMS Notification',
      icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
      provider: 'Twilio REST API v2010',
      triggerCondition: 'Battery SoC < 20% or 100% Fully Charged',
      recipientMasked: '+1 (555) ***-2834',
      status: 'Delivered',
      description: 'Instant programmatic text message dispatch over cellular gateway.',
      accentColor: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300'
    },
    {
      id: 'ch-2',
      channelName: 'Phone / Voice Call',
      icon: <Phone className="w-5 h-5 text-blue-400" />,
      provider: 'Twilio TwiML Voice Synthesizer',
      triggerCondition: 'Critical Low Battery (< 14%) / Grid Overload',
      recipientMasked: '+1 (555) ***-2834',
      status: 'Delivered',
      description: 'Automated text-to-speech voice call placed directly to your phone.',
      accentColor: 'border-blue-500/30 bg-blue-950/20 text-blue-300'
    },
    {
      id: 'ch-3',
      channelName: 'WhatsApp Business API',
      icon: <Send className="w-5 h-5 text-emerald-400" />,
      provider: 'Meta Cloud API Direct',
      triggerCondition: 'Charging Session Completed / Port Available',
      recipientMasked: '+1 (555) ***-2834',
      status: 'Delivered',
      description: 'Rich messaging protocol delivered directly via WhatsApp official business template.',
      accentColor: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
    }
  ]);

  // Simulation log state
  const [alertLogs, setAlertLogs] = useState<{
    id: string;
    timestamp: string;
    channel: string;
    title: string;
    message: string;
    status: string;
  }[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'WhatsApp',
      title: 'Session Started',
      message: 'GreenGrid EV Port 3 connected successfully. Vehicle charging at 7.4 kW.',
      status: 'Delivered'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'SMS',
      title: 'Solar Surplus Active',
      message: '100% renewable solar absorption active. Charging speed boosted to max.',
      status: 'Delivered'
    }
  ]);

  const handleTestAlert = (channelType: 'SMS' | 'VOICE' | 'WHATSAPP') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let title = '';
    let message = '';

    if (channelType === 'SMS') {
      title = 'Test SMS Dispatch';
      message = `Hello ${ownerName}, your test SMS from GreenGrid Gateway was successfully delivered to ${phoneNumber}.`;
    } else if (channelType === 'VOICE') {
      title = 'Test Voice Call Outbound';
      message = `[Voice Robot]: "Hello ${ownerName}. This is an audio test call confirming your GreenGrid alert subscription."`;
    } else {
      title = 'Test WhatsApp Template';
      message = `🟢 GreenGrid WhatsApp Test: Hi ${ownerName}, your notification webhooks are fully operational.`;
    }

    setAlertLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        channel: channelType,
        title,
        message,
        status: 'Delivered'
      },
      ...prev
    ]);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 font-mono text-xs">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bell className="w-5 h-5 animate-bounce-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                MULTI-CHANNEL ALERTS & NOTIFICATIONS
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                API GATEWAY ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Real-time vehicle battery threshold alerts delivered through SMS, Phone Calls, and WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTestAlert('SMS')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test SMS Alert</span>
          </button>
        </div>
      </div>

      {/* Grid of Delivery Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((ch) => (
          <div key={ch.id} className={`p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {ch.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{ch.channelName}</h3>
                  <span className="text-[10px] text-slate-400">{ch.provider}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> {ch.status}
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              {ch.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>TRIGGER CONDITION:</span>
                <span className="text-cyan-300 font-bold">{ch.triggerCondition}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>RECIPIENT:</span>
                <span className="text-slate-200">{ch.recipientMasked}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (ch.channelName.includes('SMS')) handleTestAlert('SMS');
                  else if (ch.channelName.includes('Voice')) handleTestAlert('VOICE');
                  else handleTestAlert('WHATSAPP');
                }}
                className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test {ch.channelName.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration & Live Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Col: Recipient Configuration Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              RECIPIENT & GATEWAY SETTINGS
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">OWNER / DRIVER NAME</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">MOBILE NUMBER (GSM / WHATSAPP)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 font-bold">DELIVERY CHANNELS STATUS</span>
              <div className="flex items-center justify-between text-slate-300">
                <span>SMS Gateway (Twilio)</span>
                <span className="text-emerald-400 font-bold">Connected</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Voice Call TwiML</span>
                <span className="text-emerald-400 font-bold">Connected</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>WhatsApp Cloud API</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Live Notification Delivery Log */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                LIVE NOTIFICATION DELIVERY LOG
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Showing recent dispatches</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {alertLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                      {log.channel}
                    </span>
                    <span className="font-bold text-white">{log.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">
                  {log.message}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle className="w-3 h-3" /> Status: {log.status}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
