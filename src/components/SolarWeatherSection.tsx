import React from 'react';
import { 
  Sun, 
  CloudSun, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Sparkles, 
  RefreshCw, 
  Info,
  TrendingUp,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { SolarWeatherData } from '../types';

interface SolarWeatherSectionProps {
  solarData: SolarWeatherData;
  onRefresh?: () => void;
  onOptimizeSolarCharging?: () => void;
}

export const SolarWeatherSection: React.FC<SolarWeatherSectionProps> = ({
  solarData,
  onRefresh,
  onOptimizeSolarCharging,
}) => {
  const getSourceBadge = (source: SolarWeatherData['dataSource']) => {
    switch (source) {
      case 'LIVE API':
        return 'bg-emerald-950 border-emerald-500/50 text-emerald-400';
      case 'SIMULATION':
        return 'bg-amber-950 border-amber-500/50 text-amber-300';
      case 'DATABASE':
        return 'bg-sky-950 border-sky-500/50 text-sky-300';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Live API / Simulation Tag */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                SOLAR FORECAST & WEATHER INTEGRATION
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${getSourceBadge(solarData.dataSource)}`}>
                ● {solarData.dataSource}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              MICROGRID RENEWABLE ENGINE &bull; DYNAMIC ABSORPTION OPTIMIZATION &bull; LAST UPDATED {solarData.lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOptimizeSolarCharging && (
            <button
              onClick={onOptimizeSolarCharging}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Max Solar Absorption Boost</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Refresh live weather & solar data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Weather & Solar Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Solar Irradiance / Output */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SOLAR GENERATION</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <p className="text-2xl font-black font-mono text-white">
              {solarData.solarIrradianceKw.toFixed(1)} <span className="text-sm text-amber-400 font-normal">kW</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Rooftop Array Yield (35 kW Cap)
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (solarData.solarIrradianceKw / 35) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Cloud Cover */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CLOUD COVER</span>
            <CloudSun className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-2">
            <p className="text-2xl font-black font-mono text-white">
              {solarData.cloudCoverPercent}% <span className="text-sm text-sky-400 font-normal">Density</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Condition: {solarData.condition}
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-400 rounded-full transition-all duration-500"
              style={{ width: `${solarData.cloudCoverPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Ambient Temperature */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TEMPERATURE</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <p className="text-2xl font-black font-mono text-white">
              {solarData.temperatureC}°C <span className="text-sm text-rose-400 font-normal">Ambient</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              UV Index: {solarData.uvIndex} &bull; Wind: {solarData.windSpeedKmh} km/h
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (solarData.temperatureC / 50) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Daylight Window */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SUNRISE & SUNSET</span>
            <Sun className="w-4 h-4 text-amber-300" />
          </div>
          <div className="my-2 font-mono text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Sunrise:</span>
              <span className="font-bold text-amber-300">{solarData.sunriseTime}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-t border-slate-800/80">
              <span className="text-slate-400">Sunset:</span>
              <span className="font-bold text-amber-400">{solarData.sunsetTime}</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Optimal Solar Absorptive Window</span>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Table & Smart Charging Coupling */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>6-HOUR SOLAR GENERATION FORECAST</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            DIRECTLY COUPLED TO SMART CHARGING SCHEDULER
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {solarData.forecast.map((item, idx) => {
            return (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col items-center text-center gap-2 font-mono"
              >
                <span className="text-xs font-bold text-slate-300">{item.time}</span>
                <p className="text-lg font-black text-amber-400">
                  {item.solarKw.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kW</span>
                </p>
                <span className="text-[10px] text-slate-400">
                  Cloud: {item.cloudCoverPercent}%
                </span>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (item.solarKw / 30) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300">Smart Charging Coupling:</strong> When solar forecast exceeds 20 kW, the priority engine automatically increases EV charging rates to absorb clean zero-cost energy before grid limit enforcement.
          </span>
        </div>
      </div>
    </div>
  );
};
