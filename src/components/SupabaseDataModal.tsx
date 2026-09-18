import React, { useState } from 'react';
import { X, Database, Table, Code, CheckCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { supabaseService, SUPABASE_SQL_SCHEMA } from '../services/supabaseService';
import { EVVehicle, GridState } from '../types';

interface SupabaseDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: EVVehicle[];
  gridState: GridState;
}

export const SupabaseDataModal: React.FC<SupabaseDataModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  gridState,
}) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'SQL_SCHEMA' | 'DECISION_LOGS'>('TABLES');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const recentDecisions = supabaseService.getRecentDecisions(15);
  const recentTelemetry = supabaseService.getRecentTelemetry(10);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                  SUPABASE POSTGRESQL DATA MODEL &amp; TELEMETRY DB
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED (MOCK / CLOUD SYNC READY)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                PERSISTENCE LAYER &bull; TABLES: EV_VEHICLES, GRID_TELEMETRY, ALLOCATION_DECISIONS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('TABLES')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'TABLES'
                ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Live Tables Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('DECISION_LOGS')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'DECISION_LOGS'
                ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Audit Decision Records ({recentDecisions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SQL_SCHEMA')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'SQL_SCHEMA'
                ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Production SQL DDL</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto text-xs font-mono">
          {activeTab === 'TABLES' && (
            <div className="flex flex-col gap-5">
              {/* Table 1: ev_vehicles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">Table: public.ev_vehicles ({vehicles.length} rows)</span>
                  <span className="text-[10px] text-slate-500">Auto-synchronized</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="p-2">id</th>
                        <th className="p-2">model</th>
                        <th className="p-2">battery_soc</th>
                        <th className="p-2">capacity_kwh</th>
                        <th className="p-2">target_soc</th>
                        <th className="p-2">max_rate_kw</th>
                        <th className="p-2">current_rate_kw</th>
                        <th className="p-2">departure</th>
                        <th className="p-2">priority_score</th>
                        <th className="p-2">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-900/40 text-slate-300">
                          <td className="p-2 font-bold text-cyan-300">{v.id}</td>
                          <td className="p-2 text-slate-400">{v.model}</td>
                          <td className="p-2">{Math.round(v.batterySoc)}%</td>
                          <td className="p-2">{v.batteryCapacityKwh}</td>
                          <td className="p-2">{v.targetSoc}%</td>
                          <td className="p-2">{v.maxChargingRateKw} kW</td>
                          <td className="p-2 font-bold text-emerald-400">{v.currentChargingRateKw.toFixed(1)} kW</td>
                          <td className="p-2 text-amber-300">{v.departureTime}</td>
                          <td className="p-2 font-bold text-cyan-400">{v.priorityScore}</td>
                          <td className="p-2">{v.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Telemetry Snapshot */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">Table: public.grid_telemetry (Recent Snapshots)</span>
                  <span className="text-[10px] text-slate-500">Continuous buffer</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="p-2">timestamp</th>
                        <th className="p-2">grid_limit_kw</th>
                        <th className="p-2">building_demand_kw</th>
                        <th className="p-2">solar_gen_kw</th>
                        <th className="p-2">ev_cluster_kw</th>
                        <th className="p-2">available_kw</th>
                        <th className="p-2">system_status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr className="bg-emerald-950/20 text-slate-300 font-bold">
                        <td className="p-2 text-emerald-400">LIVE CURRENT</td>
                        <td className="p-2">{gridState.gridLimitKw}</td>
                        <td className="p-2 text-sky-300">{gridState.buildingDemandKw.toFixed(1)}</td>
                        <td className="p-2 text-amber-300">{gridState.solarGenerationKw.toFixed(1)}</td>
                        <td className="p-2 text-cyan-300">{gridState.evChargingLoadKw.toFixed(1)}</td>
                        <td className="p-2 text-indigo-300">{gridState.availableChargingCapacityKw.toFixed(1)}</td>
                        <td className="p-2 text-emerald-400">{gridState.systemStatus}</td>
                      </tr>
                      {recentTelemetry.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-900/40 text-slate-400">
                          <td className="p-2">{t.timestamp}</td>
                          <td className="p-2">{t.grid_limit_kw}</td>
                          <td className="p-2">{t.building_demand_kw.toFixed(1)}</td>
                          <td className="p-2">{t.solar_generation_kw.toFixed(1)}</td>
                          <td className="p-2">{t.ev_charging_load_kw.toFixed(1)}</td>
                          <td className="p-2">{t.available_capacity_kw.toFixed(1)}</td>
                          <td className="p-2">{t.system_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DECISION_LOGS' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Autonomous Dispatch Audit Trail (Explainable AI Decoupled Records)</span>
                <span>{recentDecisions.length} Recent Logged Decisions</span>
              </div>
              <div className="space-y-2">
                {recentDecisions.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-500">
                    No decisions recorded yet. Simulation will populate audit trail automatically.
                  </div>
                ) : (
                  recentDecisions.map((dec) => (
                    <div key={dec.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">
                          {dec.ev_id} &rarr; {dec.allocated_kw.toFixed(1)} kW
                        </span>
                        <span className="text-[10px] text-slate-500">{dec.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{dec.explanation}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <span>Battery: {dec.battery_soc}%</span>
                        <span>Departure: {dec.departure_time}</span>
                        <span>Priority Score: {dec.priority_score}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'SQL_SCHEMA' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Production Supabase PostgreSQL Migration Script</span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 transition-colors text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
