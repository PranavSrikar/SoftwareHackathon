import React, { useState } from 'react';
import {
  Brain,
  Zap,
  Sun,
  Car,
  AlertTriangle,
  Play,
  RefreshCw,
  Download,
  BarChart3,
  TrendingUp,
  Cpu,
  Layers,
  Database,
  Sliders,
  CheckCircle2,
  Info,
  ShieldAlert,
  Clock,
  MapPin,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { MlEngine } from '../services/ml/mlEngine';
import { MlOptimizerScheduler } from '../services/ml/mlOptimizerScheduler';
import { MlDatasetGenerator } from '../services/ml/mlDatasetGenerator';
import { EVVehicle, StationMapItem, SolarWeatherData } from '../types';

interface MlIntelligenceViewProps {
  vehicles: EVVehicle[];
  buildingDemandKw: number;
  solarKw: number;
  stations: StationMapItem[];
  weatherData: SolarWeatherData;
}

export const MlIntelligenceView: React.FC<MlIntelligenceViewProps> = ({
  vehicles,
  buildingDemandKw,
  solarKw,
  stations,
  weatherData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'models' | 'simulator' | 'dataset' | 'explanations'>('overview');
  const [selectedHorizon, setSelectedHorizon] = useState<'15m' | '1h' | '6h' | '24h'>('1h');
  const [isTraining, setIsTraining] = useState<string | null>(null);
  const [models, setModels] = useState(MlEngine.getModelStatuses());

  // Interactive Scenario Simulator state
  const [simEvCount, setSimEvCount] = useState(12);
  const [simBuildingDemand, setSimBuildingDemand] = useState(buildingDemandKw || 38.0);
  const [simSolarGen, setSimSolarGen] = useState(solarKw || 18.5);
  const [simCloudCover, setSimCloudCover] = useState(25);
  const [simResult, setSimResult] = useState(() =>
    MlOptimizerScheduler.generateOptimizedSchedule(vehicles, simBuildingDemand, simSolarGen)
  );

  // Predictions
  const loadForecastData = MlEngine.getBuildingLoadForecast(simBuildingDemand, simSolarGen, 15.0);
  const loadFeatureImportances = MlEngine.getLoadFeatureImportances();
  const gridRisk = MlEngine.predictGridAndTransformerRisk(simBuildingDemand, simSolarGen, 15.0);
  const datasetRows = MlDatasetGenerator.generate90DaysDataset(90);

  const handleTrainModel = (modelId: string) => {
    setIsTraining(modelId);
    setTimeout(() => {
      MlEngine.trainModel(modelId);
      setModels(MlEngine.getModelStatuses());
      setIsTraining(null);
    }, 1200);
  };

  const handleRunSimulation = () => {
    const res = MlOptimizerScheduler.generateOptimizedSchedule(vehicles, simBuildingDemand, simSolarGen);
    setSimResult(res);
  };

  const handleDownloadDataset = () => {
    const csvContent = MlDatasetGenerator.exportToCsv(datasetRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'voltra_ml_training_dataset_90days.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                EXPLAINABLE ML ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                5 ACTIVE ML MODULES
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🤖 ML Intelligence Command Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl mt-1">
              Predictive machine learning models forecasting building load, solar generation, EV demand, station congestion, and transformer risk to dynamically optimize charging schedules before grid peaks occur.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTrainModel('loadForecast')}
              disabled={isTraining !== null}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-950/50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              {isTraining ? 'Training Model...' : 'Train ML Models'}
            </button>
            <button
              onClick={handleDownloadDataset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Dataset CSV
            </button>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'ML Dashboard', icon: BarChart3 },
            { id: 'models', label: '5 ML Modules & Performance', icon: Cpu },
            { id: 'simulator', label: 'AI Scenario Simulator', icon: Sliders },
            { id: 'explanations', label: 'Schedule Intelligence', icon: Info },
            { id: 'dataset', label: 'Data Explorer (90 Days)', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP 4 ML FORECAST KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Load Forecast */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              LOAD FORECAST
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
              1 HOUR PREDICTION
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
            82.0 <span className="text-sm font-normal text-slate-400">kW</span>
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Predicted Peak: 13:30 - 14:30</span>
            <span className="text-emerald-400 font-medium">MAE: 3.2 kW</span>
          </p>
        </div>

        {/* Card 2: Solar Forecast */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Sun className="w-4 h-4 text-amber-400" />
              SOLAR FORECAST
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              6 HOUR HORIZON
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
            27.4 <span className="text-sm font-normal text-slate-400">kW</span>
            <span className="text-xs text-emerald-400 font-semibold">☀️ High Availability</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Irradiance Peak: 12:30</span>
            <span className="text-emerald-400 font-medium">R²: 0.94</span>
          </p>
        </div>

        {/* Card 3: Grid Overload Risk */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              GRID RISK MONITOR
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              gridRisk.riskLevel === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : gridRisk.riskLevel === 'HIGH'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {gridRisk.riskLevel} RISK
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
            74% → {gridRisk.predicted60mUtilPercent}%
            <span className="text-xs text-amber-400 font-normal">Transformer</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {gridRisk.recommendationMessage}
          </p>
        </div>

        {/* Card 4: EV Charging Demand */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Car className="w-4 h-4 text-cyan-400" />
              EV DEMAND MODEL
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
              NEXT 60 MIN
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
            31.2 <span className="text-sm font-normal text-slate-400">kW</span>
            <span className="text-xs text-cyan-400 font-medium">12 EVs Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Avg Departure: 2.1 hrs</span>
            <span className="text-cyan-400 font-medium">Confidence: 88%</span>
          </p>
        </div>
      </div>

      {/* SUB-TAB CONTENT ROUTER */}

      {/* SUB-TAB 1: OVERVIEW DASHBOARD */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* FORECAST GRAPH & PREDICTIVE VS REACTIVE CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Interactive Forecast Graph */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Multi-Factor Forecast vs Safe Grid Envelope
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time comparison of Actual Load, ML Predicted Building Load, Solar Generation, and 50 kW Grid Limit.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                  {(['15m', '1h', '6h', '24h'] as const).map((hz) => (
                    <button
                      key={hz}
                      onClick={() => setSelectedHorizon(hz)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedHorizon === hz ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {hz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={loadForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 90]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val: any) => [`${val || 0} kW`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area type="monotone" dataKey="actualBuildingKw" name="Actual Building Load" fill="#6366f1" fillOpacity={0.15} stroke="#818cf8" strokeWidth={2} />
                    <Line type="monotone" dataKey="predictedBuildingKw" name="Predicted Building Load" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="solarGenerationKw" name="Solar Generation" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="safeGridCapacityKw" name="Safe Grid Limit (50 kW)" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Predictive vs Reactive Control Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Predictive vs Reactive Control
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SIMULATED METRICS
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Predictive ML acts <span className="text-emerald-400 font-semibold">before</span> expected peaks, preventing transformer stress and maximizing solar self-consumption.
                </p>

                <div className="space-y-3">
                  {/* Reactive Control */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-rose-400">REACTIVE CONTROL (Legacy)</span>
                      <span className="text-slate-400 font-mono">Peak: 58.0 kW</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Responds only after overload occurs. Results in 2 late EVs and 91% transformer peak stress.
                    </p>
                  </div>

                  {/* Predictive Control */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 shadow-lg shadow-emerald-950/30">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PREDICTIVE ML CONTROL
                      </span>
                      <span className="text-emerald-300 font-mono font-bold">Peak: 48.0 kW</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Curtails low-priority EVs early. <span className="text-emerald-400 font-semibold">Peak load reduced by 10.0 kW</span> with 94% solar utilization!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center font-mono">
                <span>Peak Reduction: <strong className="text-emerald-400">10.0 kW</strong></span>
                <span>Solar Gain: <strong className="text-emerald-400">+32%</strong></span>
              </div>
            </div>
          </div>

          {/* FEATURE IMPORTANCE ("WHY DID THE MODEL PREDICT THIS?") */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Why did the model predict this? (Feature Importance SHAP Weights)
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated feature importance breakdown showing which environmental & historical variables drive the building demand forecast.
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-800">
                Random Forest Regressor (2,160 Samples)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loadFeatureImportances} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 50]} unit="%" />
                    <YAxis dataKey="featureName" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Bar dataKey="importancePercentage" fill="#6366f1" radius={[0, 6, 6, 0]}>
                      {loadFeatureImportances.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#818cf8' : index === 2 ? '#38bdf8' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {loadFeatureImportances.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{f.featureName}</span>
                      <p className="text-[11px] text-slate-400">{f.description}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                      {f.importancePercentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 5 ML MODULES STATUS & PERFORMANCE */}
      {activeSubTab === 'models' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Active Machine Learning Modules & Evaluation Metrics
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              All metrics calculated from 20% test-split validation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {models.map((m) => (
              <div key={m.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{m.modelType}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {m.modelCategoryLabel}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">{m.name}</h4>
                  <p className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                    <span>Horizon: <strong>{m.predictionHorizon}</strong></span>
                    <span>•</span>
                    <span>Data: <strong>{m.dataSourceLabel}</strong></span>
                  </p>

                  {/* Metrics Box */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">MAE</div>
                      <div className="text-sm font-mono font-bold text-emerald-400">{m.mae} kW</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">RMSE</div>
                      <div className="text-sm font-mono font-bold text-amber-400">{m.rmse} kW</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">R² SCORE</div>
                      <div className="text-sm font-mono font-bold text-cyan-400">{m.r2Score}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Last trained: {new Date(m.lastUpdated).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => handleTrainModel(m.id)}
                    disabled={isTraining === m.id}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTraining === m.id ? 'animate-spin' : ''}`} />
                    Retrain
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AI SCENARIO SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              AI Scenario Simulator (Predictive vs Reactive Stress Test)
            </h3>
            <p className="text-xs text-slate-400">
              Adjust environmental variables, EV fleet size, and building load to compare how the predictive ML scheduler reacts versus a traditional reactive controller.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Controls Panel */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1">
                  <span>Connected EVs Count</span>
                  <span className="text-indigo-400 font-mono">{simEvCount} EVs</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={simEvCount}
                  onChange={(e) => setSimEvCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1">
                  <span>Building Demand</span>
                  <span className="text-amber-400 font-mono">{simBuildingDemand.toFixed(1)} kW</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="48"
                  value={simBuildingDemand}
                  onChange={(e) => setSimBuildingDemand(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between mb-1">
                  <span>Solar Generation</span>
                  <span className="text-emerald-400 font-mono">{simSolarGen.toFixed(1)} kW</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="28"
                  value={simSolarGen}
                  onChange={(e) => setSimSolarGen(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <button
                onClick={handleRunSimulation}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950"
              >
                <Play className="w-4 h-4" />
                RUN AI SIMULATION
              </button>
            </div>

            {/* Side-by-Side Results Comparison */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Without Predictive Control */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30">
                <div className="text-xs font-bold text-rose-400 mb-2 uppercase">WITHOUT PREDICTIVE CONTROL</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Peak Total Load:</span>
                    <span className="font-mono font-bold text-rose-400">{simResult.predictiveVsReactive.reactivePeakLoadKw} kW</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Renewable Utilization:</span>
                    <span className="font-mono font-bold text-slate-300">{simResult.predictiveVsReactive.reactiveSolarUtilizationPercent}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Late / Delayed EVs:</span>
                    <span className="font-mono font-bold text-rose-400">{simResult.predictiveVsReactive.reactiveLateEvsCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Transformer Stress:</span>
                    <span className="font-mono font-bold text-rose-400">{simResult.predictiveVsReactive.reactiveTransformerPeakUtilizationPercent}%</span>
                  </div>
                </div>
              </div>

              {/* With Predictive Control */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 shadow-lg shadow-emerald-950/30">
                <div className="text-xs font-bold text-emerald-400 mb-2 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> WITH PREDICTIVE ML CONTROL
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-300">Peak Total Load:</span>
                    <span className="font-mono font-bold text-emerald-400">{simResult.predictiveVsReactive.predictivePeakLoadKw} kW</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-300">Renewable Utilization:</span>
                    <span className="font-mono font-bold text-emerald-400">{simResult.predictiveVsReactive.predictiveSolarUtilizationPercent}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-300">Late / Delayed EVs:</span>
                    <span className="font-mono font-bold text-emerald-400">{simResult.predictiveVsReactive.predictiveLateEvsCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-300">Transformer Stress:</span>
                    <span className="font-mono font-bold text-emerald-400">{simResult.predictiveVsReactive.predictiveTransformerPeakUtilizationPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SCHEDULE INTELLIGENCE EXPLANATIONS */}
      {activeSubTab === 'explanations' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              Schedule Intelligence Explanations
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              100% EXPLAINABLE AI
            </span>
          </div>

          <div className="space-y-2">
            {simResult.scheduledDecisions.map((d, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center border border-indigo-500/30">
                    {d.evId}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {d.model}
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        d.urgencyStatus === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        Urgency Score: {d.urgencyScore}/100
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{d.explanationText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-right">
                  <div className="text-right">
                    <div className="text-indigo-400 font-bold">{d.allocatedKw} kW</div>
                    <div className="text-[10px] text-slate-400">{d.scheduledTimeWindow}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DATA EXPLORER (90 DAYS) */}
      {activeSubTab === 'dataset' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                ML Historical Training Dataset Inspector (90 Days / 2,160 Samples)
              </h3>
              <p className="text-xs text-slate-400">
                Inspect features, timestamps, temperature, building load, solar generation, and transformer loading.
              </p>
            </div>
            <button
              onClick={handleDownloadDataset}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              Download Dataset CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">TIMESTAMP</th>
                  <th className="px-3 py-2.5">HOUR</th>
                  <th className="px-3 py-2.5">TEMP (°C)</th>
                  <th className="px-3 py-2.5">CLOUDS (%)</th>
                  <th className="px-3 py-2.5">BUILDING LOAD (kW)</th>
                  <th className="px-3 py-2.5">SOLAR (kW)</th>
                  <th className="px-3 py-2.5">EV DEMAND (kW)</th>
                  <th className="px-3 py-2.5">TRANSFORMER (kVA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {datasetRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition">
                    <td className="px-3 py-2 text-slate-400">{new Date(row.timestamp).toLocaleDateString()} {row.hourOfDay}:00</td>
                    <td className="px-3 py-2 text-indigo-400">{row.hourOfDay}:00</td>
                    <td className="px-3 py-2">{row.temperatureC}°C</td>
                    <td className="px-3 py-2 text-slate-400">{row.cloudCoverPercent}%</td>
                    <td className="px-3 py-2 font-bold text-amber-400">{row.buildingLoadKw} kW</td>
                    <td className="px-3 py-2 text-emerald-400">{row.solarKw} kW</td>
                    <td className="px-3 py-2 text-cyan-400">{row.evDemandKw} kW</td>
                    <td className="px-3 py-2 text-slate-300">{row.transformerKva} kVA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
