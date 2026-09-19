import React from 'react';
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  Database, 
  GitBranch, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Sun, 
  CloudRain,
  Car,
  BarChart3,
  Sparkles,
  Flame,
  Radio,
  MapPin,
  Phone
} from 'lucide-react';
import { GridState, SystemStatus } from '../types';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';

import { Brain, Bot } from 'lucide-react';

export type ViewMode = 'CITIZEN' | 'CHARGING_PORTS' | 'FLOW' | 'OPERATOR' | 'SOLAR' | 'MAP' | 'ALERTS' | 'ML_INTELLIGENCE' | 'AI_ASSISTANT';

interface HeaderProps {
  gridState: GridState;
  isSimulating: boolean;
  activeViewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onToggleSimulation: () => void;
  onResetToNormal: () => void;
  onOpenArchitecture: () => void;
  onOpenSupabase: () => void;
  onOpenResidentDb?: () => void;
  onOpenNotificationSettings?: () => void;
  onSelectPort?: (portId: number) => void;
  onSimulateGridStress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gridState,
  isSimulating,
  activeViewMode,
  onChangeViewMode,
  onToggleSimulation,
  onResetToNormal,
  onOpenArchitecture,
  onOpenSupabase,
  onOpenResidentDb,
  onOpenNotificationSettings,
  onSelectPort,
  onSimulateGridStress,
}) => {
  const getStatusBadge = (status: SystemStatus) => {
    switch (status) {
      case 'SAFE':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400 animate-pulse',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          label: 'SAFE',
        };
      case 'CAUTION':
        return {
          bg: 'bg-amber-950/80 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400 animate-pulse',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'CAUTION',
        };
      case 'HIGH DEMAND':
        return {
          bg: 'bg-rose-950/80 border-rose-500/50 text-rose-400',
          dot: 'bg-rose-500 animate-ping',
          icon: <Activity className="w-4 h-4 text-rose-400" />,
          label: 'HIGH DEMAND',
        };
      case 'OVERLOAD PREVENTED':
        return {
          bg: 'bg-cyan-950/90 border-cyan-400/60 text-cyan-300 ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-950/50',
          dot: 'bg-cyan-400 animate-ping',
          icon: <ShieldCheck className="w-4 h-4 text-cyan-300" />,
          label: 'OVERLOAD PREVENTED',
        };
      case 'CLEAN ENERGY AVAILABLE':
        return {
          bg: 'bg-teal-950/80 border-teal-400/50 text-teal-300',
          dot: 'bg-teal-400 animate-pulse',
          icon: <Sun className="w-4 h-4 text-teal-300" />,
          label: 'CLEAN ENERGY AVAILABLE',
        };
      case 'RENEWABLE DROP':
        return {
          bg: 'bg-indigo-950/80 border-indigo-400/50 text-indigo-300',
          dot: 'bg-indigo-400 animate-pulse',
          icon: <CloudRain className="w-4 h-4 text-indigo-300" />,
          label: 'RENEWABLE DROP',
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          icon: <ShieldCheck className="w-4 h-4" />,
          label: status,
        };
    }
  };

  const badge = getStatusBadge(gridState.systemStatus);

  return (
    <header className="border-b border-slate-700/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40">
            <Zap className="w-6 h-6 text-slate-950 fill-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white drop-shadow-sm">
                Voltra
              </h1>
            </div>
            <p className="text-sm text-cyan-200 font-medium tracking-normal mt-0.5">
              Clean Solar Energy &bull; Neighborhood Power Reliability &bull; Guaranteed Departure Ready
            </p>
          </div>
        </div>

        {/* Right: Status Pill & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* VIEW SWITCHER: Resident View vs Charging Ports vs Energy Flow vs Grid Console */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              id="view-mode-citizen"
              onClick={() => onChangeViewMode('CITIZEN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'CITIZEN'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Citizen-friendly home view"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Resident View</span>
            </button>

            <button
              id="view-mode-ports"
              onClick={() => onChangeViewMode('CHARGING_PORTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'CHARGING_PORTS'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="5 Charging Ports Live Status & Priority Queues"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Charging Ports</span>
            </button>



            <button
              id="view-mode-flow"
              onClick={() => onChangeViewMode('FLOW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'FLOW'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Power flow diagram"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Energy Flow</span>
            </button>

            <button
              id="view-mode-ml"
              onClick={() => onChangeViewMode('ML_INTELLIGENCE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'ML_INTELLIGENCE'
                  ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="ML Intelligence & Predictive Models Command Center"
            >
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>🤖 ML Intelligence</span>
            </button>

            <button
              id="view-mode-ai-assistant"
              onClick={() => onChangeViewMode('AI_ASSISTANT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'AI_ASSISTANT'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="AI Energy Assistant Chat & Analysis Center"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>🤖 AI Assistant</span>
            </button>

            <button
              id="view-mode-solar"
              onClick={() => onChangeViewMode('SOLAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'SOLAR'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Solar Forecast & Weather Integration"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Solar Forecast</span>
            </button>

            <button
              id="view-mode-map"
              onClick={() => onChangeViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'MAP'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live Map & Charging Stations Directory"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map & Stations</span>
            </button>

            <button
              id="view-mode-alerts"
              onClick={() => onChangeViewMode('ALERTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'ALERTS'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="SMS, Phone Call & WhatsApp Notifications"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ALERTS</span>
            </button>

            <button
              id="view-mode-operator"
              onClick={() => onChangeViewMode('OPERATOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'OPERATOR'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Detailed technical engineering console"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid Console</span>
            </button>
          </div>

          {/* Notification Center Bell */}
          {onOpenNotificationSettings && (
            <NotificationCenterDropdown
              onOpenPreferences={onOpenNotificationSettings}
              onSelectPort={onSelectPort}
            />
          )}



          {/* Dynamic Status Badge */}
          <div
            id="system-status-badge"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all duration-300 ${badge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.icon}
            <span>{badge.label}</span>
          </div>

          {/* Live Simulation Indicator */}
          <button
            id="simulation-toggle-btn"
            onClick={onToggleSimulation}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isSimulating
                ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40'
                : 'bg-slate-900/90 border-amber-500/40 text-amber-300 hover:bg-amber-950/40'
            }`}
            title={isSimulating ? 'Click to pause simulation' : 'Click to resume simulation'}
          >
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="font-mono hidden sm:inline">{isSimulating ? 'LIVE' : 'PAUSED'}</span>
          </button>

          {/* Simulate Grid Stress Feature Button */}
          {onSimulateGridStress && (
            <button
              id="header-judge-stress-btn"
              onClick={onSimulateGridStress}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-rose-950/60 transition-all active:scale-95 border border-rose-400/60"
              title="Simulate sudden building spike to 48 kW and observe autonomous EV throttling"
            >
              <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-pulse" />
              <span className="hidden sm:inline">Simulate Grid Stress</span>
              <span className="sm:hidden">Stress</span>
            </button>
          )}

          {/* Reset button */}
          <button
            id="reset-system-btn"
            onClick={onResetToNormal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium transition-all"
            title="Reset to Normal baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Architecture Modal Trigger */}
          <button
            id="architecture-btn"
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-500/40 text-xs font-medium transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Architecture</span>
          </button>

          {/* Supabase Schema / DB viewer */}
          <button
            id="supabase-btn"
            onClick={onOpenSupabase}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 text-xs font-medium transition-all"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DB</span>
          </button>

          {/* Resident Phone Database Modal Trigger */}
          {onOpenResidentDb && (
            <button
              id="resident-db-btn"
              onClick={onOpenResidentDb}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 text-xs font-medium transition-all"
              title="Resident Phone Number & Vehicle Database (30 Flats)"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Residents</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
