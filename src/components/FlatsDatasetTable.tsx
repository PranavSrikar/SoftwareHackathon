import React, { useState } from 'react';
import { 
  Building2, 
  FileSpreadsheet, 
  Download, 
  Search, 
  X, 
  Check, 
  ArrowRight,
  Zap,
  Clock,
  BatteryCharging,
  Code2
} from 'lucide-react';
import { FlatRecord } from '../types';
import { exportFlatsToExcel, exportFlatsToCsv } from '../services/flatsData';

interface FlatsDatasetTableProps {
  isOpen: boolean;
  onClose: () => void;
  flats: FlatRecord[];
  activeFlatNumber: number;
  onSelectFlat: (flatNum: number) => void;
}

export const FlatsDatasetTable: React.FC<FlatsDatasetTableProps> = ({
  isOpen,
  onClose,
  flats,
  activeFlatNumber,
  onSelectFlat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Charging' | 'Idle (Plugged)' | 'Unplugged' | 'Fully Charged'>('ALL');
  const [showApiDoc, setShowApiDoc] = useState(false);

  if (!isOpen) return null;

  const filteredFlats = flats.filter((f) => {
    const matchesSearch = 
      f.flatNumber.toString().includes(searchTerm) ||
      f.flatLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[90vh] bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 shadow-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  300-Flat Resident EV Charging Dataset
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  300 Records
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Full community dataset with standardized columns. Registered for Flats 1 through 300.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Download Excel Button */}
            <button
              id="btn-modal-download-excel"
              onClick={() => exportFlatsToExcel(flats)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>

            {/* Download CSV Button */}
            <button
              id="btn-modal-download-csv"
              onClick={() => exportFlatsToCsv(flats)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
              title="Download as CSV"
            >
              CSV
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by flat number (e.g. 14), license plate, or car model..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1">Status:</span>
            {(['ALL', 'Charging', 'Idle (Plugged)', 'Unplugged', 'Fully Charged'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}

            <button
              onClick={() => setShowApiDoc(!showApiDoc)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                showApiDoc
                  ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-amber-300'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>API Docs</span>
            </button>
          </div>
        </div>

        {/* Optional API Documentation drawer */}
        {showApiDoc && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-300 flex flex-col gap-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold font-sans">
              <span>Active REST API Endpoints:</span>
              <span className="text-slate-400 font-mono text-[11px]">Base: http://localhost:3000</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">GET /api/flats</span>
                <span className="text-slate-400 text-[11px]">Returns array of all 30 flats with complete telemetry.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">GET /api/flats/:flatNumber</span>
                <span className="text-slate-400 text-[11px]">Query EV status by flat number (e.g. <code>/api/flats/1</code> to <code>/api/flats/30</code>).</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">POST /api/flats/:id/departure</span>
                <span className="text-slate-400 text-[11px]">Body <code>&#123; hoursRemaining: 1.0 &#125;</code>. Accelerates charging if earlier!</span>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-2 sm:p-5">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-700 bg-slate-950/80 text-slate-300 font-black uppercase text-[11px] tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <th className="p-3">1. Flat Number</th>
                <th className="p-3">2. Vehicle Number</th>
                <th className="p-3">3. Status</th>
                <th className="p-3">4. Current Charge</th>
                <th className="p-3">5. Charging Speed</th>
                <th className="p-3">6. Current Range</th>
                <th className="p-3">7. Departure Goal</th>
                <th className="p-3">8. Scheduled Departure</th>
                <th className="p-3">9. Priority</th>
                <th className="p-3">10. 5-Port Allocation</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredFlats.map((flat) => {
                const isActive = flat.flatNumber === activeFlatNumber;
                return (
                  <tr
                    key={flat.flatNumber}
                    onClick={() => {
                      onSelectFlat(flat.flatNumber);
                      onClose();
                    }}
                    className={`hover:bg-slate-800/80 transition-colors cursor-pointer ${
                      isActive ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400' : ''
                    }`}
                  >
                    {/* 1. Flat Number */}
                    <td className="p-3 font-extrabold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-cyan-300 flex items-center justify-center font-mono text-xs border border-slate-700">
                          {flat.flatNumber}
                        </span>
                        <span>{flat.flatLabel}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950">
                            Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Vehicle Number */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                        {flat.vehicleNumber}
                      </div>
                      <span className="block text-[11px] text-slate-400 mt-0.5 font-medium">
                        {flat.model}
                      </span>
                    </td>

                    {/* 3. Status */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          flat.status === 'Charging'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                            : flat.status === 'Fully Charged'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : flat.status === 'Idle (Plugged)'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {flat.status}
                      </span>
                    </td>

                    {/* 4. Current Charge */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              flat.currentChargePercent >= 80
                                ? 'bg-emerald-400'
                                : flat.currentChargePercent >= 40
                                ? 'bg-cyan-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${flat.currentChargePercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-white">{flat.currentCharge}</span>
                      </div>
                    </td>

                    {/* 5. Current Charging Speed */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`font-black ${flat.currentChargingSpeedKw > 0 ? 'text-cyan-300' : 'text-slate-400'}`}>
                        {flat.currentChargingSpeed}
                      </span>
                      {flat.boostedEarlier && (
                        <span className="ml-1 text-[10px] text-amber-300 font-bold bg-amber-950 px-1 py-0.5 rounded">
                          ⚡ Boosted
                        </span>
                      )}
                    </td>

                    {/* 6. Current Range */}
                    <td className="p-3 whitespace-nowrap font-medium text-slate-200">
                      {flat.currentRange}
                    </td>

                    {/* 7. Departure Goal */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        {flat.departureGoal} Target
                      </span>
                    </td>

                    {/* 8. Scheduled Departure Time */}
                    <td className="p-3 whitespace-nowrap font-medium text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{flat.scheduledDepartureTime}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        in {flat.departureHoursRemaining.toFixed(1)} hrs
                      </span>
                    </td>

                    {/* 9. Priority */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          flat.priorityLevel === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                            : flat.priorityLevel === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                            : flat.priorityLevel === 'MEDIUM'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {flat.priority || 'P4 - LOW'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        Score: {flat.priorityScore ?? 30}/100
                      </span>
                    </td>

                    {/* 10. 5-Port Allocation & Wait Time */}
                    <td className="p-3 whitespace-nowrap">
                      {flat.assignedPort ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-black text-xs">
                            Port #{flat.assignedPort} Active
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">0m wait</span>
                        </div>
                      ) : flat.status === 'Queued' ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 font-bold text-xs">
                            Queue #{flat.queuePosition ?? 1}
                          </span>
                          <span className="block text-[11px] text-amber-200 font-bold mt-0.5">
                            ~{flat.waitTimeMinutes ?? 15}m wait
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">
                          {flat.status}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFlat(flat.flatNumber);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold transition-all border border-slate-700"
                      >
                        Inspect 3D EV
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredFlats.length}</strong> of 30 registered vehicles.
          </span>
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              Columns 1-8 format compliant with Excel (.xlsx) specifications.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
