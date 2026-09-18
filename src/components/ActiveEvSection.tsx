import React from 'react';
import { 
  Car, 
  BatteryCharging, 
  Clock, 
  Zap, 
  Plus, 
  Trash2, 
  Power, 
  SlidersHorizontal, 
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Flame,
  Info
} from 'lucide-react';
import { EVVehicle, PriorityLevel } from '../types';

interface ActiveEvSectionProps {
  vehicles: EVVehicle[];
  selectedEvId: string;
  onSelectEv: (id: string) => void;
  onToggleConnect: (id: string) => void;
  onRemoveEv: (id: string) => void;
  onOpenAddModal: () => void;
}

export const ActiveEvSection: React.FC<ActiveEvSectionProps> = ({
  vehicles,
  selectedEvId,
  onSelectEv,
  onToggleConnect,
  onRemoveEv,
  onOpenAddModal,
}) => {
  const getPriorityBadge = (level: PriorityLevel, score: number) => {
    switch (level) {
      case 'VERY HIGH':
        return {
          bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-sky-950/80 border-sky-500/40 text-sky-300',
          dot: 'bg-sky-400',
        };
      case 'LOW':
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-400',
          dot: 'bg-slate-500',
        };
    }
  };

  const getSocColor = (soc: number) => {
    if (soc < 25) return 'from-rose-500 to-rose-600 text-rose-400';
    if (soc < 50) return 'from-amber-500 to-amber-600 text-amber-400';
    if (soc < 80) return 'from-sky-500 to-cyan-500 text-cyan-400';
    return 'from-emerald-500 to-emerald-600 text-emerald-400';
  };

  return (
    <section
      id="active-evs-section"
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col gap-4"
    >
      {/* Header with Title and Add EV button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                ACTIVE CHARGING PORTS &amp; CLUSTER ALLOCATION
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {vehicles.filter((v) => v.isConnected).length} Connected / {vehicles.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              DYNAMIC POWER MODULATION BASED ON URGENCY + DEADLINE + CAPACITY + FAIRNESS
            </p>
          </div>
        </div>

        <button
          id="btn-add-ev"
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-cyan-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>CONNECT NEW EV</span>
        </button>
      </div>

      {/* Grid of Charging Port Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {vehicles.map((ev) => {
          const isSelected = ev.id === selectedEvId;
          const badge = getPriorityBadge(ev.priorityLevel, ev.priorityScore);
          const socColor = getSocColor(ev.batterySoc);
          const requiredKwh = Math.max(0, (ev.batteryCapacityKwh * (ev.targetSoc - ev.batterySoc)) / 100);

          return (
            <div
              key={ev.id}
              id={`port-card-${ev.id}`}
              onClick={() => onSelectEv(ev.id)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-950/60'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              {/* Selected indicator pin */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                  <div className="bg-cyan-400 text-slate-950 text-[9px] font-bold py-0.5 px-3 transform rotate-45 translate-x-3 translate-y-1 text-center shadow">
                    ACTIVE
                  </div>
                </div>
              )}

              {/* Top Row: Port ID, Connected EV Model, Priority Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold font-mono text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {ev.id}
                      </span>
                      {!ev.isConnected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate max-w-[130px] block font-medium" title={ev.model}>
                      {ev.model}
                    </span>
                  </div>

                  {/* Urgency Badge */}
                  <div className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1.5 whitespace-nowrap ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{ev.priorityLevel} ({ev.priorityScore})</span>
                  </div>
                </div>

                {/* Battery SOC Visual Bar */}
                <div className="mt-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
                      State of Charge:
                    </span>
                    <span className="font-bold text-slate-100">
                      {Math.round(ev.batterySoc)}% <span className="text-[10px] text-slate-500">/ {ev.targetSoc}% tgt</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                    {/* Target marker line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                      style={{ left: `${ev.targetSoc}%` }}
                      title={`Target: ${ev.targetSoc}%`}
                    />
                    <div
                      className={`h-full bg-gradient-to-r ${socColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, ev.batterySoc)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>{ev.batteryCapacityKwh} kWh pack</span>
                    <span>Needs {requiredKwh.toFixed(1)} kWh</span>
                  </div>
                </div>

                {/* Allocation and Specs Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  {/* Current Charging Allocation */}
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CURRENT ALLOC</span>
                    <span className="text-sm font-bold text-cyan-300">
                      {ev.currentChargingRateKw.toFixed(1)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">kW</span>
                    </span>
                    <span className="text-[9px] text-slate-500 block">Max: {ev.maxChargingRateKw} kW</span>
                  </div>

                  {/* Departure Time */}
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      DEPARTURE
                    </span>
                    <span className="text-sm font-bold text-amber-300">
                      {ev.departureTime}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      {ev.departureHoursRemaining <= 1.5 
                        ? `${Math.round(ev.departureHoursRemaining * 60)} min left` 
                        : `${ev.departureHoursRemaining.toFixed(1)}h left`}
                    </span>
                  </div>
                </div>

                {/* Fairness / Session Stats */}
                <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between px-1">
                  <span>Delivered: {ev.totalChargedKwh.toFixed(1)} kWh</span>
                  {ev.consecutiveHighChargingMinutes > 25 && (
                    <span className="text-amber-400 flex items-center gap-1">
                      Fairness quota active
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                {/* Connect/Disconnect Toggle */}
                <button
                  id={`btn-toggle-connect-${ev.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleConnect(ev.id);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    ev.isConnected
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                  }`}
                  title={ev.isConnected ? 'Disconnect Port' : 'Reconnect Port'}
                >
                  <Power className="w-3 h-3" />
                  <span>{ev.isConnected ? 'Disconnect' : 'Connect'}</span>
                </button>

                {/* Explain decision trigger */}
                <button
                  id={`btn-inspect-port-${ev.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEv(ev.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Explain</span>
                </button>

                {/* Remove vehicle */}
                <button
                  id={`btn-remove-port-${ev.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveEv(ev.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Remove from fleet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
