import React from 'react';
import { Gauge, Sun, Zap, BatteryCharging, Building2, ShieldAlert, TrendingUp } from 'lucide-react';
import { GridState } from '../types';

interface TopKpiAreaProps {
  gridState: GridState;
  activeEvCount: number;
}

export const TopKpiArea: React.FC<TopKpiAreaProps> = ({ gridState, activeEvCount }) => {
  // Grid load calculation: building drawn from grid + ev charging drawn from grid
  const netBuildingFromGrid = Math.max(0, gridState.buildingDemandKw - gridState.solarGenerationKw);
  const actualGridDrawKw = Math.min(
    gridState.gridLimitKw,
    Math.round((netBuildingFromGrid + gridState.evChargingLoadKw) * 10) / 10
  );
  
  const gridUsagePercent = Math.min(100, Math.round((actualGridDrawKw / gridState.gridLimitKw) * 100));
  
  // Safe color coding for grid load gauge
  let gridLoadColor = 'text-cyan-400';
  let gridProgressBg = 'bg-cyan-500';
  let gridBorder = 'border-slate-800';
  if (gridUsagePercent > 92) {
    gridLoadColor = 'text-rose-400';
    gridProgressBg = 'bg-rose-500';
    gridBorder = 'border-rose-900/60 ring-1 ring-rose-500/30';
  } else if (gridUsagePercent > 75) {
    gridLoadColor = 'text-amber-400';
    gridProgressBg = 'bg-amber-500';
    gridBorder = 'border-amber-900/40';
  }

  // Renewable share of total cluster + building energy
  const totalPowerGeneratedOrImported = actualGridDrawKw + gridState.solarGenerationKw;
  const renewableSharePercent = totalPowerGeneratedOrImported > 0
    ? Math.min(100, Math.round((gridState.solarGenerationKw / totalPowerGeneratedOrImported) * 100))
    : 0;

  return (
    <section id="top-kpi-metrics-area" className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Grid Load */}
        <div
          id="kpi-grid-load"
          className={`p-3.5 rounded-xl bg-slate-900/80 border ${gridBorder} backdrop-blur-sm relative overflow-hidden transition-all duration-300 shadow-md`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              GRID LOAD
            </span>
            <span className="font-mono text-[11px] text-slate-500">{gridUsagePercent}%</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono tracking-tight ${gridLoadColor}`}>
              {actualGridDrawKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {gridState.gridLimitKw} kW</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${gridProgressBg} transition-all duration-500 rounded-full`}
              style={{ width: `${gridUsagePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {gridState.gridLimitKw - actualGridDrawKw > 0
              ? `${(gridState.gridLimitKw - actualGridDrawKw).toFixed(1)} kW margin to limit`
              : 'Limit reached (capped)'}
          </p>
        </div>

        {/* KPI 2: Building Load */}
        <div
          id="kpi-building-load"
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              BUILDING LOAD
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40">
              PRIORITY
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {gridState.buildingDemandKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">kW</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (gridState.buildingDemandKw / gridState.gridLimitKw) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Uninterruptible commercial demand
          </p>
        </div>

        {/* KPI 3: EV Charging Load */}
        <div
          id="kpi-ev-load"
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              EV CLUSTER LOAD
            </span>
            <span className="font-mono text-[11px] text-emerald-400">{activeEvCount} EVs</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {gridState.evChargingLoadKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">kW</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (gridState.evChargingLoadKw / gridState.gridLimitKw) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Smart modulated across cluster
          </p>
        </div>

        {/* KPI 4: Solar / Renewable Generation */}
        <div
          id="kpi-solar-renewable"
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              SOLAR / CLEAN
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
              {renewableSharePercent}% mix
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-300">
              {gridState.solarGenerationKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">kW</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (gridState.solarGenerationKw / 25) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {gridState.solarSurplusKw > 0
              ? `+${gridState.solarSurplusKw.toFixed(1)} kW surplus for EVs`
              : 'Directly offsetting base load'}
          </p>
        </div>

        {/* KPI 5: Available Charging Capacity */}
        <div
          id="kpi-available-capacity"
          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden shadow-md"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              AVAILABLE CAP.
            </span>
            <span className="text-[10px] text-indigo-300 font-mono">HEADROOM</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-indigo-300">
              {gridState.availableChargingCapacityKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">kW</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (gridState.availableChargingCapacityKw / gridState.gridLimitKw) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Dynamic safety buffer
          </p>
        </div>

        {/* KPI 6: Overload Prevention Status */}
        <div
          id="kpi-grid-safety-status"
          className={`p-3.5 rounded-xl bg-slate-900/80 border backdrop-blur-sm relative overflow-hidden shadow-md ${
            gridState.lastOverloadPrevention ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              GRID SAFETY
            </span>
            <span className="font-mono text-[10px] text-cyan-300">ENFORCED</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tracking-tight text-slate-100">
              {gridState.lastOverloadPrevention ? (
                <span className="text-cyan-400">-{gridState.lastOverloadPrevention.curtailedKw.toFixed(1)} kW</span>
              ) : (
                <span className="text-emerald-400">100% SECURE</span>
              )}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-cyan-400 w-full rounded-full" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">
            {gridState.lastOverloadPrevention
              ? `Curtailed vs 70kW peak`
              : `Transformer 60 kVA max`}
          </p>
        </div>
      </div>
    </section>
  );
};
