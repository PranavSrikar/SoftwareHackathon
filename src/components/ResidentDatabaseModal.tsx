import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Phone, 
  ShieldCheck, 
  Edit3, 
  Check, 
  Download, 
  User, 
  Car, 
  Zap,
  Lock
} from 'lucide-react';
import { FlatRecord } from '../types';
import { maskPhoneNumber, validatePhoneNumber, normalizePhoneNumber } from '../services/phonePrivacy';
import { updateFlatPhoneNumber, exportFlatsToExcel, exportFlatsToCsv } from '../services/flatsData';

interface ResidentDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  flats: FlatRecord[];
  onFlatUpdated?: () => void;
}

export const ResidentDatabaseModal: React.FC<ResidentDatabaseModalProps> = ({
  isOpen,
  onClose,
  flats,
  onFlatUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFlatNum, setEditingFlatNum] = useState<number | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [unmaskedFlatNum, setUnmaskedFlatNum] = useState<number | null>(null);

  if (!isOpen) return null;

  const filtered = flats.filter((f) => 
    f.flatNumber.toString().includes(searchTerm) ||
    f.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (f: FlatRecord) => {
    setEditingFlatNum(f.flatNumber);
    setPhoneInput(f.phoneNumber || '+919876504821');
    setErrorMsg('');
  };

  const handleSavePhone = (flatNum: number) => {
    if (!validatePhoneNumber(phoneInput)) {
      setErrorMsg('Invalid phone format. Please enter 10 digits or E.164 (e.g. +919876543210)');
      return;
    }
    const normalized = normalizePhoneNumber(phoneInput);
    updateFlatPhoneNumber(flatNum, normalized);
    setEditingFlatNum(null);
    setErrorMsg('');
    if (onFlatUpdated) onFlatUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  RESIDENT PHONE DATABASE
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                  PRIVACY MASKED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                30 RESIDENTIAL FLATS &bull; AUTOMATIC SMS / WHATSAPP DISPATCH ENGINES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportFlatsToExcel(flats)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Flat #, Vehicle #, or Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Showing: <strong className="text-white">{filtered.length}</strong> / {flats.length} Records</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-3 font-bold">FLAT #</th>
                  <th className="pb-3 font-bold">VEHICLE #</th>
                  <th className="pb-3 font-bold">MODEL</th>
                  <th className="pb-3 font-bold">STATUS</th>
                  <th className="pb-3 font-bold">PHONE NUMBER (PRIVACY ENFORCED)</th>
                  <th className="pb-3 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((f) => {
                  const isEditing = editingFlatNum === f.flatNumber;
                  const isUnmasked = unmaskedFlatNum === f.flatNumber;
                  const masked = maskPhoneNumber(f.phoneNumber);

                  return (
                    <tr key={f.flatNumber} className="hover:bg-slate-900/60 transition-all">
                      <td className="py-3 font-bold text-cyan-300">
                        {f.flatLabel}
                      </td>
                      <td className="py-3 text-slate-200">
                        {f.vehicleNumber}
                      </td>
                      <td className="py-3 text-slate-300">
                        {f.model}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          f.status === 'Charging' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                          f.status === 'Queued' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                          'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-cyan-500 rounded text-cyan-300 font-bold outline-none"
                              placeholder="+919876543210"
                            />
                            {errorMsg && <span className="text-[10px] text-rose-400">{errorMsg}</span>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">
                              {isUnmasked ? (f.phoneNumber || '+919876504821') : masked}
                            </span>
                            <button
                              onClick={() => setUnmaskedFlatNum(isUnmasked ? null : f.flatNumber)}
                              className="p-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px]"
                              title={isUnmasked ? 'Mask number' : 'Click to unmask with authorization'}
                            >
                              <Lock className="w-3 h-3 text-amber-400" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => handleSavePhone(f.flatNumber)}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400 transition-all"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(f)}
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all"
                            title="Edit Phone Number"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Phone numbers are encrypted in storage & masked across all public UI tables.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white"
          >
            Close Database View
          </button>
        </div>
      </div>
    </div>
  );
};
