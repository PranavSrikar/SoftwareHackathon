import React, { useState } from 'react';
import { X, Car, Plus, Clock, Battery, Zap } from 'lucide-react';
import { EVVehicle } from '../types';

interface AddEvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (newVehicle: EVVehicle) => void;
  nextIndex: number;
}

export const AddEvModal: React.FC<AddEvModalProps> = ({
  isOpen,
  onClose,
  onAddVehicle,
  nextIndex,
}) => {
  const defaultId = `PORT-0${nextIndex}`;
  const [id, setId] = useState(defaultId);
  const [model, setModel] = useState('Porsche Taycan 4S');
  const [batterySoc, setBatterySoc] = useState(25);
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(84);
  const [targetSoc, setTargetSoc] = useState(90);
  const [maxChargingRateKw, setMaxChargingRateKw] = useState(11);
  const [departureHoursRemaining, setDepartureHoursRemaining] = useState(2.0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Format departure time string (e.g. current hour + hoursRemaining)
    const now = new Date();
    now.setMinutes(now.getMinutes() + Math.round(departureHoursRemaining * 60));
    const departureTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const requiredKwh = Math.max(0, (batteryCapacityKwh * (targetSoc - batterySoc)) / 100);

    const newEv: EVVehicle = {
      id: id.trim() || `PORT-${Date.now().toString().slice(-2)}`,
      model: model.trim() || 'Generic EV',
      batterySoc: Math.max(0, Math.min(100, batterySoc)),
      batteryCapacityKwh: Math.max(10, batteryCapacityKwh),
      targetSoc: Math.max(batterySoc + 5, Math.min(100, targetSoc)),
      maxChargingRateKw: Math.max(3.6, maxChargingRateKw),
      currentChargingRateKw: 0,
      departureTime: departureTimeStr,
      departureHoursRemaining: Math.max(0.5, departureHoursRemaining),
      requiredEnergyKwh: requiredKwh,
      priorityScore: 75,
      priorityLevel: 'HIGH',
      isConnected: true,
      status: 'CHARGING',
      consecutiveHighChargingMinutes: 0,
      totalChargedKwh: 0,
      fairnessFactor: 1.0,
      arrivalOrder: nextIndex,
    };

    onAddVehicle(newEv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                CONNECT NEW EV TO CHARGING PORT
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Assign vehicle to charging port with automated priority dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs font-mono">
          {/* Port ID & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Port Identifier</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Connected EV Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Current Battery & Target Battery */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Current SoC ({batterySoc}%)</label>
              <input
                type="range"
                min="5"
                max="95"
                value={batterySoc}
                onChange={(e) => setBatterySoc(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Target SoC ({targetSoc}%)</label>
              <input
                type="range"
                min="50"
                max="100"
                value={targetSoc}
                onChange={(e) => setTargetSoc(parseInt(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Battery Pack & Max Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Pack Size (kWh)</label>
              <input
                type="number"
                min="20"
                max="120"
                value={batteryCapacityKwh}
                onChange={(e) => setBatteryCapacityKwh(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Max Port Limit (kW)</label>
              <select
                value={maxChargingRateKw}
                onChange={(e) => setMaxChargingRateKw(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="6.6">6.6 kW (Standard AC)</option>
                <option value="7.4">7.4 kW (32A Single)</option>
                <option value="11.0">11.0 kW (16A 3-Phase)</option>
                <option value="22.0">22.0 kW (32A 3-Phase)</option>
              </select>
            </div>
          </div>

          {/* Departure Hours Remaining */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400">Departure Deadline</label>
              <span className="text-amber-300 font-bold">{departureHoursRemaining.toFixed(1)} hours from now</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12"
              step="0.5"
              value={departureHoursRemaining}
              onChange={(e) => setDepartureHoursRemaining(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>30 mins (Critical)</span>
              <span>12 hours (Overnight)</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono tracking-wider shadow-lg shadow-cyan-500/20"
            >
              CONNECT EV &amp; DISPATCH
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
