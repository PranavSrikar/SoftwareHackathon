import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Smartphone, 
  MessageSquare, 
  Bell, 
  ShieldCheck, 
  Check, 
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { NotificationPreferences } from '../types';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences 
} from '../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => getNotificationPreferences());
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateNotificationPreferences(prefs);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                NOTIFICATION PREFERENCES
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                SMS, WHATSAPP & IN-APP ALERT CONFIGURATION
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {/* Section 1: Alert Channels */}
          <div>
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3">
              ALERT DELIVERY CHANNELS
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleToggle('smsEnabled')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  prefs.smsEnabled ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-bold text-[11px]">SMS Alerts</span>
              </button>

              <button
                onClick={() => handleToggle('whatsappEnabled')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  prefs.whatsappEnabled ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold text-[11px]">WhatsApp</span>
              </button>

              <button
                onClick={() => handleToggle('inAppEnabled')}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  prefs.inAppEnabled ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="font-bold text-[11px]">In-App Bell</span>
              </button>
            </div>
          </div>

          {/* Section 2: Alert Triggers */}
          <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
              AUTOMATIC NOTIFICATION RULES
            </h4>

            {/* Rule 1: Low Battery */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Low Battery Alert</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Notify when EV battery drops below threshold</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={prefs.lowBatteryThreshold}
                  onChange={(e) => setPrefs({ ...prefs, lowBatteryThreshold: Number(e.target.value) })}
                  className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-bold"
                />
                <span className="text-slate-400">%</span>
                <input
                  type="checkbox"
                  checked={prefs.lowBatteryAlert}
                  onChange={() => handleToggle('lowBatteryAlert')}
                  className="w-4 h-4 accent-cyan-500"
                />
              </div>
            </div>

            {/* Rule 2: Free Charging Port */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Free Charging Port Alert</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Notify when a community port transitions to Available</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.portAvailableAlert}
                onChange={() => handleToggle('portAvailableAlert')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            {/* Rule 3: Departure Risk */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Departure Risk Alert</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Warn if EV may not reach target SOC before departure</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.departureRiskAlert}
                onChange={() => handleToggle('departureRiskAlert')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            {/* Rule 4: Charging Complete */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Charging Complete Alert</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Notify when vehicle completes target charge</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.chargingCompleteAlert}
                onChange={() => handleToggle('chargingCompleteAlert')}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-3">
            * Phone numbers are strictly masked (`+91 ******4821`) for privacy and transmitted only through secure backend messaging abstractions.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400">
            {savedMsg && '✓ Preferences Saved Successfully!'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs shadow-md shadow-cyan-500/20"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
