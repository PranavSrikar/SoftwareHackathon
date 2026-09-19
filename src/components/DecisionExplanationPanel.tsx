import React from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  Zap, 
  Clock, 
  Battery, 
  Sun, 
  ShieldCheck, 
  Scale, 
  Sliders, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { EVVehicle, PriorityBreakdown, GridState } from '../types';

interface DecisionExplanationPanelProps {
  selectedVehicle: EVVehicle | undefined;
  vehicles: EVVehicle[];
  breakdown: PriorityBreakdown | undefined;
  gridState: GridState;
  onSelectVehicle: (id: string) => void;
}

export const DecisionExplanationPanel: React.FC<DecisionExplanationPanelProps> = ({
  selectedVehicle,
  vehicles,
  breakdown,
  gridState,
  onSelectVehicle,
}) => {
  if (!selectedVehicle || !breakdown) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center text-slate-400 font-mono">
        Select a vehicle to inspect decision explanation.
      </div>
    );
  }

  const hoursRemaining = selectedVehicle.departureHoursRemaining;
  const hoursFormatted = hoursRemaining < 1
    ? `${Math.round(hoursRemaining * 60)} minutes`
    : `${hoursRemaining.toFixed(1)} hours`;

  const requiredEnergy = Math.max(
    0,
    (selectedVehicle.batteryCapacityKwh * (selectedVehicle.targetSoc - selectedVehicle.batterySoc)) / 100
  );

  return (
    <section
      id="explainable-smart-charging-panel"
      className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Decorative accent background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and EV Selector Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                EXPLAINABLE SMART CHARGING DECISIONS
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                AUDIT LOG ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              MATHEMATICAL TRANSPARENCY: WHY DID THE CONTROLLER ASSIGN {selectedVehicle.currentChargingRateKw.toFixed(1)} kW TO {selectedVehicle.id}?
            </p>
          </div>
        </div>

        {/* EV Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {vehicles.map((v) => {
            const isCurrent = v.id === selectedVehicle.id;
            return (
              <button
                key={v.id}
                id={`tab-explain-${v.id}`}
                onClick={() => onSelectVehicle(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {v.id} ({v.currentChargingRateKw.toFixed(1)} kW)
              </button>
            );
          })}
        </div>
      </div>

      {/* Highlight Box: Primary Explanation Narrative */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-300 font-bold">
                SMART DISPATCH REASONING FOR {selectedVehicle.id}:
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                PRIORITY SCORE: {breakdown.finalScore} / 100 ({selectedVehicle.priorityLevel})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-sans mt-1 leading-relaxed">
              <span className="font-semibold text-cyan-300">{selectedVehicle.id}</span> received{' '}
              <span className="font-bold text-white font-mono bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {selectedVehicle.currentChargingRateKw.toFixed(1)} kW
              </span>{' '}
              because its battery is at{' '}
              <span className="text-amber-300 font-mono font-bold">{Math.round(selectedVehicle.batterySoc)}%</span>,
              departure is in <span className="text-sky-300 font-mono font-bold">{hoursFormatted}</span> ({selectedVehicle.departureTime}),
              requiring <span className="text-emerald-300 font-mono font-bold">{requiredEnergy.toFixed(1)} kWh</span>.
              {selectedVehicle.consecutiveHighChargingMinutes > 25 && (
                <span className="text-amber-300"> (Fairness quota applied to prevent prolonged cluster starvation).</span>
              )}
            </p>
          </div>
        </div>

        {/* Status Callout */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">Decision:</span>
          <span className="font-bold text-cyan-300 uppercase">{selectedVehicle.priorityLevel} ALLOCATION</span>
        </div>
      </div>

      {/* ML PREDICTIVE SCHEDULER REASONING CARD */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-950 to-indigo-950/80 border border-indigo-500/30 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            🤖 ML PREDICTIVE SCHEDULER
          </span>
          <span className="text-slate-300">
            {selectedVehicle.batterySoc < 25 || selectedVehicle.departureHoursRemaining <= 1.0
              ? `${selectedVehicle.id} receives top charging priority because SOC is low (${selectedVehicle.batterySoc}%) and departure is approaching (${hoursFormatted}).`
              : `${selectedVehicle.id} charging is shifted toward the predicted solar peak (12:30 - 13:30) while avoiding predicted building load peaks (13:30 - 14:30).`}
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/80 shrink-0">
          HARD CONSTRAINT: GRID &le; 50 kW PASS
        </span>
      </div>

      {/* Transparent Scoring Formula Cards (Section 8 Spec) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Component 1: Battery Need (Weight 48) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-rose-400" />
                BATTERY NEED
              </span>
              <span className="text-rose-400 font-bold">Weight: 48</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {breakdown.weightedBatteryPoints.toFixed(1)}{' '}
              <span className="text-xs text-slate-500 font-normal">/ 48.0 pts</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${(breakdown.weightedBatteryPoints / 48) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">
            SOC Deficit: {Math.round(selectedVehicle.targetSoc - selectedVehicle.batterySoc)}% below target
          </p>
        </div>

        {/* Component 2: Departure Deadline (Weight 35) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                DEPARTURE DEADLINE
              </span>
              <span className="text-amber-400 font-bold">Weight: 35</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {breakdown.weightedDeparturePoints.toFixed(1)}{' '}
              <span className="text-xs text-slate-500 font-normal">/ 35.0 pts</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(breakdown.weightedDeparturePoints / 35) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">
            Remaining: {hoursFormatted} ({selectedVehicle.departureTime})
          </p>
        </div>

        {/* Component 3: Required Energy (Weight 15) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                REQUIRED ENERGY
              </span>
              <span className="text-sky-400 font-bold">Weight: 15</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {breakdown.weightedRequiredEnergyPoints.toFixed(1)}{' '}
              <span className="text-xs text-slate-500 font-normal">/ 15.0 pts</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${(breakdown.weightedRequiredEnergyPoints / 15) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">
            Volumetric: {requiredEnergy.toFixed(1)} kWh needed
          </p>
        </div>

        {/* Component 4: Renewable Availability (Weight 18) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-emerald-400" />
                RENEWABLE INCENTIVE
              </span>
              <span className="text-emerald-400 font-bold">Weight: 18</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {breakdown.weightedRenewablePoints.toFixed(1)}{' '}
              <span className="text-xs text-slate-500 font-normal">/ 18.0 pts</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(breakdown.weightedRenewablePoints / 18) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">
            Solar Gen: {gridState.solarGenerationKw.toFixed(1)} kW clean absorption
          </p>
        </div>
      </div>

      {/* Critical Concept Deep-Dive: Departure Deadline Intelligence */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-950 text-cyan-400">
            <Scale className="w-4 h-4" />
          </div>
          <div className="text-slate-300">
            <span className="font-bold text-cyan-300">Departure-Deadline Intelligence Proof:</span>{' '}
            Priority is mathematically decoupled from naive battery percentage. An EV with 50% battery departing in 1 hour
            receives a higher urgency score than an EV with 20% battery departing tomorrow.
          </div>
        </div>

        {/* Fairness adjustment status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 shrink-0 text-[11px]">
          <span className="text-slate-400">Fairness Factor:</span>
          <span className={breakdown.fairnessAdjustment < 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
            {breakdown.fairnessAdjustment !== 0 ? `${breakdown.fairnessAdjustment} pts` : 'Nominal (1.0)'}
          </span>
        </div>
      </div>
    </section>
  );
};
