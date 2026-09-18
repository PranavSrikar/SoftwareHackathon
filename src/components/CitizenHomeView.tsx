import React, { useState, useEffect } from 'react';
import { 
  Zap, 
} from 'lucide-react';
import { EVVehicle, GridState, PriorityBreakdown, ScenarioType, FlatRecord } from '../types';
import { ViewMode } from './Header';
import { ResidentFlatLookupPanel } from './ResidentFlatLookupPanel';

import { 
  getAllFlats, 
  getFlatByNumber, 
  convertFlatToEVVehicle,
  initialFlatsDataset
} from '../services/flatsData';
import { 
  fetchFlatDetailsByNumber, 
  updateFlatDepartureTimeApi,
  updateFlatSessionApi,
  fetchFivePortSummaryApi
} from '../services/flatApiService';
import { getFivePortSummary, FivePortAllocationSummary } from '../services/chargingPortEngine';
import { FlatsDatasetTable } from './FlatsDatasetTable';

interface CitizenHomeViewProps {
  vehicles: EVVehicle[];
  selectedVehicle: EVVehicle;
  gridState: GridState;
  breakdown: PriorityBreakdown | undefined;
  activeViewMode?: ViewMode;
  onChangeViewMode?: (mode: ViewMode) => void;
  onSelectVehicle: (id: string) => void;
  onToggleConnect: (id: string) => void;
  onOpenAddModal: () => void;
  onSelectScenario: (scenario: ScenarioType) => void;
  onUpdateDepartureTime: (id: string, hoursRemaining: number) => void;
  onBoostVehicle: (id: string) => void;
}

