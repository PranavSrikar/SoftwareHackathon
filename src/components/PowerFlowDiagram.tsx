import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Sun, 
  Building2, 
  BatteryCharging, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Flame,
  RotateCcw,
  Sliders,
  Cpu,
  TrendingDown,
  Info
} from 'lucide-react';
import { GridState, EVVehicle } from '../types';

interface PowerFlowDiagramProps {
  gridState: GridState;
  vehicles: EVVehicle[];
  onTriggerGridStress?: () => void;
  onResetNormal?: () => void;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({ 
  gridState,
  vehicles,
  onTriggerGridStress,
  onResetNormal
}) => {
  // Step State for What-If Grid Stress Demonstration:
  // 0 = Normal live baseline (telemetry from props)
  // 1 = Step 1: Normal Grid State (30 kW bldg, Active Solar serving whatever it is serving, 22 kW EV)
  // 2 = Step 2: Demand Surge (30 -> 48 kW bldg, Solar STILL SERVING active generation, Grid passes 50 kW)
  // 3 = Step 3: Overload Observed & Solar Stopped (System detects overload -> Solar supply stopped to 0 kW, Grid hits 70 kW peak)
  // 4 = Step 4: Dispatch Analysis (48 kW locked bldg, 22 kW flexible EV identified for 20 kW reduction)
  // 5 = Step 5: EV Charging Throttling (22 kW -> 2 kW animated curtailment)
  // 6 = Step 6: Grid Restored to Safe Envelope (48 + 2 = 50 kW, SAFE ✓)
  const [activeStep, setActiveStep] = useState<number>(
    gridState.activeScenario === 'GRID_STRESS' ? 6 : 0
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [capturedSolarKw, setCapturedSolarKw] = useState<number>(
    gridState.solarGenerationKw > 0 ? gridState.solarGenerationKw : 14.0
  );
  const [simSolarKw, setSimSolarKw] = useState<number>(
    gridState.solarGenerationKw > 0 ? gridState.solarGenerationKw : 14.0
  );
  const [throttlingEvKw, setThrottlingEvKw] = useState<number>(22.0);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Sync with external scenario changes (e.g. from Header or other triggers)
  useEffect(() => {
    if (gridState.activeScenario === 'GRID_STRESS' && activeStep === 0) {
      handleSimulateGridStress();
    } else if (gridState.activeScenario === 'NORMAL' && activeStep !== 0) {
      clearAllTimers();
      setIsAutoPlaying(false);
      setActiveStep(0);
      setThrottlingEvKw(22.0);
      const liveSolar = gridState.solarGenerationKw > 0 ? gridState.solarGenerationKw : 14.0;
      setCapturedSolarKw(liveSolar);
      setSimSolarKw(liveSolar);
    }
  }, [gridState.activeScenario]);

  // Automated step-by-step progression handler
  const handleSimulateGridStress = () => {
    clearAllTimers();
    setIsAutoPlaying(true);
    setThrottlingEvKw(22.0);

    // Capture whatever solar power was serving at that exact moment
    const liveSolar = gridState.solarGenerationKw > 0 ? gridState.solarGenerationKw : 14.0;
    setCapturedSolarKw(liveSolar);
    setSimSolarKw(liveSolar);

    // STEP 1: Normal Grid State with Active Solar (0ms - 1500ms)
    setActiveStep(1);

    // STEP 2: Demand Surge (1500ms - 3200ms) - Solar is STILL serving whatever it was serving!
    const t2 = setTimeout(() => {
      setActiveStep(2);
      setSimSolarKw(liveSolar);
    }, 1500);

    // STEP 3: Overload Observed -> Solar supply is stopped & drops to 0.0 kW (3200ms - 5000ms)
    const t3 = setTimeout(() => {
      setActiveStep(3);
      // Smooth decay of solar power to 0
      const sTick1 = setTimeout(() => setSimSolarKw(Number((liveSolar * 0.5).toFixed(1))), 250);
      const sTick2 = setTimeout(() => setSimSolarKw(Number((liveSolar * 0.15).toFixed(1))), 500);
      const sTick3 = setTimeout(() => setSimSolarKw(0.0), 750);
      timerRefs.current.push(sTick1, sTick2, sTick3);
    }, 3200);

    // STEP 4: System Analyzes Capacity & Identifies Flexible EV Load (5000ms - 6600ms)
    const t4 = setTimeout(() => {
      setActiveStep(4);
      setSimSolarKw(0.0);
    }, 5000);

    // STEP 5: EV Charging Throttling with active numeric decay (6600ms - 8400ms)
    const t5 = setTimeout(() => {
      setActiveStep(5);
      setSimSolarKw(0.0);
      const tick1 = setTimeout(() => setThrottlingEvKw(18.0), 300);
      const tick2 = setTimeout(() => setThrottlingEvKw(12.0), 600);
      const tick3 = setTimeout(() => setThrottlingEvKw(7.0), 900);
      const tick4 = setTimeout(() => setThrottlingEvKw(4.0), 1200);
      const tick5 = setTimeout(() => setThrottlingEvKw(2.0), 1500);
      timerRefs.current.push(tick1, tick2, tick3, tick4, tick5);
    }, 6600);

    // STEP 6: Safe Clamped Envelope (8400ms onwards)
    const t6 = setTimeout(() => {
      setActiveStep(6);
      setSimSolarKw(0.0);
      setThrottlingEvKw(2.0);
      setIsAutoPlaying(false);
      if (onTriggerGridStress) {
        onTriggerGridStress();
      }
    }, 8400);

    timerRefs.current.push(t2, t3, t4, t5, t6);
  };

  // Manual step jump handler for judges & users to freeze/inspect
  const handleSelectStep = (stepNumber: number) => {
    clearAllTimers();
    setIsAutoPlaying(false);
    setActiveStep(stepNumber);
    const liveSolar = capturedSolarKw > 0 ? capturedSolarKw : (gridState.solarGenerationKw > 0 ? gridState.solarGenerationKw : 14.0);

    if (stepNumber === 1 || stepNumber === 2) {
      setSimSolarKw(liveSolar);
      setThrottlingEvKw(22.0);
    } else if (stepNumber === 3) {
      setSimSolarKw(0.0);
      setThrottlingEvKw(22.0);
    } else if (stepNumber === 4) {
      setSimSolarKw(0.0);
      setThrottlingEvKw(22.0);
    } else if (stepNumber === 5) {
      setSimSolarKw(0.0);
      setThrottlingEvKw(8.0);
    } else if (stepNumber === 6) {
      setSimSolarKw(0.0);
      setThrottlingEvKw(2.0);
      if (onTriggerGridStress) onTriggerGridStress();
    }
  };

  const handleResetToNormal = () => {
    clearAllTimers();
    setIsAutoPlaying(false);
    setActiveStep(0);
    setThrottlingEvKw(22.0);
    const liveSolar = gridState.solarGenerationKw > 0 ? gridState.solarGenerationKw : 14.0;
    setCapturedSolarKw(liveSolar);
    setSimSolarKw(liveSolar);
    if (onResetNormal) {
      onResetNormal();
    }
  };

  // Derive dynamic power values based on active simulation step or live baseline
  let buildingLoad = gridState.buildingDemandKw;
  let solarGen = gridState.solarGenerationKw;
  let evClusterLoad = gridState.evChargingLoadKw;
  let totalGridImport = Math.max(0, buildingLoad + evClusterLoad - solarGen);
  let isOverload = false;
  let isThrottling = false;
  let isSafe = true;

  if (activeStep === 0) {
    // Live Baseline mode
    solarGen = gridState.solarGenerationKw;
    totalGridImport = Math.max(0, buildingLoad + evClusterLoad - solarGen);
    isOverload = totalGridImport > gridState.gridLimitKw;
    isSafe = !isOverload;
  } else if (activeStep === 1) {
    // Step 1: Normal Grid State - Solar active serving whatever it is serving
    buildingLoad = 30.0;
    solarGen = simSolarKw;
    evClusterLoad = 22.0;
    totalGridImport = Math.max(0, buildingLoad + evClusterLoad - solarGen);
    isOverload = totalGridImport > 50.0;
    isSafe = !isOverload;
  } else if (activeStep === 2) {
    // Step 2: Building demand surges 30 -> 48 kW, Solar is STILL serving!
    buildingLoad = 48.0;
    solarGen = simSolarKw;
    evClusterLoad = 22.0;
    totalGridImport = Math.max(0, buildingLoad + evClusterLoad - solarGen);
    isOverload = totalGridImport > 50.0;
    isSafe = false;
  } else if (activeStep === 3) {
    // Step 3: Overload observed -> Solar power supply is stopped -> 0.0 kW
    buildingLoad = 48.0;
    solarGen = simSolarKw; // decays smoothly to 0.0
    evClusterLoad = 22.0;
    totalGridImport = Math.max(0, buildingLoad + evClusterLoad - solarGen);
    isOverload = true;
    isSafe = false;
  } else if (activeStep === 4) {
    // Step 4: System analyzes capacity & flexible EV load (Solar = 0 kW)
    buildingLoad = 48.0;
    solarGen = 0.0;
    evClusterLoad = 22.0;
    totalGridImport = 70.0;
    isOverload = true;
    isSafe = false;
  } else if (activeStep === 5) {
    // Step 5: EV Charging is actively throttled (Solar = 0 kW)
    buildingLoad = 48.0;
    solarGen = 0.0;
    evClusterLoad = throttlingEvKw;
    totalGridImport = 48.0 + throttlingEvKw;
    isThrottling = true;
    isOverload = totalGridImport > 50.0;
    isSafe = totalGridImport <= 50.0;
  } else if (activeStep === 6) {
    // Step 6: Grid safe state (48 + 2 = 50 kW, Solar = 0 kW)
    buildingLoad = 48.0;
    solarGen = 0.0;
    evClusterLoad = 2.0;
    totalGridImport = 50.0;
    isOverload = false;
    isSafe = true;
  }

  // Visual helper functions for SVG flow lines
  const getLineWidth = (kw: number) => Math.max(2, Math.min(8, Math.round(2 + (kw / 45) * 5)));
  const getAnimSpeed = (kw: number) => {
    if (kw <= 0.1) return 'none';
    const duration = Math.max(0.4, 2.5 - (kw / 45) * 1.6);
    return `${duration.toFixed(2)}s`;
  };

  // 6 Workflow Steps Metadata
  const workflowSteps = [
    {
      step: 1,
      title: 'Normal Grid',
      subtitle: `30 kW • ${capturedSolarKw.toFixed(0)} kW Solar`,
      badge: 'NORMAL',
      desc: `Baseline state: Solar serves ${capturedSolarKw.toFixed(1)} kW actively.`,
      color: 'cyan',
    },
    {
      step: 2,
      title: 'Demand Surge',
      subtitle: `30 → 48 kW (Solar Active)`,
      badge: 'SURGE',
      desc: `Building surges to 48 kW; Solar still serving ${capturedSolarKw.toFixed(1)} kW.`,
      color: 'amber',
    },
    {
      step: 3,
      title: 'Solar Stopped',
      subtitle: `Solar → 0 kW (70 kW Peak)`,
      badge: 'SOLAR STOPPED',
      desc: 'Overload observed; Solar stopped, causing 70 kW peak.',
      color: 'rose',
    },
    {
      step: 4,
      title: 'Dispatch Analysis',
      subtitle: '48 kW Lock • EV Flex',
      badge: 'ANALYZING',
      desc: 'Smart Dispatch identifies EV load for 20 kW reduction.',
      color: 'amber',
    },
    {
      step: 5,
      title: 'EV Throttled',
      subtitle: '22 kW → 2 kW (-20 kW)',
      badge: 'THROTTLING',
      desc: 'Modulates EV cluster down to 2 kW available headroom.',
      color: 'amber',
    },
    {
      step: 6,
      title: 'Safe Envelope',
      subtitle: '48 + 2 = 50 kW (SAFE)',
      badge: 'SAFE ✓',
      desc: 'Feeder strictly clamped at 50 kW safe limit.',
      color: 'emerald',
    },
  ];

  return (
    <div
      id="power-flow-card"
      className="p-4 sm:p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col gap-6"
    >
      {/* 1. Header with Standout Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-700/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>REAL-TIME POWER FLOW SYSTEM</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/40">
                ENERGY FLOW SUBSECTION
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              SIDE-BY-SIDE SIMULATION CONTROLLER &amp; DYNAMIC MULTI-BUS ENERGY ROUTING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOverload ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black bg-rose-950 border-2 border-rose-500 text-rose-300 animate-pulse shadow-lg shadow-rose-950/60">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              {activeStep === 2 ? `${totalGridImport.toFixed(1)} kW OVERLOAD (SOLAR ACTIVE)` : '70 kW OVERLOAD (SOLAR STOPPED)'}
            </span>
          ) : isThrottling ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black bg-amber-950 border-2 border-amber-500 text-amber-300 animate-pulse shadow-lg shadow-amber-950/60">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              EV LOAD REDUCING (-20 kW)
            </span>
          ) : activeStep === 6 ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-black bg-emerald-950 border-2 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-950/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              50 kW ENVELOPE SECURED (SAFE ✓)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              AUTONOMOUS DISPATCH READY
            </span>
          )}
        </div>
      </div>

      {/* 2. SIDE-BY-SIDE 2-COMPONENT CONTAINER: COMPONENT 1 (SIMULATOR) & COMPONENT 2 (POWER FLOW DIAGRAM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ========================================================================= */}
        {/* COMPONENT 1 (LEFT): WHAT-IF GRID STRESS SIMULATOR & STEP CONTROLLER */}
        {/* ========================================================================= */}
        <div 
          id="judge-what-if-simulator-box"
          className={`lg:col-span-6 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between gap-4 ${
            isOverload
              ? 'bg-rose-950/25 border-rose-500 shadow-2xl shadow-rose-950/60 ring-2 ring-rose-500/30'
              : isThrottling
              ? 'bg-amber-950/25 border-amber-500 shadow-2xl shadow-amber-950/60 ring-2 ring-amber-500/30'
              : activeStep === 6
              ? 'bg-emerald-950/25 border-emerald-400 shadow-2xl shadow-emerald-950/50 ring-2 ring-emerald-400/30'
              : 'bg-slate-950 border-slate-700'
          }`}
        >
          {/* Title & Action Buttons */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950">
                    WHAT-IF SIMULATOR
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">
                    [Surge &rarr; Solar Cut &rarr; 70 kW &rarr; 50 kW]
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Observe active solar serving load initially, then stopping upon observing overload &rarr; autonomous EV throttling to 50 kW safe envelope.
                </p>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-simulate-grid-stress"
                  onClick={handleSimulateGridStress}
                  disabled={isAutoPlaying}
                  className={`px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
                    isAutoPlaying
                      ? 'bg-slate-800 text-slate-400 cursor-wait'
                      : 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-rose-500/30 hover:scale-[1.02]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-slate-950 fill-slate-950 animate-pulse" />
                  <span>{isAutoPlaying ? 'SIMULATING...' : '🚨 SIMULATE STRESS'}</span>
                </button>

                <button
                  id="btn-reset-baseline"
                  onClick={handleResetToNormal}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 flex items-center gap-1.5 transition-all hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 6 Step Cards Grid (2x3 or 3x2) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  6-STEP CONTROL LOOP TIMELINE:
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Click step to freeze
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {workflowSteps.map((meta) => {
                  const isCurrent = activeStep === meta.step;
                  const isPast = activeStep > meta.step;

                  return (
                    <button
                      key={meta.step}
                      type="button"
                      onClick={() => handleSelectStep(meta.step)}
                      className={`p-2 rounded-xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isCurrent
                          ? meta.color === 'rose'
                            ? 'bg-rose-950/90 border-rose-500 shadow-lg shadow-rose-950/70 ring-2 ring-rose-500/50 scale-[1.02]'
                            : meta.color === 'amber'
                            ? 'bg-amber-950/90 border-amber-500 shadow-lg shadow-amber-950/70 ring-2 ring-amber-500/50 scale-[1.02]'
                            : meta.color === 'cyan'
                            ? 'bg-cyan-950/90 border-cyan-400 shadow-lg shadow-cyan-950/70 ring-2 ring-cyan-400/50 scale-[1.02]'
                            : 'bg-emerald-950/90 border-emerald-400 shadow-lg shadow-emerald-950/70 ring-2 ring-emerald-400/50 scale-[1.02]'
                          : isPast
                          ? 'bg-slate-950 border-slate-700 opacity-90 hover:border-slate-500'
                          : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1 py-0.5 rounded ${
                          isCurrent
                            ? 'bg-white text-slate-950'
                            : isPast
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-900 text-slate-500'
                        }`}>
                          S{meta.step}
                        </span>

                        {isCurrent ? (
                          <span className="flex items-center gap-0.5 text-[8px] font-mono font-black text-amber-300 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            LIVE
                          </span>
                        ) : isPast ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : null}
                      </div>

                      <div>
                        <h6 className="text-[11px] font-black text-white leading-tight">
                          {meta.title}
                        </h6>
                        <div className={`text-[10px] font-mono font-bold ${
                          isCurrent
                            ? meta.color === 'rose'
                              ? 'text-rose-300'
                              : meta.color === 'amber'
                              ? 'text-amber-300'
                              : meta.color === 'cyan'
                              ? 'text-cyan-300'
                              : 'text-emerald-300'
                            : 'text-slate-400'
                        }`}>
                          {meta.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Live Explanation Callout */}
            <div className={`p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
              isOverload
                ? 'bg-rose-950/70 border-rose-500 text-rose-100'
                : isThrottling
                ? 'bg-amber-950/70 border-amber-500 text-amber-100'
                : activeStep === 6
                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}>
              <div className="shrink-0 mt-0.5">
                {isOverload ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                ) : isThrottling ? (
                  <TrendingDown className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : activeStep === 6 ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Info className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div className="text-xs">
                <span className="font-mono font-black uppercase text-[10px] block">
                  {activeStep === 0 && 'LIVE BASELINE TELEMETRY'}
                  {activeStep === 1 && `STEP 1: NORMAL BASELINE (30 kW BLDG, ${capturedSolarKw.toFixed(1)} kW SOLAR, 22 kW EV)`}
                  {activeStep === 2 && `STEP 2: DEMAND SURGE (30 → 48 kW, SOLAR STILL ACTIVE AT ${capturedSolarKw.toFixed(1)} kW)`}
                  {activeStep === 3 && 'STEP 3: OVERLOAD OBSERVED → SOLAR SUPPLY STOPPED (SOLAR → 0.0 kW, 70 kW PEAK)'}
                  {activeStep === 4 && 'STEP 4: SMART DISPATCH ANALYZES AVAILABLE CAPACITY (0 kW SOLAR)'}
                  {activeStep === 5 && 'STEP 5: AUTONOMOUS EV CHARGING THROTTLING'}
                  {activeStep === 6 && 'STEP 6: GRID RESTORED TO SAFE ENVELOPE (50 kW LIMIT ✓)'}
                </span>
                <p className="text-[11px] leading-snug mt-0.5 text-slate-300">
                  {activeStep === 0 && 'System operating normally with live building demand and active solar generation.'}
                  {activeStep === 1 && `Initial steady state: Building draws 30.0 kW, Solar PV actively serves ${capturedSolarKw.toFixed(1)} kW, and EV cluster draws 22.0 kW (Net Grid Import: ${totalGridImport.toFixed(1)} kW ≤ 50 kW safe limit).`}
                  {activeStep === 2 && `Building surges to 48.0 kW. Solar is STILL actively generating ${capturedSolarKw.toFixed(1)} kW. Net grid draw rises to ${totalGridImport.toFixed(1)} kW, exceeding the 50 kW feeder threshold.`}
                  {activeStep === 3 && 'Grid overload is observed by system safety protection: Solar power supply is safely stopped (transitioning to 0.0 kW). Total unmitigated grid demand peaks at 70.0 kW (+20 kW Overload ❌).'}
                  {activeStep === 4 && 'With Solar at 0 kW and Grid demand at 70 kW, Smart Dispatch locks Building (48 kW Critical) and flags EV Charging (22 kW Flexible) for 20 kW reduction.'}
                  {activeStep === 5 && `Smart Dispatch dynamically modulates EV cluster: ${throttlingEvKw.toFixed(1)} kW (curtailing power to match 2 kW available feeder headroom).`}
                  {activeStep === 6 && 'Grid demand strictly clamped at 50.0 kW (48 kW Building + 2 kW EV, 0 kW Solar). Overload eliminated, safe envelope secured ✓.'}
                </p>
              </div>
            </div>

            {/* Smart Dispatch Action Message */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>SMART DISPATCH ACTION</span>
                </div>
                <p className="text-[11px] font-mono text-slate-300">
                  {activeStep <= 2 
                    ? `Solar serving ${simSolarKw.toFixed(1)} kW actively. Monitoring feeder headroom.` 
                    : activeStep === 3
                    ? 'Feeder overload observed. Solar supply stopped (0 kW). Unmanaged load 70 kW.'
                    : '&ldquo;Grid exceeded. EV load identified. EV reduced by 20 kW. Restored to safe envelope.&rdquo;'}
                </p>
              </div>
              <div className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold shrink-0">
                {activeStep <= 2 ? `Solar: ${simSolarKw.toFixed(1)} kW` : '22 kW &rarr; 2 kW'}
              </div>
            </div>

            {/* Side-by-Side Before & After Comparison Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Before Card */}
              <div 
                id="judge-card-before"
                className={`p-3 rounded-xl font-mono text-xs transition-all ${
                  isOverload
                    ? 'bg-slate-950 border-2 border-rose-500 shadow-lg shadow-rose-950/80'
                    : 'bg-slate-950/70 border border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-rose-300 font-bold mb-1.5 pb-1 border-b border-rose-900/50 text-[10px]">
                  <span>BEFORE (PEAK OVERLOAD)</span>
                  <span className="px-1 rounded bg-rose-950 text-rose-300 border border-rose-800">UNMANAGED</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Building</span>
                    <span className="text-white font-bold">48 kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Solar PV</span>
                    <span className="text-rose-400 font-bold">0 kW (Stopped)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">EV Load</span>
                    <span className="text-white font-bold">22 kW</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-700 pt-1 font-bold text-rose-400">
                    <span>Grid Import</span>
                    <span>70 kW</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-rose-400 pt-0.5">
                    <span>Status</span>
                    <span className="font-bold">OVERLOAD ❌</span>
                  </div>
                </div>
              </div>

              {/* After Card */}
              <div 
                id="judge-card-after"
                className={`p-3 rounded-xl font-mono text-xs transition-all ${
                  activeStep === 6 || isSafe
                    ? 'bg-slate-950 border-2 border-emerald-400 shadow-lg shadow-emerald-950/80'
                    : 'bg-slate-950/70 border border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-300 font-bold mb-1.5 pb-1 border-b border-emerald-900/50 text-[10px]">
                  <span>AFTER (DISPATCHED)</span>
                  <span className="px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">AUTONOMOUS</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Building</span>
                    <span className="text-white font-bold">48 kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Solar PV</span>
                    <span className="text-slate-400 font-bold">0 kW (Off-peak)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">EV Load</span>
                    <span className="text-cyan-300 font-bold">2 kW</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-700 pt-1 font-bold text-emerald-400">
                    <span>Grid Import</span>
                    <span>50 kW</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-400 pt-0.5">
                    <span>Status</span>
                    <span className="font-bold">SAFE ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COMPONENT 2 (RIGHT): REAL-TIME POWER FLOW CANVAS & METRICS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          <div className="relative w-full h-[340px] sm:h-[370px] flex items-center justify-center bg-slate-950/90 rounded-2xl border-2 border-slate-800 shadow-xl overflow-hidden">
            <style>
              {`
                @keyframes dashMove {
                  to {
                    stroke-dashoffset: -40;
                  }
                }
                .flow-grid-bus {
                  stroke-dasharray: 6 6;
                  animation: dashMove 1.4s linear infinite;
                }
                .flow-solar-bus {
                  stroke-dasharray: 6 6;
                  animation: dashMove 1.2s linear infinite;
                }
                .flow-bus-building {
                  stroke-dasharray: 6 6;
                  animation: dashMove 1.3s linear infinite;
                }
                .flow-bus-ev {
                  stroke-dasharray: 6 6;
                  animation: dashMove 1.0s linear infinite;
                }
              `}
            </style>

            <svg className="w-full h-full" viewBox="0 0 600 320" fill="none">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Path 1: Grid (140, 80) -> Central Bus (300, 160) */}
              <path
                d="M 140 80 C 200 80, 220 160, 300 160"
                stroke={isOverload ? '#7f1d1d' : '#1e293b'}
                strokeWidth={Math.max(4, getLineWidth(totalGridImport) + 2)}
                fill="none"
              />
              {totalGridImport > 0 && (
                <path
                  d="M 140 80 C 200 80, 220 160, 300 160"
                  stroke={isOverload ? '#f43f5e' : (isSafe ? '#10b981' : '#06b6d4')}
                  strokeWidth={getLineWidth(totalGridImport)}
                  fill="none"
                  className="flow-grid-bus"
                  filter="url(#glow)"
                  style={{ animationDuration: getAnimSpeed(totalGridImport) }}
                />
              )}

              {/* Path 2: Solar (140, 240) -> Central Bus (300, 160) */}
              <path
                d="M 140 240 C 200 240, 220 160, 300 160"
                stroke="#1e293b"
                strokeWidth={Math.max(4, getLineWidth(solarGen) + 2)}
                fill="none"
              />
              {solarGen > 0 && (
                <path
                  d="M 140 240 C 200 240, 220 160, 300 160"
                  stroke="#10b981"
                  strokeWidth={getLineWidth(solarGen)}
                  fill="none"
                  className="flow-solar-bus"
                  filter="url(#glow)"
                  style={{ animationDuration: getAnimSpeed(solarGen) }}
                />
              )}

              {/* Path 3: Central Bus (300, 160) -> Building (460, 80) */}
              <path
                d="M 300 160 C 380 160, 400 80, 460 80"
                stroke="#1e293b"
                strokeWidth={Math.max(4, getLineWidth(buildingLoad) + 2)}
                fill="none"
              />
              {buildingLoad > 0 && (
                <path
                  d="M 300 160 C 380 160, 400 80, 460 80"
                  stroke="#38bdf8"
                  strokeWidth={getLineWidth(buildingLoad)}
                  fill="none"
                  className="flow-bus-building"
                  filter="url(#glow)"
                  style={{ animationDuration: getAnimSpeed(buildingLoad) }}
                />
              )}

              {/* Path 4: Central Bus (300, 160) -> EV Cluster (460, 240) */}
              <path
                d="M 300 160 C 380 160, 400 240, 460 240"
                stroke="#1e293b"
                strokeWidth={Math.max(4, getLineWidth(evClusterLoad) + 2)}
                fill="none"
              />
              {evClusterLoad > 0 && (
                <path
                  d="M 300 160 C 380 160, 400 240, 460 240"
                  stroke={isOverload ? '#fb7185' : (isSafe ? '#10b981' : '#06b6d4')}
                  strokeWidth={getLineWidth(evClusterLoad)}
                  fill="none"
                  className="flow-bus-ev"
                  filter="url(#glow)"
                  style={{ animationDuration: getAnimSpeed(evClusterLoad) }}
                />
              )}

              {/* CENTRAL SMART DISPATCH CONTROLLER NODE (300, 160) */}
              <circle 
                cx="300" 
                cy="160" 
                r="28" 
                fill="#090d16" 
                stroke={isOverload ? '#f43f5e' : (isSafe ? '#10b981' : '#06b6d4')} 
                strokeWidth="3" 
              />
              <circle 
                cx="300" 
                cy="160" 
                r="34" 
                fill="none" 
                stroke={isOverload ? '#f43f5e' : (isSafe ? '#10b981' : '#06b6d4')} 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                opacity="0.8" 
                className="animate-spin" 
                style={{ animationDuration: '6s' }} 
              />
              <text 
                x="300" 
                y="156" 
                textAnchor="middle" 
                fill={isOverload ? '#f43f5e' : (isSafe ? '#10b981' : '#06b6d4')} 
                fontSize="9" 
                fontWeight="black" 
                fontFamily="monospace"
              >
                {isOverload ? 'OVERLOAD' : (activeStep === 4 || activeStep === 5 ? 'THROTTLE' : 'SMART')}
              </text>
              <text 
                x="300" 
                y="169" 
                textAnchor="middle" 
                fill="#94a3b8" 
                fontSize="8" 
                fontWeight="bold" 
                fontFamily="monospace"
              >
                {isOverload ? 'ALERT ❌' : (activeStep === 6 || isSafe ? '50 kW SAFE ✓' : 'DISPATCH ✓')}
              </text>

              {/* FLOW LABELS (MIDPOINTS) */}
              <g transform="translate(195, 110)">
                <rect x="-32" y="-9" width="64" height="18" rx="4" fill="#020617" stroke={isOverload ? '#f43f5e' : (isSafe ? '#10b981' : '#06b6d4')} strokeWidth="1.5" opacity="0.95" />
                <text x="0" y="3.5" textAnchor="middle" fill={isOverload ? '#fb7185' : (isSafe ? '#34d399' : '#38bdf8')} fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {totalGridImport.toFixed(1)} kW
                </text>
              </g>

              <g transform="translate(195, 210)">
                <rect x="-32" y="-9" width="64" height="18" rx="4" fill="#020617" stroke={solarGen > 0 ? '#10b981' : '#475569'} strokeWidth="1" opacity="0.95" />
                <text x="0" y="3.5" textAnchor="middle" fill={solarGen > 0 ? '#34d399' : '#94a3b8'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                  +{solarGen.toFixed(1)} kW
                </text>
              </g>

              <g transform="translate(405, 110)">
                <rect x="-32" y="-9" width="64" height="18" rx="4" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" opacity="0.95" />
                <text x="0" y="3.5" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {buildingLoad.toFixed(1)} kW
                </text>
              </g>

              <g transform="translate(405, 210)">
                <rect x="-32" y="-9" width="64" height="18" rx="4" fill="#020617" stroke={isOverload ? '#f43f5e' : (isSafe ? '#10b981' : '#06b6d4')} strokeWidth="1.5" opacity="0.95" />
                <text x="0" y="3.5" textAnchor="middle" fill={isOverload ? '#fb7185' : (isSafe ? '#34d399' : '#22d3ee')} fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {evClusterLoad.toFixed(1)} kW
                </text>
              </g>
            </svg>

            {/* HTML OVERLAY BOXES ON SVG */}
            {/* 1. GRID NODE (TOP LEFT) */}
            <div className={`absolute top-3 left-2 sm:left-3 w-32 sm:w-36 p-2 rounded-xl bg-slate-950/95 border-2 shadow-xl ${
              isOverload ? 'border-rose-500 shadow-rose-950/60' : 'border-cyan-500/60 shadow-cyan-950/40'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[9px] font-bold flex items-center gap-1 ${isOverload ? 'text-rose-400' : 'text-cyan-400'}`}>
                  <Zap className="w-3 h-3" />
                  GRID
                </span>
                <span className="text-[8px] font-mono font-bold px-1 rounded bg-slate-900 text-slate-300">
                  50 kW MAX
                </span>
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono ${isOverload ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
                {totalGridImport.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kW In</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOverload ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`} />
                {isOverload ? 'Exceeded!' : 'Safe Feeder'}
              </div>
            </div>

            {/* 2. SOLAR PV NODE (BOTTOM LEFT) */}
            <div className={`absolute bottom-3 left-2 sm:left-3 w-32 sm:w-36 p-2 rounded-xl bg-slate-950/95 border-2 shadow-lg ${
              solarGen > 0 
                ? 'border-emerald-500/70 shadow-emerald-950/50' 
                : 'border-slate-800 shadow-slate-950/40 opacity-80'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[9px] font-bold flex items-center gap-1 ${solarGen > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <Sun className={`w-3 h-3 ${solarGen > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                  SOLAR PV
                </span>
                <span className={`text-[8px] font-mono px-1 rounded font-bold ${
                  solarGen > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400'
                }`}>
                  {solarGen > 0 ? 'SERVING' : 'STOPPED'}
                </span>
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono ${solarGen > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                {solarGen.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kW Out</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${solarGen > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                {solarGen > 0 ? `${solarGen.toFixed(1)} kW clean power` : '0 kW (Overload protection)'}
              </div>
            </div>

            {/* 3. BUILDING LOAD NODE (TOP RIGHT) */}
            <div className="absolute top-3 right-2 sm:right-3 w-32 sm:w-36 p-2 rounded-xl bg-slate-950/95 border-2 border-sky-400/80 shadow-lg shadow-sky-950/40">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold text-sky-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  BUILDING
                </span>
                <span className="text-[8px] font-mono px-1 rounded bg-sky-950 text-sky-300 font-bold">
                  CRITICAL
                </span>
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-white">
                {buildingLoad.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kW Base</span>
              </div>
              <div className="text-[9px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                HVAC &bull; Lifts
              </div>
            </div>

            {/* 4. EV CLUSTER NODE (BOTTOM RIGHT) */}
            <div className={`absolute bottom-3 right-2 sm:right-3 w-32 sm:w-36 p-2 rounded-xl bg-slate-950/95 border-2 shadow-lg ${
              isOverload ? 'border-rose-500 shadow-rose-950/50' : 'border-cyan-400/80 shadow-cyan-950/40'
            }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold text-cyan-300 flex items-center gap-1">
                  <BatteryCharging className="w-3 h-3" />
                  EV CLUSTER
                </span>
                <span className={`text-[8px] font-mono px-1 rounded font-bold ${
                  isOverload ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-200'
                }`}>
                  {isOverload ? '22 kW' : (activeStep === 6 ? '2 kW' : 'SMART')}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-cyan-300">
                {evClusterLoad.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kW</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOverload ? 'bg-rose-500' : 'bg-cyan-400 animate-pulse'}`} />
                {isOverload ? 'Unmanaged' : 'Priority Allocated'}
              </div>
            </div>
          </div>

          {/* Real-time Balancing Footnote Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-2 font-mono">
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-400 font-bold">BALANCING:</span>
              <span className="text-sky-300 font-bold">{buildingLoad.toFixed(1)} kW (Bldg)</span>
              <span>+</span>
              <span className="text-cyan-300 font-bold">{evClusterLoad.toFixed(1)} kW (EV)</span>
              {solarGen > 0 && (
                <>
                  <span>-</span>
                  <span className="text-emerald-300 font-bold">{solarGen.toFixed(1)} kW (Solar)</span>
                </>
              )}
              <span>=</span>
              <span className={`font-black ${isOverload ? 'text-rose-400' : 'text-emerald-300'}`}>
                {totalGridImport.toFixed(1)} kW Grid
              </span>
              <span className="text-slate-500">
                ({isOverload ? 'Exceeds 50 kW' : 'Within 50 kW Limit'})
              </span>
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-bold shrink-0 ${isOverload ? 'text-rose-400' : 'text-emerald-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isOverload ? 'Breaker Trip Risk!' : 'Zero Breaker Trip ✓'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
