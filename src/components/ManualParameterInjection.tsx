import React from 'react';
import { Sliders, Zap, Sun, Building2, ShieldAlert } from 'lucide-react';
import { GridState } from '../types';

interface ManualParameterInjectionProps {
  gridState: GridState;
  onUpdateBuildingLoad: (val: number) => void;
  onUpdateSolarGen: (val: number) => void;
  onUpdateGridLimit: (val: number) => void;
}

export const ManualParameterInjection: React.FC<ManualParameterInjectionProps> = ({
  gridState,
  onUpdateBuildingLoad,
  onUpdateSolarGen,
  onUpdateGridLimit,
}) => {
  return (
    <section
      id="manual-parameter-injection-section"
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col gap-4"
    >
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              MANUAL PARAMETER INJECTION (WHAT-IF CONTROLS)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                LIVE INPUTS
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Test how changing building demand, solar generation, and grid capacity affects EV charging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">System Net Draw:</span>
          <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${
            gridState.totalLoadKw > gridState.gridLimitKw
              ? 'bg-rose-950 border-rose-600 text-rose-300'
              : 'bg-slate-950 border-slate-700 text-cyan-300'
          }`}>
            {gridState.totalLoadKw.toFixed(1)} / {gridState.gridLimitKw.toFixed(1)} kW
          </span>
        </div>
      </div>

      {/* 3 Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Slider 1: Building Load */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-bold">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              Building Load:
            </span>
            <span className="font-bold text-sky-400 text-sm">{gridState.buildingDemandKw.toFixed(1)} kW</span>
          </div>
          <input
            id="slider-building-demand"
            type="range"
            min="15"
            max="52"
            step="0.5"
            value={gridState.buildingDemandKw}
            onChange={(e) => onUpdateBuildingLoad(parseFloat(e.target.value))}
            className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>15.0 kW (Night Baseline)</span>
            <span>52.0 kW (Peak HVAC)</span>
          </div>
        </div>

        {/* Slider 2: Solar Output */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-bold">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Solar Output:
            </span>
            <span className="font-bold text-amber-300 text-sm">{gridState.solarGenerationKw.toFixed(1)} kW</span>
          </div>
          <input
            id="slider-solar-gen"
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={gridState.solarGenerationKw}
            onChange={(e) => onUpdateSolarGen(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.0 kW (Night/Cloud)</span>
            <span>30.0 kW (Peak Solar)</span>
          </div>
        </div>

        {/* Slider 3: Grid Limit */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Grid Limit:
            </span>
            <span className="font-bold text-cyan-400 text-sm">{gridState.gridLimitKw.toFixed(1)} kW</span>
          </div>
          <input
            id="slider-grid-limit"
            type="range"
            min="35"
            max="75"
            step="1"
            value={gridState.gridLimitKw}
            onChange={(e) => onUpdateGridLimit(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>35.0 kW (Constrained)</span>
            <span>75.0 kW (Expanded Capacity)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