export const CitizenHomeView: React.FC<CitizenHomeViewProps> = ({
  vehicles,
  selectedVehicle,
  gridState,
  breakdown,
  activeViewMode = 'CITIZEN',
  onChangeViewMode,
  onSelectVehicle,
  onToggleConnect,
  onOpenAddModal,
  onSelectScenario,
  onUpdateDepartureTime,
  onBoostVehicle,
}) => {
  const [showExplanationDetail, setShowExplanationDetail] = useState(false);

  // 30 Flats Dataset & API Integration State
  const [flatsList, setFlatsList] = useState<FlatRecord[]>(() => getAllFlats());
  const [activeFlatNumber, setActiveFlatNumber] = useState<number>(1);
  const [activeFlat, setActiveFlat] = useState<FlatRecord>(() => getFlatByNumber(1) || initialFlatsDataset[0]);
  const [flatInput, setFlatInput] = useState<string>('1');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [showApiInspector, setShowApiInspector] = useState<boolean>(false);
  const [apiResponseRaw, setApiResponseRaw] = useState<string | null>(null);

  // 5 Community Charging Ports & Fair Allocation State
  const [portsSummary, setPortsSummary] = useState<FivePortAllocationSummary | null>(() => getFivePortSummary(1));
  const [selectedPortId, setSelectedPortId] = useState<number>(1);
  const [batteryInput, setBatteryInput] = useState<number>(activeFlat.currentChargePercent);
  const [targetInput, setTargetInput] = useState<number>(activeFlat.departureGoalPercent);
  const [departureHoursInput, setDepartureHoursInput] = useState<number>(activeFlat.departureHoursRemaining);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [sessionSaveFeedback, setSessionSaveFeedback] = useState<string | null>(null);

  // Faster Charging on Earlier Departure State
  const [earlyDepartureBoost, setEarlyDepartureBoost] = useState<{
    active: boolean;
    boostKw: number;
    previousKw: number;
    newKw: number;
    reason: string;
  } | null>(null);
  const [customHoursInput, setCustomHoursInput] = useState<string>('');
  const [showCustomHoursBox, setShowCustomHoursBox] = useState<boolean>(false);

  // Effective displayed vehicle (derived seamlessly from the active FlatRecord)
  const effectiveVehicle: EVVehicle = activeFlat 
    ? convertFlatToEVVehicle(activeFlat) 
    : selectedVehicle;

  // Sync state whenever activeFlat changes
  useEffect(() => {
    setBatteryInput(activeFlat.currentChargePercent);
    setTargetInput(activeFlat.departureGoalPercent);
    setDepartureHoursInput(activeFlat.departureHoursRemaining);
  }, [activeFlat.flatNumber]);

  // Sync initial API lookup on mount
  useEffect(() => {
    handleLookupFlat(1, false);
  }, []);

  // Handler: Lookup Flat by number via API
  const handleLookupFlat = async (flatNum: number, triggerFeedback = true) => {
    setIsSearchingApi(true);
    setSearchFeedback(null);
    setSessionSaveFeedback(null);

    const result = await fetchFlatDetailsByNumber(flatNum);
    setIsSearchingApi(false);

    if (result.success && result.flat) {
      const flat = result.flat;
      setActiveFlat(flat);
      setActiveFlatNumber(flat.flatNumber);
      setFlatInput(flat.flatNumber.toString());
      setBatteryInput(flat.currentChargePercent);
      setTargetInput(flat.departureGoalPercent);
      setDepartureHoursInput(flat.departureHoursRemaining);
      setApiResponseRaw(JSON.stringify(result, null, 2));

      if (result.portSummary) {
        setPortsSummary(result.portSummary);
      } else {
        const summary = await fetchFivePortSummaryApi(flat.flatNumber);
        setPortsSummary(summary);
      }

      if (triggerFeedback) {
        setSearchFeedback(
          `✓ Flat ${flat.flatNumber} Found: ${flat.model} (${flat.vehicleNumber}) • Priority: ${flat.priority} • ${flat.assignedPort ? `Assigned Port ${flat.assignedPort}` : `Queued #${flat.queuePosition}`}`
        );
      }

      // Check if this vehicle is in the active vehicles list
      const matchingEv = vehicles.find((v) => v.id === `FLAT-${flat.flatNumber}`);
      if (matchingEv) {
        onSelectVehicle(matchingEv.id);
      }
    } else {
      setSearchFeedback(`⚠️ ${result.message || `Flat ${flatNum} not found in database.`}`);
    }
  };

  // Form submit for flat lookup
  const handleFlatFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseInt(flatInput.trim(), 10);
    if (isNaN(cleanNum) || cleanNum < 1 || cleanNum > 300) {
      setSearchFeedback('⚠️ Please enter a valid flat number between 1 and 300.');
      return;
    }
    handleLookupFlat(cleanNum, true);
  };

  // Handler: Update current battery, target, departure time in dataset and run Priority Algorithm
  const handleSaveAndCalculate = async (
    battery = batteryInput,
    target = targetInput,
    depHours = departureHoursInput
  ) => {
    setIsSavingSession(true);
    setSessionSaveFeedback(null);

    const prevHours = activeFlat.departureHoursRemaining;
    const isEarlier = depHours < prevHours;

    const res = await updateFlatSessionApi(
      activeFlat.flatNumber,
      battery,
      target,
      depHours
    );

    setIsSavingSession(false);

    if (res.success && res.flat) {
      setActiveFlat(res.flat);
      setFlatsList([...getAllFlats()]);
      if (res.summary) {
        setPortsSummary(res.summary);
      }
      setApiResponseRaw(JSON.stringify(res, null, 2));

      setSessionSaveFeedback(
        `✓ Updated in dataset! Calculated Priority: ${res.flat.priority} (Score: ${res.flat.priorityScore}/100). ${
          res.flat.assignedPort
            ? `Allocated to Port #${res.flat.assignedPort} (Wait time: 0m).`
            : `Queued #${res.flat.queuePosition} (Approx wait: ${res.flat.waitTimeMinutes}m).`
        }`
      );

      if (isEarlier && res.flat.boostedEarlier) {
        setEarlyDepartureBoost({
          active: true,
          boostKw: res.flat.currentChargingSpeedKw - 4.2,
          previousKw: 4.2,
          newKw: res.flat.currentChargingSpeedKw,
          reason: `Earlier departure requested (${depHours}h remaining). Smart controller accelerated charging to ${res.flat.currentChargingSpeed} to guarantee on-time completion.`
        });
      } else {
        setEarlyDepartureBoost(null);
      }

      onUpdateDepartureTime(effectiveVehicle.id, depHours);
    } else {
      setSessionSaveFeedback(`⚠️ ${res.message || 'Failed to update session.'}`);
    }
  };

  // Handler: Earlier Departure Time Change & Acceleration
  const handleDepartureTimeChange = async (newHours: number) => {
    setDepartureHoursInput(newHours);
    await handleSaveAndCalculate(batteryInput, targetInput, newHours);
  };

  // Apply custom departure hours
  const handleApplyCustomHours = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customHoursInput);
    if (!isNaN(val) && val > 0 && val <= 24) {
      handleDepartureTimeChange(val);
      setCustomHoursInput('');
      setShowCustomHoursBox(false);
    }
  };

  // Friendly metrics for the citizen
  const isCharging = activeFlat.status === 'Charging' && activeFlat.currentChargingSpeedKw > 0;
  const isToppedUp = activeFlat.currentChargePercent >= activeFlat.departureGoalPercent;
  const solarSharePercent = gridState.solarGenerationKw > 0
    ? Math.min(100, Math.round((gridState.solarGenerationKw / Math.max(1, gridState.buildingDemandKw + gridState.evChargingLoadKw)) * 100))
    : 0;

  // Estimated range calculation (~5.2 km per kWh)
  const currentRangeKm = activeFlat.currentRangeKm;
  const targetRangeKm = Math.round((activeFlat.departureGoalPercent / 100) * activeFlat.batteryCapacityKwh * 5.2);

  // Format remaining time nicely for humans
  const hoursLeft = activeFlat.departureHoursRemaining;
  const timeFormatted = hoursLeft < 1 
    ? `${Math.round(hoursLeft * 60)} minutes`
    : hoursLeft === 1 
    ? '1 hour'
    : `${hoursLeft.toFixed(1)} hours`;

  // Determine friendly charging pace
  const getPaceLabel = () => {
    if (!activeFlat.isConnected) return { label: 'Unplugged', color: 'text-slate-300', bg: 'bg-slate-800' };
    if (isToppedUp) return { label: 'Fully Ready', color: 'text-emerald-300 font-bold', bg: 'bg-emerald-950 border-emerald-400' };
    if (earlyDepartureBoost?.active) return { label: `Accelerated (+${earlyDepartureBoost.boostKw.toFixed(1)} kW)`, color: 'text-amber-300 font-black animate-pulse', bg: 'bg-amber-950 border-amber-400 ring-2 ring-amber-400/50' };
    if (activeFlat.currentChargingSpeedKw >= 9) return { label: 'Super Fast Charge', color: 'text-cyan-200 font-black', bg: 'bg-cyan-950 border-cyan-400' };
    if (activeFlat.currentChargingSpeedKw >= 5) return { label: 'Optimal Eco-Rate', color: 'text-emerald-200 font-bold', bg: 'bg-emerald-950 border-emerald-400' };
    return { label: 'Modulated / Balanced', color: 'text-amber-200 font-bold', bg: 'bg-amber-950 border-amber-400' };
  };

  const pace = getPaceLabel();

  return (
    <div className="flex flex-col gap-6">
      {/* 1. RESIDENT VIEW: Focused on the resident's flat, 3D vehicle twin, inputs and personal queue status */}
      {activeViewMode === 'CITIZEN' && (
        <ResidentFlatLookupPanel
          activeFlat={activeFlat}
          isCharging={isCharging}
          targetRangeKm={targetRangeKm}
          flatInput={flatInput}
          setFlatInput={setFlatInput}
          handleFlatFormSubmit={handleFlatFormSubmit}
          isSearchingApi={isSearchingApi}
          flatsList={flatsList}
          handleLookupFlat={handleLookupFlat}
          batteryInput={batteryInput}
          setBatteryInput={setBatteryInput}
          targetInput={targetInput}
          setTargetInput={setTargetInput}
          departureHoursInput={departureHoursInput}
          setDepartureHoursInput={setDepartureHoursInput}
          handleSaveAndCalculate={handleSaveAndCalculate}
          isSavingSession={isSavingSession}
          sessionSaveFeedback={sessionSaveFeedback}
          searchFeedback={searchFeedback}
          showApiInspector={showApiInspector}
          apiResponseRaw={apiResponseRaw}
          portsSummary={portsSummary}
          onToggleConnect={onToggleConnect}
          effectiveVehicle={effectiveVehicle}
        />
      )}



      {/* 30-FLAT DATASET & API INSPECTOR MODAL */}
      <FlatsDatasetTable
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        flats={flatsList}
        activeFlatNumber={activeFlat.flatNumber}
        onSelectFlat={(flatNum) => handleLookupFlat(flatNum, true)}
      />
    </div>
  );
};
