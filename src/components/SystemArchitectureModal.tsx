import React from 'react';
import { X, GitBranch, Cpu, Database, LayoutDashboard, ShieldCheck, Sun, Zap, CheckCircle } from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                COMPLETE SYSTEM ARCHITECTURE &amp; DATA FLOW
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                AUTONOMOUS SMART EV CONTROLLER &bull; DETERMINISTIC EMBEDDED PIPELINE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="flex flex-col gap-6 font-mono text-xs">
          {/* LEVEL 1: INPUT DATA LAYER */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-cyan-400 font-bold tracking-wider">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                1. INPUT DATA TELEMETRY LAYER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                Continuous 2-5s Sampling
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">EV TELEMETRY</span>
                <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>Battery SoC % &amp; Target SoC</li>
                  <li>Battery Capacity (kWh)</li>
                  <li>Departure Deadline Timestamp</li>
                  <li>Max Onboard Charger Rate (kW)</li>
                  <li>Connection Status &amp; Session History</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">BUILDING DEMAND DATA</span>
                <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>Real-time Commercial Base Load (kW)</li>
                  <li>Peak Feeder / Substation Limit (50 kW)</li>
                  <li>Transformer Thermal Envelope (60 kVA)</li>
                  <li>Priority Uninterruptible Load Curves</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">RENEWABLE GENERATION</span>
                <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>Rooftop Solar PV Inverter Output (kW)</li>
                  <li>Clean Energy Surplus Calculation</li>
                  <li>Cloud Cover &amp; Irradiance Variation</li>
                  <li>Zero-Carbon Marginal Electron Priority</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DOWN ARROW */}
          <div className="flex justify-center -my-2 text-cyan-400 font-bold">
            <span className="bg-slate-900 px-3 py-1 rounded-full border border-cyan-500/30 text-xs">
              &darr; INGESTED INTO SMART CONTROLLER &darr;
            </span>
          </div>

          {/* LEVEL 2: SMART CONTROLLER ENGINE */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40">
            <div className="flex items-center justify-between mb-3 text-cyan-300 font-bold tracking-wider">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                2. AUTONOMOUS SMART CONTROLLER (CORE ENGINES)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                Deterministic Optimization
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Engine 1 */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  PRIORITY ENGINE
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-1">
                  Calculates urgency using weighted deterministic formula:
                </p>
                <div className="text-[10px] bg-slate-900 p-1.5 rounded text-cyan-300 border border-slate-800">
                  48&times;Batt + 35&times;Dep + 15&times;Req + 18&times;Renew
                </div>
              </div>

              {/* Engine 2 */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  GRID SAFETY CHECKER
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-1">
                  Guarantees Building + EV Load &le; Grid Limit (50 kW) under all stress perturbations.
                </p>
                <div className="text-[10px] bg-slate-900 p-1.5 rounded text-emerald-400 border border-slate-800">
                  Overload Prevention: Clamps EV allocation
                </div>
              </div>

              {/* Engine 3 */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                  <Sun className="w-3.5 h-3.5" />
                  RENEWABLE OPTIMIZER
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-1">
                  Absorbs rooftop solar surplus before importing from utility grid.
                </p>
                <div className="text-[10px] bg-slate-900 p-1.5 rounded text-amber-300 border border-slate-800">
                  Surplus = Solar Gen &minus; Building Demand
                </div>
              </div>

              {/* Engine 4 */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold mb-1">
                  <Cpu className="w-3.5 h-3.5" />
                  POWER ALLOCATOR
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-1">
                  Iterative proportional water-filling with fairness dampener and anti-starvation boost.
                </p>
                <div className="text-[10px] bg-slate-900 p-1.5 rounded text-sky-300 border border-slate-800">
                  Cluster Sub-kW Distribution
                </div>
              </div>
            </div>
          </div>

          {/* DOWN ARROW */}
          <div className="flex justify-center -my-2 text-cyan-400 font-bold">
            <span className="bg-slate-900 px-3 py-1 rounded-full border border-cyan-500/30 text-xs">
              &darr; DISPATCHED TO PHYSICAL BAYS &amp; UI &darr;
            </span>
          </div>

          {/* LEVEL 3: PHYSICAL OUTPUTS & DASHBOARD */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-emerald-400 font-bold tracking-wider">
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                3. PHYSICAL DISPATCH &amp; REAL-TIME COMMAND CENTER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                Sub-Second Telemetry
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">MODULATED EV CHARGING ALLOCATION</span>
                <p className="text-[11px] text-slate-400">
                  Individual PWM / OCPP 2.0.1 charging rate setpoints broadcast to EV-01, EV-02, EV-03, EV-04...
                  Dynamic throttling adapts instantly when building HVAC or lifts cycle.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">COMMAND CENTER INTERFACES</span>
                <p className="text-[11px] text-slate-400">
                  Animated SVG Power Flow Vector Engine, Explainable Decision Auditing, What-If Grid Stress Simulator,
                  and Supabase PostgreSQL cloud sync logging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
