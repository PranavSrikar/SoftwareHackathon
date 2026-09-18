import React from 'react';
import { 
  Zap, 
  BatteryCharging, 
  Clock, 
  User, 
  Car, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Gauge,
  Activity
} from 'lucide-react';
import { FlatRecord, FivePortAllocationSummary, ChargingPort } from '../types';

interface ChargingPortsSectionProps {
  flats: FlatRecord[];
  portSummary: FivePortAllocationSummary | null;
  onSelectFlat?: (flatNumber: number) => void;
}

export const ChargingPortsSection: React.FC<ChargingPortsSectionProps> = ({
  flats,
  portSummary,
  onSelectFlat,
}) => {
  const ports = portSummary?.ports || [1, 2, 3, 4, 5].map((id) => ({
    portId: id as 1 | 2 | 3 | 4 | 5,
    portLabel: `Port ${id}`,
    status: 'AVAILABLE' as const,
    activeFlatNumber: null,
    activeVehicleNumber: null,
    activeModel: null,
    currentSoc: 0,
    targetSoc: 100,
    chargingRateKw: 0,
    kwhRemaining: 0,
    minutesRemaining: 0,
    priorityScore: 0,
    priorityLevel: 'AVAILABLE',
  }));

  const activeCount = portSummary ? portSummary.activeCount : 0;
  const totalPorts = portSummary ? portSummary.totalPorts : 5;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Section Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              5-Port Community EV Charging Management
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time load balancing and intelligent priority queueing across all 5 shared community charging bays. Vehicles are dynamically allocated based on battery deficit, urgency, and departure schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Bays</span>
            <span className="text-lg font-mono font-bold text-cyan-300">
              {activeCount} / {totalPorts} <span className="text-xs text-slate-400 font-normal">Charging</span>
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800 mx-1" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Next Port Free</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {portSummary ? `${portSummary.nextAvailablePortMinutes} mins` : '15 mins'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Port Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {ports.map((port) => {
          // Find active flat details if charging
          const activeFlat = port.activeFlatNumber 
            ? flats.find((f) => f.flatNumber === port.activeFlatNumber)
            : null;

          // Find queued flats waiting for this port or general queue
          const queuedForPort = flats.filter(
            (f) => f.status === 'Queued' && (f.expectedPortId === port.portId || !f.expectedPortId)
          );
          queuedForPort.sort((a, b) => (a.queuePosition || 99) - (b.queuePosition || 99));

          const isCharging = port.status === 'CHARGING';

          return (
            <div
              key={port.portId}
              className={`flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden bg-slate-900/90 shadow-xl ${
                isCharging 
                  ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Port Card Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isCharging ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    isCharging ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    P{port.portId}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">{port.portLabel}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">Type 2 AC (7.4 kW)</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                  isCharging 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isCharging ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  {port.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col gap-4 flex-1">
                {/* 1. CURRENTLY USING SECTION */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-1.5">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <User className="w-3.5 h-3.5" />
                      CURRENT USER
                    </span>
                    {activeFlat && (
                      <button
                        onClick={() => onSelectFlat && onSelectFlat(activeFlat.flatNumber)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                      >
                        Flat {activeFlat.flatNumber}
                      </button>
                    )}
                  </div>

                  {isCharging && activeFlat ? (
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate max-w-[140px]">
                            <Car className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span className="truncate">{activeFlat.model}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {activeFlat.vehicleNumber}
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          activeFlat.priorityLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          activeFlat.priorityLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          Score {activeFlat.priorityScore}
                        </span>
                      </div>

                      {/* Battery Progress */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-300">SoC: {activeFlat.currentChargePercent}%</span>
                          <span className="text-cyan-300 font-bold">Goal: {activeFlat.departureGoalPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, activeFlat.currentChargePercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Basic Details Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px] font-mono">
                        <div className="flex flex-col">
                          <span className="text-slate-400">Power Rate</span>
                          <span className="text-white font-bold">{port.chargingRateKw} kW</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">Est. Finish</span>
                          <span className="text-emerald-400 font-bold">~{port.minutesRemaining} mins</span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-slate-400">Energy Remaining</span>
                          <span className="text-slate-200 font-bold">{port.kwhRemaining} kWh to goal</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center gap-2 py-6">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">Port Available</span>
                      <span className="text-[11px] text-slate-400">Ready for next queued vehicle.</span>
                    </div>
                  )}
                </div>

                {/* 2. QUEUE NEXT SECTION */}
                <div className="flex flex-col gap-2.5 mt-auto">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-1.5">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      QUEUE NEXT ({queuedForPort.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Fair Order</span>
                  </div>

                  {queuedForPort.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {queuedForPort.map((qFlat, qIdx) => (
                        <div 
                          key={qFlat.flatNumber}
                          onClick={() => onSelectFlat && onSelectFlat(qFlat.flatNumber)}
                          className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-1.5 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[130px]">
                              #{qIdx + 1} • Flat {qFlat.flatNumber} ({qFlat.model})
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                              qFlat.priorityLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                              qFlat.priorityLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}>
                              Score {qFlat.priorityScore}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>SoC: {qFlat.currentChargePercent}% &rarr; {qFlat.departureGoalPercent}%</span>
                            <span className="text-amber-300 font-bold">Wait ~{qFlat.waitTimeMinutes}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-center">
                      <span className="text-[11px] text-slate-500 italic">No vehicles queued for this port.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
