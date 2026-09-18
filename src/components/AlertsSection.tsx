import React, { useState, useRef } from 'react';
import {
  Bell,
  MessageSquare,
  Phone,
  Send,
  Shield,
  CheckCircle,
  RefreshCw,
  Smartphone,
  Check,
  PhoneCall,
  PhoneOff,
  Volume2,
  ExternalLink,
  Key,
  Sliders,
  Radio,
  Zap,
} from 'lucide-react';

interface AlertChannelConfig {
  id: string;
  channelName: string;
  icon: React.ReactNode;
  provider: string;
  triggerCondition: string;
  description: string;
  accentColor: string;
}

export const AlertsSection: React.FC = () => {
  const [ownerName, setOwnerName] = useState('John Doe');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 019-2834');

  // Twilio Gateway credentials state
  const [showTwilioConfig, setShowTwilioConfig] = useState(false);
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');

  // Call / Alert Modal State
  const [callModal, setCallModal] = useState<{
    isOpen: boolean;
    channel: 'SMS' | 'VOICE' | 'WHATSAPP';
    title: string;
    message: string;
    status: 'ringing' | 'connected' | 'ended';
  }>({
    isOpen: false,
    channel: 'VOICE',
    title: '',
    message: '',
    status: 'ringing',
  });

  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper function to mask phone number
  const getMaskedPhone = (phone: string) => {
    if (!phone) return '+1 (555) ***-****';
    const digits = phone.replace(/[^\d+]/g, '');
    if (digits.length < 6) return phone;
    return `${digits.slice(0, 6)}***${digits.slice(-4)}`;
  };

  // Channels
  const channels: AlertChannelConfig[] = [
    {
      id: 'ch-1',
      channelName: 'SMS Notification',
      icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
      provider: twilioSid ? 'Twilio REST API (Live Keys)' : 'Native SMS / Browser Dispatch',
      triggerCondition: 'Battery SoC < 20% or 100% Fully Charged',
      description: 'Programmatic text message dispatch to cellular numbers or native device launcher.',
      accentColor: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
    },
    {
      id: 'ch-2',
      channelName: 'Phone / Voice Call',
      icon: <Phone className="w-5 h-5 text-blue-400" />,
      provider: 'Web Speech TTS Synthesizer & Tel Protocol',
      triggerCondition: 'Critical Low Battery (< 14%) / Grid Overload',
      description: 'Automated voice call popup with live text-to-speech voice alert or direct phone dialing.',
      accentColor: 'border-blue-500/30 bg-blue-950/20 text-blue-300',
    },
    {
      id: 'ch-3',
      channelName: 'WhatsApp Business API',
      icon: <Send className="w-5 h-5 text-emerald-400" />,
      provider: 'Meta Cloud / WhatsApp Direct Webhook',
      triggerCondition: 'Charging Session Completed / Port Available',
      description: 'Rich messaging protocol delivered directly via WhatsApp web/app link.',
      accentColor: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
    },
  ];

  // Simulation log state
  const [alertLogs, setAlertLogs] = useState<{
    id: string;
    timestamp: string;
    channel: string;
    title: string;
    message: string;
    recipient: string;
    status: string;
  }[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'WhatsApp',
      title: 'Session Started',
      message: 'GreenGrid EV Port 3 connected successfully. Vehicle charging at 7.4 kW.',
      recipient: ownerName,
      status: 'Delivered',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'SMS',
      title: 'Solar Surplus Active',
      message: '100% renewable solar absorption active. Charging speed boosted to max.',
      recipient: ownerName,
      status: 'Delivered',
    },
  ]);

  // Audio tone generator for incoming call ringing
  const startRingtone = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440; // US Phone Ringtone frequencies
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      // Pulsing ring cycle
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch (e) {}
      }, 2000);
    } catch (e) {
      console.log('Audio ringtone failed:', e);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTestAlert = async (channelType: 'SMS' | 'VOICE' | 'WHATSAPP') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let title = '';
    let message = '';

    if (channelType === 'SMS') {
      title = 'Low Battery Alert SMS';
      message = `Hello ${ownerName}, Voltra alert for ${getMaskedPhone(phoneNumber)}: Your EV battery is below 20%. Please plug into Port 1-5.`;
    } else if (channelType === 'VOICE') {
      title = 'Urgent Voice Alert Call';
      message = `Hello ${ownerName}. This is an automated voice call from the Voltra Smart Charging Command Center. Your EV charging session at Port 3 is complete and ready for departure.`;
    } else {
      title = 'WhatsApp Port Available';
      message = `🟢 Voltra WhatsApp: Hi ${ownerName}, Charging Port 2 is now free for your vehicle (${phoneNumber}).`;
    }

    // Trigger API call
    try {
      await fetch('/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelType,
          recipientName: ownerName,
          phoneNumber,
          message,
          twilioSid,
          twilioToken,
          twilioFrom,
        }),
      });
    } catch (e) {
      console.log('API dispatch note:', e);
    }

    // Append to live logs
    setAlertLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        channel: channelType,
        title,
        message,
        recipient: `${ownerName} (${phoneNumber})`,
        status: twilioSid ? 'Sent via Twilio API' : 'Dispatched',
      },
      ...prev,
    ]);

    // Open call / notification popup window for VOICE or interactive handling
    if (channelType === 'VOICE') {
      setCallModal({
        isOpen: true,
        channel: 'VOICE',
        title,
        message,
        status: 'ringing',
      });
      startRingtone();
    } else if (channelType === 'SMS') {
      setCallModal({
        isOpen: true,
        channel: 'SMS',
        title,
        message,
        status: 'connected',
      });
    } else if (channelType === 'WHATSAPP') {
      setCallModal({
        isOpen: true,
        channel: 'WHATSAPP',
        title,
        message,
        status: 'connected',
      });
    }
  };

  const handleAnswerCall = () => {
    setCallModal((prev) => ({ ...prev, status: 'connected' }));
    speakText(callModal.message);
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallModal((prev) => ({ ...prev, isOpen: false, status: 'ended' }));
  };

  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-wide">
                MULTI-CHANNEL ALERTS & VOICE DISPATCH
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GATEWAY ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Test real text messages, browser-driven voice calls, and WhatsApp dispatches for your recipient settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleTestAlert('VOICE')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Test Voice Call</span>
          </button>
          <button
            type="button"
            onClick={() => handleTestAlert('SMS')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test SMS Alert</span>
          </button>
        </div>
      </div>

      {/* Grid of Delivery Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">{ch.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-white">{ch.channelName}</h3>
                  <span className="text-[10px] text-slate-400">{ch.provider}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Ready
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{ch.description}</p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>TRIGGER CONDITION:</span>
                <span className="text-cyan-300 font-bold">{ch.triggerCondition}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>TARGET RECIPIENT:</span>
                <span className="text-slate-200 font-extrabold">{getMaskedPhone(phoneNumber)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (ch.channelName.includes('SMS')) handleTestAlert('SMS');
                  else if (ch.channelName.includes('Voice')) handleTestAlert('VOICE');
                  else handleTestAlert('WHATSAPP');
                }}
                className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Trigger {ch.channelName.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration & Live Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Recipient Configuration Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">RECIPIENT & GATEWAY SETTINGS</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowTwilioConfig(!showTwilioConfig)}
              className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 underline"
            >
              <Key className="w-3 h-3" /> {showTwilioConfig ? 'Hide API Keys' : 'Twilio Keys'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">OWNER / DRIVER NAME</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">MOBILE NUMBER (FOR SMS / VOICE / WHATSAPP)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-bold text-cyan-300"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Masked output: <strong className="text-slate-300">{getMaskedPhone(phoneNumber)}</strong>
              </p>
            </div>

            {/* Optional Twilio API Config Dropdown */}
            {showTwilioConfig && (
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col gap-2.5">
                <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                  <Key className="w-3 h-3" /> TWILIO API GATEWAY (OPTIONAL FOR REAL SMS)
                </span>
                <div>
                  <label className="block text-[9px] text-slate-400">Twilio Account SID</label>
                  <input
                    type="password"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400">Twilio Auth Token</label>
                  <input
                    type="password"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    placeholder="Auth Token"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400">Twilio From Number</label>
                  <input
                    type="text"
                    value={twilioFrom}
                    onChange={(e) => setTwilioFrom(e.target.value)}
                    placeholder="+12015550123"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* DIRECT NATIVE DEVICE ACTION BUTTONS */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> INSTANT NATIVE DEVICE DISPATCH
              </span>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <a
                  href={`sms:${cleanPhone}?body=${encodeURIComponent(
                    `Voltra EV Alert for ${ownerName}: Your vehicle is currently charging on Port 1.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                  title="Opens native phone SMS app with pre-filled message"
                >
                  <MessageSquare className="w-3 h-3" /> SMS
                </a>
                <a
                  href={`tel:${cleanPhone}`}
                  className="px-2 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                  title="Launches phone dialer to call recipient"
                >
                  <Phone className="w-3 h-3" /> Dial Call
                </a>
                <a
                  href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                    `🟢 Voltra Alert for ${ownerName}: Charging Port 2 is ready.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                  title="Opens WhatsApp message pre-filled"
                >
                  <Send className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Live Notification Delivery Log */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">LIVE DISPATCH AUDIT LOG</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Real-time alerts audit</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
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
                <p className="text-slate-300 text-[11px] font-sans">{log.message}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                  <span>To: <strong className="text-slate-200">{log.recipient}</strong></span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INTERACTIVE CALL & DISPATCH POPUP MODAL */}
      {callModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-cyan-500/60 p-6 shadow-2xl flex flex-col items-center text-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* CHANNEL HEADER */}
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              {callModal.channel === 'VOICE' && <PhoneCall className="w-4 h-4 animate-bounce" />}
              {callModal.channel === 'SMS' && <MessageSquare className="w-4 h-4" />}
              {callModal.channel === 'WHATSAPP' && <Send className="w-4 h-4" />}
              <span>
                {callModal.channel === 'VOICE'
                  ? callModal.status === 'ringing'
                    ? 'Incoming Voice Alert Call...'
                    : 'Voice Alert Connected'
                  : `${callModal.channel} Alert Sent`}
              </span>
            </div>

            {/* RECIPIENT AVATAR */}
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-xl transition-all ${
                  callModal.status === 'ringing'
                    ? 'border-blue-500 bg-blue-950/80 text-blue-400 animate-pulse scale-110'
                    : 'border-emerald-500 bg-emerald-950/80 text-emerald-400'
                }`}
              >
                {callModal.channel === 'VOICE' ? (
                  <Phone className="w-9 h-9" />
                ) : callModal.channel === 'SMS' ? (
                  <MessageSquare className="w-9 h-9" />
                ) : (
                  <Send className="w-9 h-9" />
                )}
              </div>
            </div>

            {/* RECIPIENT DETAILS */}
            <div>
              <h3 className="text-base font-extrabold text-white">{ownerName}</h3>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">{phoneNumber}</p>
              <p className="text-[10px] text-slate-400 mt-1">Gateway: Voltra Automated Dispatcher</p>
            </div>

            {/* MESSAGE BODY */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs text-left leading-relaxed w-full">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">ALERT MESSAGE CONTENT:</span>
              <p className="font-sans italic">"{callModal.message}"</p>
            </div>

            {/* ACTION BUTTONS FOR VOICE CALL */}
            {callModal.channel === 'VOICE' && (
              <div className="flex items-center justify-center gap-4 w-full pt-2">
                {callModal.status === 'ringing' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" /> Decline
                    </button>
                    <button
                      type="button"
                      onClick={handleAnswerCall}
                      className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 animate-bounce cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" /> Answer & Listen
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" /> End Call
                  </button>
                )}
              </div>
            )}

            {/* ACTION BUTTONS FOR SMS / WHATSAPP */}
            {callModal.channel !== 'VOICE' && (
              <div className="flex flex-col gap-2 w-full pt-2">
                {callModal.channel === 'SMS' && (
                  <a
                    href={`sms:${cleanPhone}?body=${encodeURIComponent(callModal.message)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in Device SMS App
                  </a>
                )}
                {callModal.channel === 'WHATSAPP' && (
                  <a
                    href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                      callModal.message
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
