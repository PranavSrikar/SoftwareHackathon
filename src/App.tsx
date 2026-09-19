/**
 * SMART EV CHARGING COMMAND CENTER
 * Autonomous Grid Protection, Multi-EV Dynamic Allocation, Departure-Deadline Intelligence,
 * and Renewable Energy Optimization
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header, ViewMode } from './components/Header';
import { CitizenHomeView } from './components/CitizenHomeView';
import { TopKpiArea } from './components/TopKpiArea';
import { PowerFlowDiagram } from './components/PowerFlowDiagram';
import { ActiveEvSection } from './components/ActiveEvSection';
import { DecisionExplanationPanel } from './components/DecisionExplanationPanel';
import { GridStressSimulator } from './components/GridStressSimulator';
import { ManualParameterInjection } from './components/ManualParameterInjection';
import { RealTimeCharts } from './components/RealTimeCharts';
import { AddEvModal } from './components/AddEvModal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { SupabaseDataModal } from './components/SupabaseDataModal';

// 5 NEW FEATURES COMPONENTS & SERVICES
import { SolarWeatherSection } from './components/SolarWeatherSection';
import { LiveMapView } from './components/LiveMapView';
import { ResidentDatabaseModal } from './components/ResidentDatabaseModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { AlertsSection } from './components/AlertsSection';
import { ChargingPortsSection } from './components/ChargingPortsSection';
import { SmartAiChatbot } from './components/SmartAiChatbot';
import { MlIntelligenceView } from './components/MlIntelligenceView';

import { 
  EVVehicle, 
  GridState, 
  PriorityBreakdown, 
  ScenarioType, 
  SystemStatus, 
  TelemetryPoint,
  SolarWeatherData,
  FlatRecord,
  FivePortAllocationSummary
} from './types';
import { INITIAL_EVS, INITIAL_GRID_STATE } from './services/simulationData';
import { calculateEvPriority, scoreToLevel } from './services/priorityEngine';
import { allocatePowerToEvs } from './services/powerAllocator';
import { supabaseService } from './services/supabaseService';
import { fetchSolarWeatherData } from './services/solarWeatherService';
import { evaluateNotificationRules, getNotificationPreferences } from './services/notificationService';
import { getAllFlats, getFivePortSummary } from './services/flatsData';

export default function App() {
  // Primary State
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('CITIZEN');
  const [vehicles, setVehicles] = useState<EVVehicle[]>(INITIAL_EVS);
  const [gridState, setGridState] = useState<GridState>(INITIAL_GRID_STATE);
  const [selectedEvId, setSelectedEvId] = useState<string>('PORT-03');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // 5 New Features States
  const [solarData, setSolarData] = useState<SolarWeatherData | null>(null);
  const [flatsList, setFlatsList] = useState<FlatRecord[]>(() => getAllFlats());
  const [portSummary, setPortSummary] = useState<FivePortAllocationSummary | null>(() => getFivePortSummary(1));

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isResidentDbOpen, setIsResidentDbOpen] = useState<boolean>(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);

  // Load Solar/Weather Data
  const loadSolarWeather = useCallback(async () => {
    const data = await fetchSolarWeatherData();
    setSolarData(data);
  }, []);

  useEffect(() => {
    loadSolarWeather();
  }, [loadSolarWeather]);

  // Stored breakdowns cache for instant explainability
  const breakdownsRef = useRef<Record<string, PriorityBreakdown>>({});

  // Core Deterministic Optimization Engine
  const runOptimization = useCallback(
    (
      currentVehicles: EVVehicle[],
      buildingDemandKw: number,
      solarGenerationKw: number,
      gridLimitKw: number,
      scenario: ScenarioType
    ) => {
      const solarSurplusKw = Math.max(0, solarGenerationKw - buildingDemandKw);
      const totalConnected = currentVehicles.filter((v) => v.isConnected).length;

      // 1. Calculate Priority Scores for all connected EVs
      const newBreakdowns: Record<string, PriorityBreakdown> = {};
      const vehiclesWithPriorities = currentVehicles.map((ev) => {
        const breakdown = calculateEvPriority(ev, solarSurplusKw, solarGenerationKw, totalConnected);
        newBreakdowns[ev.id] = breakdown;

        const level = scoreToLevel(breakdown.finalScore);
        const requiredKwh = Math.max(0, (ev.batteryCapacityKwh * (ev.targetSoc - ev.batterySoc)) / 100);

        return {
          ...ev,
          priorityScore: breakdown.finalScore,
          priorityLevel: level,
          requiredEnergyKwh: requiredKwh,
        };
      });

      breakdownsRef.current = newBreakdowns;

      // 2. Perform cluster power allocation with strict grid limit cap
      const allocationResult = allocatePowerToEvs(
        vehiclesWithPriorities,
        gridLimitKw,
        buildingDemandKw,
        solarGenerationKw,
        newBreakdowns
      );

      // 3. Update vehicles with their assigned power and status
      const updatedVehicles = vehiclesWithPriorities.map((ev) => {
        const allocated = allocationResult.allocations[ev.id] || 0;
        let status: 'CHARGING' | 'OPTIMIZED' | 'STANDBY' | 'TOPPED_UP' | 'DISCONNECTED' = 'STANDBY';

        if (!ev.isConnected) {
          status = 'DISCONNECTED';
        } else if (ev.batterySoc >= ev.targetSoc) {
          status = 'TOPPED_UP';
        } else if (allocated > 0) {
          status = allocated < ev.maxChargingRateKw * 0.7 ? 'OPTIMIZED' : 'CHARGING';
        }

        // Track fairness consecutive high power minutes
        let consecutiveMins = ev.consecutiveHighChargingMinutes;
        if (allocated >= 7.0) {
          consecutiveMins += 1;
        } else {
          consecutiveMins = Math.max(0, consecutiveMins - 2);
        }

        return {
          ...ev,
          currentChargingRateKw: allocated,
          status,
          consecutiveHighChargingMinutes: consecutiveMins,
        };
      });

      // 4. Determine System Status
      let systemStatus: SystemStatus = 'SAFE';
      let statusMessage = 'Cluster operating safely within grid and transformer envelopes.';

      if (allocationResult.isOverloadPrevented) {
        systemStatus = 'OVERLOAD PREVENTED';
        statusMessage = `Grid overload prevented! Throttled EV cluster by -${allocationResult.curtailedPowerKw.toFixed(1)} kW to stay strictly under ${gridLimitKw} kW.`;
      } else if (scenario === 'RENEWABLE_DROP' || (solarGenerationKw < 5 && buildingDemandKw > 30)) {
        systemStatus = 'RENEWABLE DROP';
        statusMessage = 'Solar drop detected. Load dynamically modulated to prevent grid import surge.';
      } else if (solarSurplusKw > 2.0 || scenario === 'SOLAR_SURPLUS') {
        systemStatus = 'CLEAN ENERGY AVAILABLE';
        statusMessage = `Renewable surplus active (+${solarSurplusKw.toFixed(1)} kW). EV charging prioritized with 100% green energy.`;
      } else if (buildingDemandKw + allocationResult.totalEvLoadKw >= gridLimitKw * 0.9) {
        systemStatus = 'HIGH DEMAND';
        statusMessage = 'Cluster approaching feeder limit. Active power modulation engaged.';
      } else if (buildingDemandKw >= gridLimitKw * 0.75) {
        systemStatus = 'CAUTION';
        statusMessage = 'Elevated building base demand. Monitoring headroom closely.';
      }

      // 5. Build New Grid State
      const netBuildingFromGrid = Math.max(0, buildingDemandKw - solarGenerationKw);
      const totalLoadKw = Math.min(
        gridLimitKw,
        Math.round((netBuildingFromGrid + allocationResult.totalEvLoadKw) * 10) / 10
      );

      const newGridState: GridState = {
        gridLimitKw,
        transformerCapacityKw: 60.0,
        buildingDemandKw,
        solarGenerationKw,
        evChargingLoadKw: allocationResult.totalEvLoadKw,
        totalLoadKw,
        availableGridCapacityKw: Math.max(0, gridLimitKw - buildingDemandKw),
        solarSurplusKw,
        availableChargingCapacityKw: allocationResult.availableCapacityKw,
        systemStatus,
        statusMessage,
        activeScenario: scenario,
        lastOverloadPrevention: allocationResult.isOverloadPrevented
          ? {
              uncontrolledLoadKw: allocationResult.uncontrolledLoadKw,
              controlledLoadKw: totalLoadKw,
              curtailedKw: allocationResult.curtailedPowerKw,
              timestamp: new Date().toLocaleTimeString(),
            }
          : null,
      };

      // 6. Record to Supabase Mock Service for active vehicle
      const selected = updatedVehicles.find((v) => v.id === selectedEvId) || updatedVehicles[0];
      if (selected && newBreakdowns[selected.id]) {
        supabaseService.recordDecision(
          selected,
          selected.currentChargingRateKw,
          newBreakdowns[selected.id]
        );
      }
      supabaseService.recordTelemetry(newGridState);

      return {
        updatedVehicles,
        newGridState,
        newBreakdowns,
      };
    },
    [selectedEvId]
  );

  // Initialize baseline run
  useEffect(() => {
    const result = runOptimization(
      INITIAL_EVS,
      INITIAL_GRID_STATE.buildingDemandKw,
      INITIAL_GRID_STATE.solarGenerationKw,
      INITIAL_GRID_STATE.gridLimitKw,
      'NORMAL'
    );
    setVehicles(result.updatedVehicles);
    setGridState(result.newGridState);

    // Seed initial telemetry history points
    const now = new Date();
    const initialPoints: TelemetryPoint[] = [];
    for (let i = 10; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3000);
      initialPoints.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        gridLimit: 50,
        totalLoad: 35.5 + (Math.random() * 0.8 - 0.4),
        buildingDemand: 30 + (Math.random() * 0.6 - 0.3),
        evChargingLoad: 20 + (Math.random() * 0.4 - 0.2),
        solarGeneration: 14.5 + (Math.random() * 0.4 - 0.2),
        availableCapacity: 34.5,
      });
    }
    setTelemetryHistory(initialPoints);
  }, [runOptimization]);

  // Real-Time Simulation Interval (runs every 2.5s)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVehicles((prevVehicles) => {
        // Subtle realistic charging progress: add small SOC increment to active charging vehicles
        const updated = prevVehicles.map((ev) => {
          if (ev.isConnected && ev.currentChargingRateKw > 0 && ev.batterySoc < ev.targetSoc) {
            // Charging increment: kw / capacity * hours
            const addedKwh = (ev.currentChargingRateKw * (2.5 / 3600));
            const addedSoc = (addedKwh / ev.batteryCapacityKwh) * 100;
            const newSoc = Math.min(ev.targetSoc, ev.batterySoc + addedSoc);
            return {
              ...ev,
              batterySoc: Math.round(newSoc * 100) / 100,
              totalChargedKwh: Math.round((ev.totalChargedKwh + addedKwh) * 100) / 100,
            };
          }
          return ev;
        });

        // Small continuous telemetry micro-variations
        setGridState((prevGrid) => {
          let jitterBuilding = prevGrid.buildingDemandKw;
          let jitterSolar = prevGrid.solarGenerationKw;

          if (prevGrid.activeScenario === 'NORMAL') {
            jitterBuilding = Math.max(26, Math.min(34, prevGrid.buildingDemandKw + (Math.random() * 0.6 - 0.3)));
            jitterSolar = Math.max(10, Math.min(18, prevGrid.solarGenerationKw + (Math.random() * 0.4 - 0.2)));
          }

          const opt = runOptimization(
            updated,
            jitterBuilding,
            jitterSolar,
            prevGrid.gridLimitKw,
            prevGrid.activeScenario
          );

          // Update telemetry chart history (keep 25 data points)
          setTelemetryHistory((prevHistory) => {
            const newPoint: TelemetryPoint = {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              gridLimit: opt.newGridState.gridLimitKw,
              totalLoad: opt.newGridState.totalLoadKw,
              buildingDemand: Math.round(opt.newGridState.buildingDemandKw * 10) / 10,
              evChargingLoad: Math.round(opt.newGridState.evChargingLoadKw * 10) / 10,
              solarGeneration: Math.round(opt.newGridState.solarGenerationKw * 10) / 10,
              availableCapacity: Math.round(opt.newGridState.availableChargingCapacityKw * 10) / 10,
            };
            const slice = prevHistory.length >= 25 ? prevHistory.slice(1) : prevHistory;
            return [...slice, newPoint];
          });

          return opt.newGridState;
        });

        // Evaluate Notification Rules for low battery, port availability, transformer warnings
        evaluateNotificationRules(flatsList, gridState);

        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, runOptimization, flatsList, gridState]);

  // SCENARIOS HANDLERS (Sections 16-21 & 36)
  const handleSelectScenario = (scenario: ScenarioType) => {
    let building = 30.0;
    let solar = 14.5;
    const limit = gridState.gridLimitKw;

    if (scenario === 'NORMAL') {
      building = 30.0;
      solar = 14.5;
    } else if (scenario === 'GRID_STRESS') {
      // SCENE 2: GRID STRESS (Building jumps to 48 kW, initial EV is 22 kW -> 70 kW potential overload!)
      // Solar is 0 kW during peak stress so available headroom is strictly 50 - 48 = 2 kW
      building = 48.0;
      solar = 0.0;
    } else if (scenario === 'SOLAR_SURPLUS') {
      // SCENE 3: SOLAR SURPLUS (Solar surges to 22 kW)
      building = 26.0;
      solar = 22.0;
    } else if (scenario === 'RENEWABLE_DROP') {
      // SCENE 4: RENEWABLE DROP (Solar suddenly drops to 3.5 kW)
      building = 32.0;
      solar = 3.5;
    } else if (scenario === 'EV_ARRIVAL') {
      // SCENE 5: EV ARRIVAL (A new urgent EV arrives and plugs into an available port)
      const newEv: EVVehicle = {
        id: `PORT-0${vehicles.length + 1}`,
        model: 'Tesla Model Y Performance',
        batterySoc: 18,
        batteryCapacityKwh: 75.0,
        targetSoc: 85,
        maxChargingRateKw: 11.0,
        currentChargingRateKw: 0,
        departureTime: '06:30 AM',
        departureHoursRemaining: 1.2,
        requiredEnergyKwh: 50.25,
        priorityScore: 92,
        priorityLevel: 'VERY HIGH',
        isConnected: true,
        status: 'CHARGING',
        consecutiveHighChargingMinutes: 0,
        totalChargedKwh: 0,
        fairnessFactor: 1.0,
        arrivalOrder: vehicles.length + 1,
      };

      const updatedList = [newEv, ...vehicles];
      setSelectedEvId(newEv.id);

      const opt = runOptimization(updatedList, gridState.buildingDemandKw, gridState.solarGenerationKw, limit, 'EV_ARRIVAL');
      setVehicles(opt.updatedVehicles);
      setGridState(opt.newGridState);
      return;
    }

    const opt = runOptimization(vehicles, building, solar, limit, scenario);
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  // Slider Handlers
  const handleUpdateBuildingLoad = (val: number) => {
    const opt = runOptimization(vehicles, val, gridState.solarGenerationKw, gridState.gridLimitKw, gridState.activeScenario);
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  const handleUpdateSolarGen = (val: number) => {
    const opt = runOptimization(vehicles, gridState.buildingDemandKw, val, gridState.gridLimitKw, gridState.activeScenario);
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  const handleUpdateGridLimit = (val: number) => {
    const opt = runOptimization(vehicles, gridState.buildingDemandKw, gridState.solarGenerationKw, val, gridState.activeScenario);
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  // EV Actions
  const handleToggleConnect = (id: string) => {
    const updated = vehicles.map((v) => (v.id === id ? { ...v, isConnected: !v.isConnected } : v));
    const opt = runOptimization(
      updated,
      gridState.buildingDemandKw,
      gridState.solarGenerationKw,
      gridState.gridLimitKw,
      gridState.activeScenario
    );
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  const handleRemoveEv = (id: string) => {
    const filtered = vehicles.filter((v) => v.id !== id);
    if (selectedEvId === id && filtered.length > 0) {
      setSelectedEvId(filtered[0].id);
    }
    const opt = runOptimization(
      filtered,
      gridState.buildingDemandKw,
      gridState.solarGenerationKw,
      gridState.gridLimitKw,
      gridState.activeScenario
    );
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  const handleAddVehicle = (newEv: EVVehicle) => {
    const updated = [newEv, ...vehicles];
    setSelectedEvId(newEv.id);
    const opt = runOptimization(
      updated,
      gridState.buildingDemandKw,
      gridState.solarGenerationKw,
      gridState.gridLimitKw,
      gridState.activeScenario
    );
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  const handleUpdateDepartureTime = (id: string, hoursRemaining: number) => {
    const targetDate = new Date(Date.now() + hoursRemaining * 3600 * 1000);
    const timeStr = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = vehicles.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          departureHoursRemaining: hoursRemaining,
          departureTime: timeStr,
        };
      }
      return v;
    });
    const opt = runOptimization(
      updated,
      gridState.buildingDemandKw,
      gridState.solarGenerationKw,
      gridState.gridLimitKw,
      gridState.activeScenario
    );
    setVehicles(opt.updatedVehicles);
    setGridState(opt.newGridState);
  };

  const handleBoostVehicle = (id: string) => {
    handleUpdateDepartureTime(id, 0.75);
  };

  const handleResetToNormal = () => {
    handleSelectScenario('NORMAL');
  };

  // Selected vehicle & breakdown for explanation panel
  const selectedVehicle = vehicles.find((v) => v.id === selectedEvId) || vehicles[0];
  const selectedBreakdown = selectedVehicle ? breakdownsRef.current[selectedVehicle.id] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      {/* Top Navigation & Status Bar */}
      <Header
        gridState={gridState}
        isSimulating={isSimulating}
        activeViewMode={activeViewMode}
        onChangeViewMode={(mode) => setActiveViewMode(mode)}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onResetToNormal={handleResetToNormal}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        onOpenResidentDb={() => setIsResidentDbOpen(true)}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onSimulateGridStress={() => {
          setActiveViewMode('FLOW');
          handleSelectScenario('GRID_STRESS');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 flex flex-col gap-6">
        {/* VIEW 1: RESIDENT VIEW */}
        {activeViewMode === 'CITIZEN' && (
          <>
            <CitizenHomeView
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              gridState={gridState}
              breakdown={selectedBreakdown}
              activeViewMode={activeViewMode}
              onChangeViewMode={(mode) => setActiveViewMode(mode)}
              onSelectVehicle={(id) => setSelectedEvId(id)}
              onToggleConnect={handleToggleConnect}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onSelectScenario={handleSelectScenario}
              onUpdateDepartureTime={handleUpdateDepartureTime}
              onBoostVehicle={handleBoostVehicle}
            />

            {/* SOLAR & WEATHER INTEGRATION CARD IN CHARGING PORTS MODE (HIDDEN IN RESIDENT VIEW) */}
            {solarData && activeViewMode !== 'CITIZEN' && (
              <SolarWeatherSection
                solarData={solarData}
                onRefresh={loadSolarWeather}
                onOptimizeSolarCharging={() => handleSelectScenario('SOLAR_SURPLUS')}
              />
            )}

            {/* Subtle invitation for operators / tech judges */}
            <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                Want to inspect multi-bus power flow lines, OCPP telemetry, or engineering formulas?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveViewMode('FLOW')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium transition-colors"
                >
                  View Energy Flow
                </button>
                <button
                  onClick={() => setActiveViewMode('SOLAR')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium transition-colors"
                >
                  Solar Forecast
                </button>
                <button
                  onClick={() => setActiveViewMode('OPERATOR')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  Open Grid Console
                </button>
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: CHARGING PORTS (5 Separate Port Sections & Priority Queues) */}
        {activeViewMode === 'CHARGING_PORTS' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <ChargingPortsSection
              flats={flatsList}
              portSummary={portSummary}
              onSelectFlat={(flatNum) => {
                setActiveViewMode('CITIZEN');
              }}
            />
          </div>
        )}
        {activeViewMode === 'FLOW' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <TopKpiArea
              gridState={gridState}
              activeEvCount={vehicles.filter((v) => v.isConnected && v.currentChargingRateKw > 0).length}
            />

            {/* SIDE-BY-SIDE SIMULATOR & REAL-TIME POWER FLOW CANVAS */}
            <div className="w-full">
              <PowerFlowDiagram 
                gridState={gridState} 
                vehicles={vehicles} 
                onTriggerGridStress={() => handleSelectScenario('GRID_STRESS')}
                onResetNormal={() => handleSelectScenario('NORMAL')}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: SOLAR FORECAST & WEATHER INTEGRATION */}
        {activeViewMode === 'SOLAR' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {solarData && (
              <SolarWeatherSection
                solarData={solarData}
                onRefresh={loadSolarWeather}
                onOptimizeSolarCharging={() => handleSelectScenario('SOLAR_SURPLUS')}
              />
            )}
          </div>
        )}

        {/* VIEW 4: LIVE INTERACTIVE MAP */}
        {activeViewMode === 'MAP' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <LiveMapView
              portSummary={portSummary}
              flatsData={flatsList}
            />
          </div>
        )}

        {/* VIEW 5: ALERTS SECTION */}
        {activeViewMode === 'ALERTS' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <AlertsSection />
          </div>
        )}

        {/* VIEW: ML INTELLIGENCE COMMAND CENTER */}
        {activeViewMode === 'ML_INTELLIGENCE' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <MlIntelligenceView
              vehicles={vehicles}
              buildingDemandKw={gridState.buildingDemandKw}
              solarKw={gridState.solarGenerationKw}
              stations={[]}
              weatherData={solarData || {
                temperatureC: 28,
                condition: 'Sunny / Clear',
                cloudCoverPercent: 20,
                solarIrradianceKw: 0.85,
                uvIndex: 7,
                windSpeedKmh: 12,
                sunriseTime: '06:12 AM',
                sunsetTime: '06:45 PM',
                forecast: [],
                dataSource: 'SIMULATION',
                lastUpdated: new Date().toLocaleTimeString(),
              }}
            />
          </div>
        )}

        {/* VIEW 5: FULL GRID OPERATOR CONSOLE */}
        {activeViewMode === 'OPERATOR' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <ManualParameterInjection
              gridState={gridState}
              onUpdateBuildingLoad={handleUpdateBuildingLoad}
              onUpdateSolarGen={handleUpdateSolarGen}
              onUpdateGridLimit={handleUpdateGridLimit}
            />

            <ActiveEvSection
              vehicles={vehicles}
              selectedEvId={selectedEvId}
              onSelectEv={(id) => setSelectedEvId(id)}
              onToggleConnect={handleToggleConnect}
              onRemoveEv={handleRemoveEv}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />

            <RealTimeCharts
              telemetryHistory={telemetryHistory}
              vehicles={vehicles}
              gridState={gridState}
            />

            <DecisionExplanationPanel
              selectedVehicle={selectedVehicle}
              vehicles={vehicles}
              breakdown={selectedBreakdown}
              gridState={gridState}
              onSelectVehicle={(id) => setSelectedEvId(id)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-4 mt-8 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SMART EV CHARGING COMMAND CENTER &bull; HACKATHON INNOVATION PROJECT</span>
          <span className="text-slate-400">
            DETERMINISTIC SMART LOAD MANAGEMENT &bull; SUPABASE POSTGRESQL PERSISTENCE
          </span>
        </div>
      </footer>

      {/* Modals */}
      <AddEvModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddVehicle={handleAddVehicle}
        nextIndex={vehicles.length + 1}
      />

      <SystemArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      <SupabaseDataModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        vehicles={vehicles}
        gridState={gridState}
      />

      <ResidentDatabaseModal
        isOpen={isResidentDbOpen}
        onClose={() => setIsResidentDbOpen(false)}
        flats={flatsList}
        onFlatUpdated={() => setFlatsList([...getAllFlats()])}
      />

      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />

      {/* Smart AI Chatbot Pop-up (Draggable) */}
      <SmartAiChatbot />
    </div>
  );
}
