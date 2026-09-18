import React from 'react';
import { 
  SlidersHorizontal, Timer, Zap, ListOrdered, Car, Search, RefreshCw, CheckSquare, Code2, Clock, BatteryCharging
} from 'lucide-react';
import { FlatRecord, EVVehicle } from '../types';
import { Ev3dModel } from './Ev3dModel';

interface ResidentFlatLookupPanelProps {
  activeFlat: FlatRecord;
  isCharging: boolean;
  targetRangeKm: number;
  flatInput: string;
  setFlatInput: (val: string) => void;
  handleFlatFormSubmit: (e: React.FormEvent) => void;
  isSearchingApi: boolean;
  flatsList: FlatRecord[];
  handleLookupFlat: (flatNum: number, openTable?: boolean) => void;
  batteryInput: number;
  setBatteryInput: (val: number) => void;
  targetInput: number;
  setTargetInput: (val: number) => void;
  departureHoursInput: number;
  setDepartureHoursInput: (val: number) => void;
  handleSaveAndCalculate: () => void;
  isSavingSession: boolean;
  sessionSaveFeedback: string | null;
  searchFeedback: string | null;
  showApiInspector: boolean;
  apiResponseRaw: string | null;
  portsSummary: any;
  onToggleConnect: (vehicleId: string) => void;
  effectiveVehicle: EVVehicle;
}

