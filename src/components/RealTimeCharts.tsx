import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Area,
} from 'recharts';
import { TrendingUp, BarChart2, Zap, Scale, Activity } from 'lucide-react';
import { TelemetryPoint, EVVehicle, GridState } from '../types';

interface RealTimeChartsProps {
  telemetryHistory: TelemetryPoint[];
  vehicles: EVVehicle[];
  gridState: GridState;
}

export const RealTimeCharts: React.FC<RealTimeChartsProps> = ({
  telemetryHistory,
  vehicles,
  gridState,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'ALLOCATION' | 'PRIORITY_VS_BATTERY'>('TELEMETRY');

  // Prepare vehicle allocation bar data
  const allocationData = vehicles.map((ev) => ({
    name: ev.id,
    allocatedKw: ev.currentChargingRateKw,
    maxKw: ev.maxChargingRateKw,
    soc: ev.batterySoc,
    priority: ev.priorityScore,
    model: ev.model,
  }));

  // Prepare priority vs battery comparison data
  const priorityComparisonData = vehicles.map((ev) => ({
    name: ev.id,
    batterySoc: Math.round(ev.batterySoc),
    priorityScore: ev.priorityScore,
    hoursLeft: Math.round(ev.departureHoursRemaining * 10) / 10,
  }));

  return (
    <section
      id="realtime-charts-section"
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col gap-4"
    >
      {/* Charts Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              CLUSTER TELEMETRY &amp; ANALYTICAL METRICS
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Real-time load behavior and allocation analysis across active charging ports.
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-chart-telemetry"
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'TELEMETRY'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Power Telemetry</span>
          </button>

          <button
            id="tab-chart-allocation"
            onClick={() => setActiveTab('ALLOCATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'ALLOCATION'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Allocation by EV</span>
          </button>

          <button
            id="tab-chart-priority"
            onClick={() => setActiveTab('PRIORITY_VS_BATTERY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'PRIORITY_VS_BATTERY'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Priority vs Battery %</span>
          </button>
        </div>
      </div>

      {/* CHART 1: Real-time Power Streams */}
      {activeTab === 'TELEMETRY' && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Rolling 60-Second Real-Time Telemetry</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-1 bg-cyan-400 inline-block rounded" /> Total Load
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2.5 h-1 bg-sky-400 inline-block rounded" /> Building
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-1 bg-emerald-400 inline-block rounded" /> EV Cluster
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-1 bg-amber-400 inline-block rounded" /> Solar
              </span>
              <span className="flex items-center gap-1 text-rose-500 font-bold">
                <span className="w-2.5 h-1 bg-rose-500 inline-block rounded" /> 50 kW Grid Limit
              </span>
            </div>
          </div>

          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis
                  stroke="#64748b"
                  domain={[0, 60]}
                  unit=" kW"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                {/* 50 kW Constant Feeder Limit Reference Line */}
                <ReferenceLine
                  y={gridState.gridLimitKw}
                  label={{
                    value: `GRID LIMIT (${gridState.gridLimitKw} kW)`,
                    fill: '#f43f5e',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    position: 'top',
                  }}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="totalLoad"
                  name="Total Grid Draw"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="buildingDemand"
                  name="Building Load"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="evChargingLoad"
                  name="EV Charging"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="solarGeneration"
                  name="Solar Generation"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: Allocation by EV */}
      {activeTab === 'ALLOCATION' && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Dynamic Power Allocation vs Maximum Vehicle Capability</span>
            <span className="text-cyan-400">Total Cluster Load: {gridState.evChargingLoadKw.toFixed(1)} kW</span>
          </div>

          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocationData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" unit=" kW" domain={[0, 15]} tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any, name: any) => [`${val} kW`, name === 'allocatedKw' ? 'Allocated Rate' : 'Charger Max Limit']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="allocatedKw" name="Allocated Power (kW)" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {allocationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.allocatedKw > 6 ? '#06b6d4' : entry.allocatedKw > 2 ? '#38bdf8' : '#64748b'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="maxKw" name="Max Port Limit (kW)" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Priority vs Battery (Departure Deadline Proof) */}
      {activeTab === 'PRIORITY_VS_BATTERY' && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Proof of Non-Linear Priority: Battery % vs Final Priority Score</span>
            <span className="text-amber-400">Departure Urgency dictates allocation</span>
          </div>

          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityComparisonData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any, name: any) => [val, name === 'batterySoc' ? 'Battery %' : 'Urgency Score (0-100)']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="batterySoc" name="Current Battery (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="priorityScore" name="Calculated Urgency Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
};
