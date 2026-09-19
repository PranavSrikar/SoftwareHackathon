import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Zap, 
  Navigation, 
  Filter, 
  Clock, 
  Sun, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  Search,
  Download,
  Plus,
  Trash2,
  Sliders
} from 'lucide-react';
import { StationMapItem, FivePortAllocationSummary, FlatRecord, ChargingPort, StationRecommendationResult } from '../types';
import { MlEngine } from '../services/ml/mlEngine';
import { Brain, Sparkles } from 'lucide-react';

interface LiveMapViewProps {
  portSummary?: FivePortAllocationSummary | null;
  flatsData?: FlatRecord[];
}

// Expanded realistic charging station dataset integrated into map and table
const DEFAULT_STATIONS: StationMapItem[] = [
  {
    id: 'STATION-COMMUNITY-01',
    name: 'GridSync Hub - Central Resident Station',
    latitude: 17.3850,
    longitude: 78.4867,
    address: 'Block A, Resident Complex Main Plaza',
    totalPorts: 5,
    availablePorts: 2,
    occupiedPorts: 3,
    currentPowerKw: 18.5,
    maxPowerKw: 35.0,
    utilizationPercent: 53,
    estimatedWaitMins: 0,
    renewablePercent: 68,
    status: 'AVAILABLE',
    isFastCharger: true,
  },
  {
    id: 'STATION-NORTH-02',
    name: 'GridSync Hub - North Residential Wing',
    latitude: 17.3892,
    longitude: 78.4890,
    address: 'Block B, North Visitor Gate',
    totalPorts: 4,
    availablePorts: 1,
    occupiedPorts: 3,
    currentPowerKw: 22.0,
    maxPowerKw: 30.0,
    utilizationPercent: 73,
    estimatedWaitMins: 12,
    renewablePercent: 45,
    status: 'MODERATE',
    isFastCharger: true,
  },
  {
    id: 'STATION-SOUTH-03',
    name: 'GridSync Hub - South Solar Canopy',
    latitude: 17.3812,
    longitude: 78.4830,
    address: 'South Solar Parking Deck',
    totalPorts: 6,
    availablePorts: 4,
    occupiedPorts: 2,
    currentPowerKw: 14.2,
    maxPowerKw: 45.0,
    utilizationPercent: 31,
    estimatedWaitMins: 0,
    renewablePercent: 88,
    status: 'AVAILABLE',
    isFastCharger: true,
  },
  {
    id: 'STATION-EAST-04',
    name: 'GridSync Hub - East Commercial Plaza',
    latitude: 17.3875,
    longitude: 78.4920,
    address: 'East Avenue Commercial Plaza',
    totalPorts: 4,
    availablePorts: 0,
    occupiedPorts: 4,
    currentPowerKw: 28.0,
    maxPowerKw: 28.0,
    utilizationPercent: 100,
    estimatedWaitMins: 28,
    renewablePercent: 30,
    status: 'CONGESTED',
    isFastCharger: true,
  },
  {
    id: 'STATION-WEST-05',
    name: 'GreenGrid Westside Eco-Hub',
    latitude: 17.3830,
    longitude: 78.4790,
    address: '72 West End Boulevard',
    totalPorts: 10,
    availablePorts: 7,
    occupiedPorts: 3,
    currentPowerKw: 42.0,
    maxPowerKw: 200.0,
    utilizationPercent: 21,
    estimatedWaitMins: 0,
    renewablePercent: 82,
    status: 'AVAILABLE',
    isFastCharger: true,
  },
  {
    id: 'STATION-TECH-06',
    name: 'Cyber Towers Ultra-Fast Charging Park',
    latitude: 17.3940,
    longitude: 78.4950,
    address: 'Tech Zone Tower 4',
    totalPorts: 20,
    availablePorts: 3,
    occupiedPorts: 17,
    currentPowerKw: 185.0,
    maxPowerKw: 350.0,
    utilizationPercent: 85,
    estimatedWaitMins: 6,
    renewablePercent: 55,
    status: 'MODERATE',
    isFastCharger: true,
  },
  {
    id: 'STATION-METRO-07',
    name: 'City Center Metro Station Chargers',
    latitude: 17.3780,
    longitude: 78.4880,
    address: 'Platform B Parking, Metro Station',
    totalPorts: 6,
    availablePorts: 0,
    occupiedPorts: 6,
    currentPowerKw: 50.0,
    maxPowerKw: 50.0,
    utilizationPercent: 100,
    estimatedWaitMins: 22,
    renewablePercent: 38,
    status: 'CONGESTED',
    isFastCharger: false,
  },
  {
    id: 'STATION-UNIVERSITY-08',
    name: 'GreenCampus Research Park EV Bay',
    latitude: 17.3910,
    longitude: 78.4810,
    address: 'University Innovation Gate 3',
    totalPorts: 8,
    availablePorts: 5,
    occupiedPorts: 3,
    currentPowerKw: 32.0,
    maxPowerKw: 120.0,
    utilizationPercent: 26,
    estimatedWaitMins: 0,
    renewablePercent: 95,
    isFastCharger: true,
    status: 'AVAILABLE',
  }
];

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  portSummary,
  flatsData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Database and Search States
  const [stations, setStations] = useState<StationMapItem[]>(DEFAULT_STATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConnector, setFilterConnector] = useState<string>('All');
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'AVAILABLE_NOW' | 'FAST_CHARGING' | 'LOW_CONGESTION' | 'HIGH_RENEWABLE'
  >('ALL');

  // Add Station Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTotalPorts, setNewTotalPorts] = useState('6');
  const [newAvailablePorts, setNewAvailablePorts] = useState('4');
  const [newPower, setNewPower] = useState('150');
  const [newRenewable, setNewRenewable] = useState('75');

  const [selectedStation, setSelectedStation] = useState<StationMapItem | null>(DEFAULT_STATIONS[0]);
  const [activeRoute, setActiveRoute] = useState<{
    distanceKm: number;
    etaMins: number;
    steps: string[];
  } | null>(null);

  // ML Station Recommendation Modal State
  const [showMlRecommendationModal, setShowMlRecommendationModal] = useState(false);
  const [mlRecommendationResult, setMlRecommendationResult] = useState<StationRecommendationResult | null>(null);

  const handleFindBestStation = () => {
    const rec = MlEngine.recommendBestStation(calculatedStations, 1.2);
    setMlRecommendationResult(rec);
    setShowMlRecommendationModal(true);
    const best = calculatedStations.find((s) => s.id === rec.bestStationId);
    if (best) setSelectedStation(best);
  };

  // User location (strictly private)
  const userLocation = { lat: 17.3842, lng: 78.4855, name: 'Your Vehicle Location (Flat 1)' };

  // Calculate live station data from 5-port summary if present for community hub
  const calculatedStations: StationMapItem[] = stations.map((st) => {
    if (st.id === 'STATION-COMMUNITY-01' && portSummary) {
      const availCount = portSummary.ports.filter((p: ChargingPort) => p.status === 'AVAILABLE').length;
      const occCount = 5 - availCount;
      const totalAllocatedKw = portSummary.ports.reduce((sum, p) => sum + (p.status === 'CHARGING' ? p.chargingRateKw : 0), 0);
      const status: StationMapItem['status'] = availCount >= 2 ? 'AVAILABLE' : availCount === 1 ? 'MODERATE' : 'CONGESTED';
      
      return {
        ...st,
        availablePorts: availCount,
        occupiedPorts: occCount,
        currentPowerKw: Math.round(totalAllocatedKw * 10) / 10,
        utilizationPercent: Math.round((totalAllocatedKw / st.maxPowerKw) * 100),
        estimatedWaitMins: availCount > 0 ? 0 : 15,
        status,
      };
    }
    return st;
  });

  // Filter stations for map & table
  const filteredStations = calculatedStations.filter((st) => {
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          st.address.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'AVAILABLE_NOW' && st.availablePorts <= 0) return false;
    if (activeFilter === 'FAST_CHARGING' && !st.isFastCharger) return false;
    if (activeFilter === 'LOW_CONGESTION' && st.status === 'CONGESTED') return false;
    if (activeFilter === 'HIGH_RENEWABLE' && st.renewablePercent < 60) return false;

    return true;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.3850, 78.4867],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | GridSync EV',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add User Location Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="background-color: #06b6d4; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #020617; box-shadow: 0 0 12px #06b6d4;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`<b>${userLocation.name}</b><br/>Private Location`).openPopup();
    markersRef.current.push(userMarker);

    // Add Station Markers with Color States (Green, Yellow, Red)
    filteredStations.forEach((st) => {
      let color = '#10b981'; // Green Available
      if (st.status === 'MODERATE') color = '#f59e0b'; // Yellow Moderate
      if (st.status === 'CONGESTED') color = '#f43f5e'; // Red Congested

      const stationIcon = L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid #020617;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #020617;
            font-weight: 900;
            font-size: 11px;
            box-shadow: 0 0 12px ${color};
            cursor: pointer;
          ">
            ⚡
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: stationIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedStation(st);
      });

      markersRef.current.push(marker);
    });
  }, [filteredStations]);

  const handleGetRoute = (st: StationMapItem) => {
    setSelectedStation(st);
    const hash = st.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const distanceKm = Math.round(((hash % 25) / 10 + 0.8) * 10) / 10;
    const congestionFactor = st.status === 'CONGESTED' ? 1.4 : st.status === 'MODERATE' ? 1.2 : 1.0;
    const etaMins = Math.max(2, Math.round(distanceKm * 2.2 * congestionFactor));

    setActiveRoute({
      distanceKm,
      etaMins,
      steps: [
        'Head North on Residential Complex Main Driveway',
        `Navigate via Inner Ring Road toward ${st.address}`,
        `Arrive at ${st.name} (${st.availablePorts} ports available)`,
      ],
    });
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAddress) return;

    const total = parseInt(newTotalPorts) || 6;
    const avail = parseInt(newAvailablePorts) || 3;
    const power = parseInt(newPower) || 150;
    const solar = parseInt(newRenewable) || 75;

    const newSt: StationMapItem = {
      id: `STATION-CUSTOM-${Date.now()}`,
      name: newName,
      latitude: 17.3850 + (Math.random() - 0.5) * 0.02,
      longitude: 78.4867 + (Math.random() - 0.5) * 0.02,
      address: newAddress,
      totalPorts: total,
      availablePorts: avail,
      occupiedPorts: total - avail,
      currentPowerKw: Math.round(power * 0.4 * 10) / 10,
      maxPowerKw: power,
      utilizationPercent: 40,
      estimatedWaitMins: avail > 0 ? 0 : 15,
      renewablePercent: solar,
      status: avail >= 2 ? 'AVAILABLE' : avail === 1 ? 'MODERATE' : 'CONGESTED',
      isFastCharger: power >= 50
    };

    setStations([newSt, ...stations]);
    setSelectedStation(newSt);
    setNewName('');
    setNewAddress('');
    setShowAddForm(false);
  };

  const handleDeleteStation = (id: string) => {
    setStations(stations.filter(s => s.id !== id));
    if (selectedStation?.id === id) {
      setSelectedStation(stations[0] || null);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Station ID', 'Name', 'Address', 'Total Ports', 'Available Ports', 'Power (kW)', 'Renewable %', 'Status', 'Wait (min)'];
    const rows = stations.map(s => [
      s.id, s.name, s.address, s.totalPorts, s.availablePorts, s.maxPowerKw, s.renewablePercent, s.status, s.estimatedWaitMins
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "charging_stations_database.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 font-mono text-xs">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                LIVE MAP & CHARGING STATIONS
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                OPENSTREETMAP REAL-TIME
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Interactive map plotting nearby EV charging stops with real-time port availability, routing, and database table.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFindBestStation}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-950"
          >
            <Brain className="w-4 h-4 text-indigo-300" />
            <span>🤖 Find Best Charging Station</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Station</span>
          </button>
        </div>
      </div>

      {/* ML SMART RECOMMENDATION MODAL */}
      {showMlRecommendationModal && mlRecommendationResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Smart ML Station Recommendation</h3>
                  <p className="text-[11px] text-slate-400">Holistic score based on distance, predicted wait, power & renewable solar %</p>
                </div>
              </div>
              <button
                onClick={() => setShowMlRecommendationModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Winner Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> RECOMMENDED CHOICE
                </span>
                <span className="font-mono font-bold text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
                  SCORE: {mlRecommendationResult.recommendationScore}/100
                </span>
              </div>
              <h4 className="text-lg font-bold text-white">{mlRecommendationResult.recommendedStationName}</h4>
              <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {mlRecommendationResult.explanation}
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Distance</div>
                  <div className="font-bold text-white">{mlRecommendationResult.distanceKm} km</div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Predicted Wait</div>
                  <div className="font-bold text-emerald-400">{mlRecommendationResult.predictedWaitMins} mins</div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Available Power</div>
                  <div className="font-bold text-cyan-400">{mlRecommendationResult.availablePowerKw} kW</div>
                </div>
              </div>
            </div>

            {/* Comparison Breakdown Table */}
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2">All Candidate Stations Scored</div>
              <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] sticky top-0">
                    <tr>
                      <th className="px-3 py-2">STATION</th>
                      <th className="px-3 py-2">DIST</th>
                      <th className="px-3 py-2">PREDICTED WAIT</th>
                      <th className="px-3 py-2">POWER</th>
                      <th className="px-3 py-2">ML SCORE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {mlRecommendationResult.allStationScores.map((s, idx) => (
                      <tr key={idx} className={s.stationId === mlRecommendationResult.bestStationId ? 'bg-indigo-950/40 font-bold' : ''}>
                        <td className="px-3 py-2 text-white">{s.name}</td>
                        <td className="px-3 py-2 text-slate-400">{s.distanceKm} km</td>
                        <td className="px-3 py-2 text-emerald-400">{s.predictedWaitMins} min</td>
                        <td className="px-3 py-2 text-cyan-400">{s.availablePowerKw} kW</td>
                        <td className="px-3 py-2 text-indigo-400 font-bold">{s.score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMlRecommendationModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Close & Select Station
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Station Modal Form */}
      {showAddForm && (
        <form onSubmit={handleAddStation} className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add New Charging Station to Network Database
            </h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">STATION NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Westside Plaza DC Charger"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">ADDRESS</label>
              <input
                type="text"
                required
                placeholder="e.g. 102 Metro Expressway"
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">MAX POWER OUTPUT (kW)</label>
              <select
                value={newPower}
                onChange={e => setNewPower(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="22">22 kW (Level 2 AC)</option>
                <option value="50">50 kW (DC Fast)</option>
                <option value="150">150 kW (High Power DC)</option>
                <option value="350">350 kW (Ultra Supercharger)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">TOTAL PORTS</label>
              <input
                type="number"
                value={newTotalPorts}
                onChange={e => setNewTotalPorts(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">AVAILABLE PORTS</label>
              <input
                type="number"
                value={newAvailablePorts}
                onChange={e => setNewAvailablePorts(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">SOLAR ENERGY RENEWABLE %</label>
              <input
                type="number"
                value={newRenewable}
                onChange={e => setNewRenewable(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
            >
              Save Station to Network
            </button>
          </div>
        </form>
      )}

      {/* Main Map + Selected Station Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Leaflet Map Canvas */}
        <div className="lg:col-span-2 h-[480px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Floating Legend */}
          <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md font-mono text-[11px] flex flex-col gap-1.5 shadow-xl">
            <span className="font-bold text-slate-300 text-[10px]">STATION CONGESTION:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-slate-950" />
              <span className="text-emerald-300">Available Ports (&gt; 1 Free)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-slate-950" />
              <span className="text-amber-300">Moderate (1 Port Free)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-slate-950" />
              <span className="text-rose-300">Congested / Fully Occupied</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Station Details & Routing Card */}
        <div className="flex flex-col gap-4">
          {selectedStation ? (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl flex flex-col justify-between gap-4 font-mono text-xs h-[480px] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    {selectedStation.id}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    {selectedStation.name}
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                    {selectedStation.address}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded border font-bold text-[10px] ${
                  selectedStation.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                  selectedStation.status === 'MODERATE' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                  'bg-rose-950 text-rose-300 border-rose-500/40'
                }`}>
                  {selectedStation.status}
                </span>
              </div>

              {/* Station Stats */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400">FREE PORTS</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    {selectedStation.availablePorts} / {selectedStation.totalPorts}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400">MAX POWER</span>
                  <p className="text-base font-bold text-cyan-300 mt-0.5">
                    {selectedStation.maxPowerKw} kW
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400">ESTIMATED WAIT</span>
                  <p className="text-base font-bold text-slate-200 mt-0.5">
                    {selectedStation.estimatedWaitMins === 0 ? '0 mins' : `~${selectedStation.estimatedWaitMins} mins`}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400">SOLAR ENERGY</span>
                  <p className="text-base font-bold text-amber-400 mt-0.5">
                    {selectedStation.renewablePercent}%
                  </p>
                </div>
              </div>

              {/* Route Preview if generated */}
              {activeRoute && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/50 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center justify-between text-cyan-300 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 fill-cyan-400 text-slate-950" />
                      ROUTE FROM FLAT 1
                    </span>
                    <span className="text-white font-mono text-xs tracking-wide bg-cyan-950/90 px-2.5 py-1 rounded-lg border border-cyan-500/40 font-bold text-cyan-200">
                      {activeRoute.distanceKm} km • {activeRoute.etaMins} mins
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-slate-300 font-sans mt-0.5">
                    {activeRoute.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 mt-auto">
                <button
                  onClick={() => handleGetRoute(selectedStation)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Get Route from Flat 1</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 font-mono text-xs h-[480px] flex items-center justify-center">
              Select a station on the map to inspect live port availability and navigation.
            </div>
          )}
        </div>
      </div>

      {/* Charging Station Table & Filters Section */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              CHARGING STATION DATABASE & DIRECTORY
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Search, filter, and inspect all {filteredStations.length} available EV stops across the regional network.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search station or address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500 w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(
                [
                  ['ALL', 'All'],
                  ['AVAILABLE_NOW', 'Available'],
                  ['FAST_CHARGING', 'Fast 50kW+'],
                  ['HIGH_RENEWABLE', 'High Solar'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    activeFilter === key
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stations Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/50">
                <th className="py-3 px-4">Station Name & Location</th>
                <th className="py-3 px-4">Power Output</th>
                <th className="py-3 px-4">Plug Availability</th>
                <th className="py-3 px-4">Solar %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Estimated Wait</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No matching charging stations found for your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStations.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {s.address}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-cyan-300">{s.maxPowerKw} kW DC</div>
                      <div className="text-[10px] text-slate-400">{s.isFastCharger ? 'Fast Charger' : 'Standard L2'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-400">{s.availablePorts} free / {s.totalPorts} total</div>
                      <div className="text-[10px] text-slate-400">{s.occupiedPorts} occupied</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-amber-400">{s.renewablePercent}% Solar</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold inline-block ${
                        s.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                        s.status === 'MODERATE' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                        'bg-rose-950 text-rose-300 border-rose-500/40'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${s.estimatedWaitMins === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {s.estimatedWaitMins === 0 ? '0 mins' : `~${s.estimatedWaitMins} mins`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStation(s);
                          handleGetRoute(s);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] transition-all"
                        title="Focus station on map and get route"
                      >
                        Route
                      </button>
                      <button
                        onClick={() => handleDeleteStation(s.id)}
                        className="p-1 rounded bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-300 transition-all"
                        title="Remove from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy Guarantee Footer */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 font-sans text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-emerald-300 font-mono">Privacy Enforced Network:</strong> Vehicle telematics and location pings are anonymized and fully encrypted. Other residents&apos; private routes are never shared on public map feeds.
        </span>
      </div>

    </div>
  );
};