export const ResidentFlatLookupPanel: React.FC<ResidentFlatLookupPanelProps> = ({
  activeFlat,
  isCharging,
  targetRangeKm,
  flatInput,
  setFlatInput,
  handleFlatFormSubmit,
  isSearchingApi,
  flatsList,
  handleLookupFlat,
  batteryInput,
  setBatteryInput,
  targetInput,
  setTargetInput,
  departureHoursInput,
  setDepartureHoursInput,
  handleSaveAndCalculate,
  isSavingSession,
  sessionSaveFeedback,
  searchFeedback,
  showApiInspector,
  apiResponseRaw,
  portsSummary,
  onToggleConnect,
  effectiveVehicle,
}) => {
  return (
    <div 
      id="resident-flat-lookup-panel"
      className="p-5 sm:p-6 rounded-2xl bg-slate-950 border-2 border-cyan-500/50 shadow-2xl flex flex-col gap-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <h4 className="text-base sm:text-lg font-black text-white">
              Resident EV Charging Intake &bull; Fair Queue Allocation
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-500/40">
            5-Port Multi-Factor Fairness
          </span>
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/40">
            Guaranteed Wait Time &le; 1 Hour
          </span>
        </div>
      </div>

      {/* Integrated 3D Model & Intake Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 3D Model + Registered Vehicle Info (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* 3D EV Model Viewer with HUD overlays */}
          <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-inner">
            <Ev3dModel
              modelName={activeFlat.model}
              isCharging={isCharging}
              batterySoc={activeFlat.currentChargePercent}
              chargingRateKw={activeFlat.currentChargingSpeedKw}
            />
            
            {/* Real-time Priority HUD Overlay on 3D viewport */}
            <div className="absolute top-14 left-3 right-3 pointer-events-none flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                {/* Priority Level Badge */}
                <div className="px-2 py-1 rounded-lg bg-slate-950/95 text-[11px] font-black tracking-wide border border-slate-700/85 backdrop-blur-md shadow-2xl flex items-center gap-1 pointer-events-auto shrink-0">
                  <span className="text-slate-400 font-bold">Prio:</span>
                  <span className={`font-black ${
                    activeFlat.priority.includes('P1')
                      ? 'text-rose-400 animate-pulse'
                      : activeFlat.priority.includes('P2')
                      ? 'text-amber-400'
                      : 'text-cyan-300'
                  }`}>
                    {activeFlat.priority}
                  </span>
                  <div className="w-px h-3 bg-slate-800" />
                  <span className="text-cyan-300 font-mono font-black">{activeFlat.priorityScore}</span>
                </div>

                {/* Wait Time & Assigned/Scheduled Port Badge with matched font & size */}
                <div className="pointer-events-auto flex items-center gap-1">
                  {activeFlat.assignedPort ? (
                    <>
                      <div className="px-2 py-1 rounded-lg bg-emerald-950/95 text-xs font-black border border-emerald-500/50 backdrop-blur-md shadow-2xl flex items-center gap-1 font-mono">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span className="text-emerald-300">PORT #{activeFlat.assignedPort}</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-slate-950/95 text-[10px] font-bold border border-slate-800 backdrop-blur-md shadow-2xl flex items-center font-mono">
                        <span className="text-slate-300">0m wait</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-2 py-1 rounded-lg bg-amber-950/95 text-xs font-black border border-amber-500/50 backdrop-blur-md shadow-2xl flex items-center gap-1 font-mono">
                        <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                        <span className="text-amber-300">QUEUE #{activeFlat.queuePosition || 1} ({activeFlat.waitTimeMinutes || 0}m wait)</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-cyan-950/95 text-xs font-black border border-cyan-500/40 backdrop-blur-md shadow-2xl flex items-center gap-1 font-mono">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-300">PORT #{activeFlat.expectedPortId || 1}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Display Associated Car Details Card (Right below 3D model) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">Registered Vehicle:</span>
                <strong className="text-white text-xs font-black">{activeFlat.model}</strong>{' '}
                <span className="text-cyan-300 font-mono font-bold">({activeFlat.vehicleNumber})</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-300 text-[10px]">
              <div>
                <span className="text-slate-400 block text-[9px]">Battery:</span>
                <strong className="text-white">{activeFlat.batteryCapacityKwh} kWh</strong>
              </div>
              <div className="w-px h-5 bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[9px]">Max Rate:</span>
                <strong className="text-cyan-300">{activeFlat.maxChargingRateKw} kW</strong>
              </div>
              <div className="w-px h-5 bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[9px]">Time to Goal:</span>
                <strong className="text-amber-300">
                  ~{Math.max(10, Math.min(55, Math.round((Math.max(0, ((activeFlat.departureGoalPercent - activeFlat.currentChargePercent) / 100) * activeFlat.batteryCapacityKwh) / (activeFlat.currentChargingSpeedKw || 7.4)) * 60)))}m
                </strong>
              </div>
            </div>
          </div>

          {/* Active EV Live Battery & Charging Telemetry Card (Replaced 5 Ports card) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                  Active EV Battery &amp; Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 font-bold">
                {isCharging ? '⚡ CHARGING' : 'STANDBY'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Battery Circular Dial */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-slate-950"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-cyan-500/20"
                      strokeWidth="10"
                      strokeDasharray={`${(activeFlat.departureGoalPercent / 100) * 264} 264`}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className={activeFlat.currentChargePercent >= 80 ? 'stroke-emerald-400' : activeFlat.currentChargePercent >= 40 ? 'stroke-cyan-400' : 'stroke-amber-400'}
                      strokeWidth="10"
                      strokeDasharray={`${(activeFlat.currentChargePercent / 100) * 264} 264`}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-2xl font-black text-white tracking-tight leading-none">
                      {activeFlat.currentChargePercent}%
                    </span>
                    <span className="text-[9px] font-bold text-cyan-300 mt-0.5">
                      Target: {activeFlat.departureGoalPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Speed, Time & Cable Info */}
              <div className="sm:col-span-7 flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">Speed Rate:</span>
                  <strong className="text-cyan-300 font-black">{activeFlat.currentChargingSpeedKw || 7.4} kW</strong>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">Est. Range:</span>
                  <strong className="text-emerald-300 font-black">{activeFlat.currentRange}</strong>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">Cable Plug:</span>
                  <button
                    type="button"
                    onClick={() => onToggleConnect(effectiveVehicle.id)}
                    className={`text-[10px] font-black px-2 py-0.5 rounded transition-colors ${
                      activeFlat.isConnected 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {activeFlat.isConnected ? '● Connected' : '○ Unplugged'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stacked Intake, Update, and Queue Allocation Status with NO GAPS (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-0 border border-slate-800 rounded-2xl overflow-hidden shadow-xl bg-slate-900/60">
          {/* STEP 1: Ask Flat Number */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="input-flat-number" className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Enter Your Flat Number (1 - 30)</span>
              </label>
              <span className="text-[11px] text-slate-400">Select or enter flat number to display vehicle</span>
            </div>

            <form onSubmit={handleFlatFormSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="font-bold text-xs">FLAT #</span>
                </div>
                <input
                  id="input-flat-number"
                  type="number"
                  min={1}
                  max={30}
                  value={flatInput}
                  onChange={(e) => setFlatInput(e.target.value)}
                  placeholder="Flat 1 - 30..."
                  className="w-full pl-16 pr-3 py-2 bg-slate-950 border-2 border-slate-700 rounded-xl text-white font-extrabold text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                />
              </div>

              <button
                id="btn-check-flat-status"
                type="submit"
                disabled={isSearchingApi}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/25 transition-all active:scale-98"
              >
                {isSearchingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Lookup</span>
              </button>

              {/* Select dropdown */}
              <select
                id="select-flat-dropdown"
                value={activeFlat.flatNumber}
                onChange={(e) => handleLookupFlat(Number(e.target.value))}
                aria-label="Select flat from list"
                className="py-2 px-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-400 max-w-[210px] truncate"
              >
                {flatsList.map((f) => (
                  <option key={f.flatNumber} value={f.flatNumber}>
                    Flat {f.flatNumber} - {f.model} ({f.vehicleNumber})
                  </option>
                ))}
              </select>
            </form>
          </div>

          {/* STEP 2, 3, 4: Grid of Battery, Target, Departure (Right below Step 1 with no gap) */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* STEP 2: Ask Current Battery */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-current-battery-pct" className="text-[11px] font-black uppercase text-cyan-300 flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[9px] font-black">2</span>
                    <span>Current Battery</span>
                  </label>
                  <span className="text-sm font-black text-cyan-300">{batteryInput}%</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {((batteryInput / 100) * activeFlat.batteryCapacityKwh).toFixed(1)} kWh &bull; ~{Math.round((batteryInput / 100) * activeFlat.batteryCapacityKwh * 5.2)} km
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  id="input-current-battery-pct"
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={batteryInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBatteryInput(val);
                    if (val > targetInput) {
                      setTargetInput(Math.min(100, val + 10));
                    }
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={batteryInput}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setBatteryInput(val);
                      if (val > targetInput) {
                        setTargetInput(Math.min(100, val + 10));
                      }
                    }}
                    className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white text-center focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-400">% SOC</span>
                </div>
              </div>
            </div>

            {/* STEP 3: Ask Target Charge */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-target-battery-pct" className="text-[11px] font-black uppercase text-emerald-300 flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[9px] font-black">3</span>
                    <span>Target Goal</span>
                  </label>
                  <span className="text-sm font-black text-emerald-300">{targetInput}%</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Deficit: +{Math.max(0, ((targetInput - batteryInput) / 100) * activeFlat.batteryCapacityKwh).toFixed(1)} kWh
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  id="input-target-battery-pct"
                  type="range"
                  min={batteryInput}
                  max={100}
                  step={1}
                  value={targetInput}
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex items-center gap-1">
                  {[80, 90, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetInput(Math.max(batteryInput, preset))}
                      className={`flex-1 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        targetInput === preset
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 4: Ask Departure Time */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-departure-hours-field" className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black">4</span>
                    <span>Departure</span>
                  </label>
                  <span className="text-sm font-black text-amber-300">
                    {departureHoursInput < 1 ? `${Math.round(departureHoursInput * 60)}m` : `${departureHoursInput.toFixed(1)}h`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Leaving at {(() => {
                    const d = new Date(Date.now() + departureHoursInput * 3600 * 1000);
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  })()}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: '30m', hours: 0.5 },
                    { label: '1h', hours: 1.0 },
                    { label: '2h', hours: 2.0 },
                    { label: '4h', hours: 4.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDepartureHoursInput(preset.hours)}
                      className={`flex-1 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        Math.abs(departureHoursInput - preset.hours) < 0.2
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-departure-hours-field"
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="24"
                    value={departureHoursInput}
                    onChange={(e) => setDepartureHoursInput(Math.max(0.2, Number(e.target.value) || 0.5))}
                    className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[11px] text-slate-400">hrs left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option to Update right below the 3 inputs with no gap */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                id="btn-update-and-calculate-priority"
                onClick={() => handleSaveAndCalculate()}
                disabled={isSavingSession}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-400/25 transition-all active:scale-98"
              >
                {isSavingSession ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CheckSquare className="w-4 h-4 text-slate-950" />
                )}
                <span>Update Dataset &amp; Calculate Fair Priority</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium" style={{ display: 'none' }}>
                Updates columns: <code className="text-cyan-300">current_charge</code>, <code className="text-emerald-300">departure_goal</code>, <code className="text-amber-300">departure_time</code>, and assigns <code className="text-cyan-300 font-bold">priority</code>.
              </span>
            </div>

            {/* Feedback Banner */}
            {(sessionSaveFeedback || searchFeedback) && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-medium text-slate-200 flex items-center justify-between">
                <span className="font-bold text-cyan-300">{sessionSaveFeedback || searchFeedback}</span>
                <span className="text-[11px] font-mono text-slate-400">Dataset Synchronized</span>
              </div>
            )}

            {/* Live API Inspector Drawer (Collapsible) */}
            {showApiInspector && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-xs text-slate-300 flex flex-col gap-2">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live REST API Response (/api/flats/{activeFlat.flatNumber})</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">Status: 200 OK</span>
                </div>
                <pre className="p-2 bg-slate-900 rounded-lg text-emerald-300 overflow-x-auto text-[11px] max-h-40">
                  {apiResponseRaw || JSON.stringify({
                    success: true,
                    flat: activeFlat,
                    summary: portsSummary,
                    message: `Retrieved EV status for Flat ${activeFlat.flatNumber}`,
                    timestamp: new Date().toISOString()
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Queue Allocation Status right below Update Option with no gap */}
          <div className="p-4 bg-slate-900/90 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                  Queue Allocation Status
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 font-black">
                SCORE: {activeFlat.priorityScore}/100
              </span>
            </div>

            {/* Queue Position and Port Assignment side-by-side */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {activeFlat.assignedPort ? (
                <>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase font-mono tracking-wider">Allocation</span>
                    <strong className="text-sm font-black text-emerald-400 font-mono uppercase">CHARGING</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase font-mono tracking-wider">Active Port</span>
                    <strong className="text-sm font-black text-cyan-300 font-mono uppercase">PORT #{activeFlat.assignedPort}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase font-mono tracking-wider">Queue Rank &amp; Wait</span>
                    <strong className="text-sm font-black text-amber-400 font-mono uppercase">POS #{activeFlat.queuePosition || 1} &bull; {activeFlat.waitTimeMinutes || 0}m</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-black uppercase font-mono tracking-wider">Scheduled Port</span>
                    <strong className="text-sm font-black text-cyan-300 font-mono uppercase">PORT #{activeFlat.expectedPortId || 1}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Priority Progress bar */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  activeFlat.priorityScore >= 80 
                    ? 'bg-gradient-to-r from-amber-400 to-rose-400' 
                    : activeFlat.priorityScore >= 60 
                    ? 'bg-gradient-to-r from-cyan-400 to-amber-400' 
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, activeFlat.priorityScore))}%` }}
              />
            </div>

            {/* Fairness Factors List */}
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-medium">
              <div className="px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Battery Deficit</span>
                <strong className="text-cyan-300 font-bold">+{Math.round((100 - activeFlat.currentChargePercent) * 0.4)} pts</strong>
              </div>
              <div className="px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Urgency</span>
                <strong className="text-amber-300 font-bold">+{Math.round(Math.max(0, 8 - activeFlat.departureHoursRemaining) * 5)} pts</strong>
              </div>
              <div className="px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80 text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Target Vol</span>
                <strong className="text-emerald-300 font-bold">+8 pts</strong>
              </div>
            </div>

            {/* Cable & Trio Performance Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1.5 border-t border-slate-800/60">
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">Current Range</span>
                <strong className="text-cyan-300 text-[11px] font-black">{activeFlat.currentRange}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">Target Range</span>
                <strong className="text-emerald-300 text-[11px] font-black">~{targetRangeKm} km</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col justify-center">
                <span className="text-slate-500 block text-[9px]">Cable Status</span>
                <button
                  type="button"
                  onClick={() => onToggleConnect(effectiveVehicle.id)}
                  className={`text-[9px] font-black px-1 rounded transition-colors ${
                    activeFlat.isConnected 
                      ? 'text-emerald-400 hover:text-emerald-300' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {activeFlat.isConnected ? '● Connected' : '○ Unplugged'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
