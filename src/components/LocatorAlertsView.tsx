import React, { useState, useMemo } from 'react';
import {
  Download,
  Plus,
  Search,
  MessageSquare,
  Phone,
  Shield,
  Zap,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Send,
  Sliders
} from 'lucide-react';

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  distanceMiles: number;
  totalPorts: number;
  availablePorts: number;
  powerKw: number;
  connectors: string[];
  status: 'Operational' | 'Maintenance' | 'Full';
  estimatedWaitMinutes: number;
}

const INITIAL_STATIONS: ChargingStation[] = [
  {
    id: 'station-1',
    name: 'Metropolis Plaza Super Hub',
    address: '452 Broadway, Metropolis',
    distanceMiles: 0.8,
    totalPorts: 12,
    availablePorts: 9,
    powerKw: 250,
    connectors: ['NACS', 'CCS1'],
    status: 'Operational',
    estimatedWaitMinutes: 0
  },
  {
    id: 'station-2',
    name: 'Greenfield Retail DC Fast',
    address: '1099 Elm Blvd, Greenfield',
    distanceMiles: 1.4,
    totalPorts: 8,
    availablePorts: 2,
    powerKw: 150,
    connectors: ['CCS1', 'CHAdeMO'],
    status: 'Operational',
    estimatedWaitMinutes: 8
  },
  {
    id: 'station-3',
    name: 'Oakwood Community Level 2',
    address: '88 Park Lane, Oakwood',
    distanceMiles: 2.1,
    totalPorts: 6,
    availablePorts: 0,
    powerKw: 22,
    connectors: ['Type 2'],
    status: 'Full',
    estimatedWaitMinutes: 25
  },
  {
    id: 'station-4',
    name: 'Airport Express Highway Hub',
    address: 'Terminal 2 Rd, Int Airport',
    distanceMiles: 3.5,
    totalPorts: 16,
    availablePorts: 12,
    powerKw: 350,
    connectors: ['NACS', 'CCS1'],
    status: 'Operational',
    estimatedWaitMinutes: 0
  },
  {
    id: 'station-5',
    name: 'Eastside Shopping Center',
    address: '2211 Market St, Eastside',
    distanceMiles: 4.2,
    totalPorts: 4,
    availablePorts: 1,
    powerKw: 50,
    connectors: ['CCS1', 'Type 2'],
    status: 'Operational',
    estimatedWaitMinutes: 15
  },
  {
    id: 'station-6',
    name: 'Downtown Civic Parking Charger',
    address: '500 Civic Center Dr, Downtown',
    distanceMiles: 4.8,
    totalPorts: 8,
    availablePorts: 0,
    powerKw: 150,
    connectors: ['NACS', 'CHAdeMO'],
    status: 'Maintenance',
    estimatedWaitMinutes: 999 // Not available
  }
];

export const LocatorAlertsView: React.FC = () => {
  // Database States
  const [stations, setStations] = useState<ChargingStation[]>(INITIAL_STATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConnector, setFilterConnector] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // New Station insertion Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationAddress, setNewStationAddress] = useState('');
  const [newStationDistance, setNewStationDistance] = useState('1.5');
  const [newStationPorts, setNewStationPorts] = useState('6');
  const [newStationAvailable, setNewStationAvailable] = useState('4');
  const [newStationPower, setNewStationPower] = useState('150');
  const [newStationConnectors, setNewStationConnectors] = useState<string[]>(['CCS1']);
  const [newStationStatus, setNewStationStatus] = useState<'Operational' | 'Maintenance' | 'Full'>('Operational');

  // Alerts Configuration States
  const [ownerName, setOwnerName] = useState('John Doe');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 019-2834');
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyVoiceCall, setNotifyVoiceCall] = useState(false);
  const [warnLowBattery, setWarnLowBattery] = useState(true);
  const [warnBatteryFull, setWarnBatteryFull] = useState(true);
  const [lowBatteryThreshold, setLowBatteryThreshold] = useState(20);
  
  // Simulated Alert Notification Display
  const [simulatedNotifications, setSimulatedNotifications] = useState<{
    id: string;
    timestamp: string;
    type: 'SMS' | 'WHATSAPP' | 'VOICE';
    title: string;
    message: string;
    style: string;
  }[]>([
    {
      id: 'n-0',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'WHATSAPP',
      title: 'WhatsApp Setup Active',
      message: '✅ GreenGrid alert gateway connected. You will now receive charging warnings on this number.',
      style: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
    }
  ]);

  // Handle station insertion
  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName || !newStationAddress) return;

    const ports = parseInt(newStationPorts) || 1;
    const available = parseInt(newStationAvailable) || 0;
    const status = available === 0 ? 'Full' : newStationStatus;

    // Estimate simple wait time
    let wait = 0;
    if (status === 'Full') {
      wait = 15 + Math.floor(Math.random() * 20);
    } else if (status === 'Maintenance') {
      wait = 999;
    }

    const newStation: ChargingStation = {
      id: `station-${Date.now()}`,
      name: newStationName,
      address: newStationAddress,
      distanceMiles: parseFloat(newStationDistance) || 1.0,
      totalPorts: ports,
      availablePorts: available,
      powerKw: parseInt(newStationPower) || 50,
      connectors: newStationConnectors,
      status: status,
      estimatedWaitMinutes: wait
    };

    setStations([newStation, ...stations]);
    
    // Reset Form
    setNewStationName('');
    setNewStationAddress('');
    setNewStationDistance('1.5');
    setNewStationPorts('6');
    setNewStationAvailable('4');
    setNewStationPower('150');
    setNewStationConnectors(['CCS1']);
    setNewStationStatus('Operational');
    setShowAddForm(false);
  };

  // Toggle dynamic connector selections in Form
  const toggleFormConnector = (conn: string) => {
    if (newStationConnectors.includes(conn)) {
      if (newStationConnectors.length > 1) {
        setNewStationConnectors(newStationConnectors.filter(c => c !== conn));
      }
    } else {
      setNewStationConnectors([...newStationConnectors, conn]);
    }
  };

  // Delete station from database
  const handleDeleteStation = (id: string) => {
    setStations(stations.filter(s => s.id !== id));
  };

  // Filtered station database
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            station.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesConnector = filterConnector === 'All' || 
                               station.connectors.includes(filterConnector);
      
      const matchesStatus = filterStatus === 'All' || 
                            station.status === filterStatus;
      
      return matchesSearch && matchesConnector && matchesStatus;
    });
  }, [stations, searchTerm, filterConnector, filterStatus]);

  // Export database to CSV
  const handleDownloadCSV = () => {
    const headers = ['Station Name', 'Address', 'Distance (mi)', 'Total Ports', 'Available Ports', 'Power (kW)', 'Connectors', 'Status', 'Wait Time (mins)'];
    const rows = stations.map(s => [
      s.name,
      s.address,
      s.distanceMiles,
      s.totalPorts,
      s.availablePorts,
      s.powerKw,
      s.connectors.join(' / '),
      s.status,
      s.estimatedWaitMinutes === 999 ? 'N/A (Maintenance)' : s.estimatedWaitMinutes
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ev_charging_stations_db.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export database to JSON
  const handleDownloadJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(stations, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'ev_charging_stations_db.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Trigger simulated notification alerts
  const handleSimulateAlert = (scenario: 'LOW' | 'FULL') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alertsToSend: typeof simulatedNotifications = [];

    if (scenario === 'LOW') {
      if (!warnLowBattery) return;
      const messageText = `⚠️ ALERT [Low Battery]: Hey ${ownerName}, your EV battery has dropped to 14%. Your configured safety threshold is ${lowBatteryThreshold}%. Find nearby chargers on your GreenGrid portal immediately!`;
      
      if (notifySms) {
        alertsToSend.push({
          id: `n-sms-${Date.now()}`,
          timestamp: now,
          type: 'SMS',
          title: `SMS Gateway Alert to ${phoneNumber}`,
          message: messageText,
          style: 'border-amber-500/30 bg-amber-950/20 text-amber-300'
        });
      }
      if (notifyWhatsapp) {
        alertsToSend.push({
          id: `n-wa-${Date.now()}`,
          timestamp: now,
          type: 'WHATSAPP',
          title: `WhatsApp Business to ${phoneNumber}`,
          message: `🟢 WhatsApp Notification:\n${messageText}`,
          style: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
        });
      }
      if (notifyVoiceCall) {
        alertsToSend.push({
          id: `n-voice-${Date.now()}`,
          timestamp: now,
          type: 'VOICE',
          title: `Voice Robot Call outbound to ${phoneNumber}`,
          message: `📞 [Synthesized Voice Call]: "Hello ${ownerName}. This is your GreenGrid EV monitor. Your battery level is at fourteen percent. This is below your set critical limit of ${lowBatteryThreshold} percent. Please find a nearby charging station."`,
          style: 'border-blue-500/30 bg-blue-950/20 text-blue-300'
        });
      }
    } else {
      if (!warnBatteryFull) return;
      const messageText = `⚡ CHARGING COMPLETE: Hi ${ownerName}, your EV battery charging at Port 3 is complete and is now at 100%. Please unplug your vehicle to allow others to charge and avoid waiting list idle fees!`;
      
      if (notifySms) {
        alertsToSend.push({
          id: `n-sms-${Date.now()}`,
          timestamp: now,
          type: 'SMS',
          title: `SMS Gateway Alert to ${phoneNumber}`,
          message: messageText,
          style: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300'
        });
      }
      if (notifyWhatsapp) {
        alertsToSend.push({
          id: `n-wa-${Date.now()}`,
          timestamp: now,
          type: 'WHATSAPP',
          title: `WhatsApp Business to ${phoneNumber}`,
          message: `🟢 WhatsApp Notification:\n${messageText}`,
          style: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
        });
      }
      if (notifyVoiceCall) {
        alertsToSend.push({
          id: `n-voice-${Date.now()}`,
          timestamp: now,
          type: 'VOICE',
          title: `Voice Robot Call outbound to ${phoneNumber}`,
          message: `📞 [Synthesized Voice Call]: "Greetings ${ownerName}. Your vehicle charging session is complete. The battery state of charge has reached one hundred percent. Kindly release the port for incoming drivers."`,
          style: 'border-blue-500/30 bg-blue-950/20 text-blue-300'
        });
      }
    }

    if (alertsToSend.length > 0) {
      setSimulatedNotifications(prev => [...alertsToSend, ...prev]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
      {/* COLUMN 1 & 2: NEARBY CHARGING STATIONS DATABASE & LOCATOR */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100 tracking-wide">
                  REAL-TIME CHARGING STATION LOCATOR
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Local database of nearby public EV chargers, live port availability, and calculated waiting times.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                title="Download entire charging database as CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download CSV</span>
              </button>
              <button
                onClick={handleDownloadJSON}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                title="Download database in JSON format"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Station</span>
              </button>
            </div>
          </div>

          {/* Form to insert new station directly into the local database */}
          {showAddForm && (
            <form onSubmit={handleAddStation} className="mb-6 p-4 rounded-lg border border-cyan-500/30 bg-slate-950/40 animate-in slide-in-from-top-3 duration-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add New Station to Database
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">STATION NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Westside Retail Fast Charge"
                    value={newStationName}
                    onChange={e => setNewStationName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">ADDRESS</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104 Highway Ave, Metropolis"
                    value={newStationAddress}
                    onChange={e => setNewStationAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">DISTANCE (MILES)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newStationDistance}
                    onChange={e => setNewStationDistance(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">MAX POWER OUTPUT (kW)</label>
                  <select
                    value={newStationPower}
                    onChange={e => setNewStationPower(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="22">22 kW (Level 2 AC)</option>
                    <option value="50">50 kW (Standard DC)</option>
                    <option value="150">150 kW (High Power DC)</option>
                    <option value="250">250 kW (Supercharger DC)</option>
                    <option value="350">350 kW (Ultra Fast DC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">TOTAL PLUG PORTS</label>
                  <input
                    type="number"
                    required
                    value={newStationPorts}
                    onChange={e => setNewStationPorts(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">AVAILABLE PLUGS</label>
                  <input
                    type="number"
                    required
                    value={newStationAvailable}
                    onChange={e => setNewStationAvailable(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">STATUS</label>
                  <select
                    value={newStationStatus}
                    onChange={e => setNewStationStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Full">Full (All Ports Occupied)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">CONNECTORS SUPPORTED</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['NACS', 'CCS1', 'Type 2', 'CHAdeMO'].map(conn => {
                      const isSelected = newStationConnectors.includes(conn);
                      return (
                        <button
                          key={conn}
                          type="button"
                          onClick={() => toggleFormConnector(conn)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {conn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-xs text-slate-950 font-bold transition-colors"
                >
                  Save to Database
                </button>
              </div>
            </form>
          )}

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 mb-4 rounded-lg bg-slate-950/50 border border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>
            <div>
              <select
                value={filterConnector}
                onChange={e => setFilterConnector(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Connectors</option>
                <option value="NACS">NACS (Tesla style)</option>
                <option value="CCS1">CCS1 (Combo standard)</option>
                <option value="Type 2">Type 2 (AC Level 2)</option>
                <option value="CHAdeMO">CHAdeMO (Fast AC/DC)</option>
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Statuses</option>
                <option value="Operational">Operational Only</option>
                <option value="Full">Full (All slots occupied)</option>
                <option value="Maintenance">Maintenance Only</option>
              </select>
            </div>
          </div>

          {/* Table list of stations */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">STATION & LOCATION</th>
                  <th className="py-2.5 px-3">POWER / PLUGS</th>
                  <th className="py-2.5 px-3">CONNECTORS</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-right">WAIT TIME</th>
                  <th className="py-2.5 px-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No matching stations found in the local database.
                    </td>
                  </tr>
                ) : (
                  filteredStations.map(s => {
                    let statusBadge = '';
                    if (s.status === 'Operational') {
                      statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    } else if (s.status === 'Full') {
                      statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                    } else {
                      statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                    }

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{s.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                            {s.address} ({s.distanceMiles} miles away)
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-300">{s.powerKw} kW DC</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Ports: <span className="font-semibold text-slate-200">{s.availablePorts}</span> / {s.totalPorts} free
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {s.connectors.map(c => (
                              <span key={c} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {s.estimatedWaitMinutes === 999 ? (
                            <span className="text-rose-500 font-semibold">—</span>
                          ) : s.estimatedWaitMinutes === 0 ? (
                            <span className="text-emerald-400 font-bold flex items-center justify-end gap-0.5">
                              <Zap className="w-2.5 h-2.5" /> No Wait
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold flex items-center justify-end gap-1">
                              <Clock className="w-2.5 h-2.5" /> {s.estimatedWaitMinutes} mins
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteStation(s.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete from local database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MATH ENGINE & EXPLANATION ON ESTIMATIONS */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Wait Time Mathematical Proof & OCPI Protocol
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard EV charging location wait times are derived via the <strong>Open Charge Point Interface (OCPI) protocol</strong> status endpoints. 
            When all physical charging plugs are active, the wait estimation engine aggregates active vehicle telematics (battery state-of-charge, peak vehicle charge curves, and average remaining session duration) to compute expected queue delays:
          </p>
          <div className="my-3 p-3 rounded bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-cyan-300 text-center">
            {"Estimated Wait Time = (Average Session Duration Left) / (Number of Fast DC Outlets)"}
          </div>
          <p className="text-xs text-slate-500">
            *This database structure is fully compliant with OCPI version 2.2.1 protocols, enabling native integration with major charge point operators (CPOs).
          </p>
        </div>
      </div>

      {/* COLUMN 3: SMS/WHATSAPP/VOICE SMART ALERT SETTINGS */}
      <div className="flex flex-col gap-6">
        
        {/* SETTINGS CARD */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">
              OWNER ALERT GATEWAY
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Configure automated Twilio and Meta API triggers. Receive calls and messages instantly when your battery drops too low, or is fully charged.
          </p>

          <div className="flex flex-col gap-4">
            {/* Owner Details */}
            <div>
              <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Mobile Contact (for API gateway)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Channels */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-2">ACTIVE CHANNELS (API ROUTING)</span>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SMS Alert Trigger (Twilio REST API)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={e => setNotifySms(e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Gateway (Meta Cloud API)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={e => setNotifyWhatsapp(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>Robotic Voice Call (Twilio TwiML)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyVoiceCall}
                    onChange={e => setNotifyVoiceCall(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Triggers & Limits */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-2">TRIGGER SETTINGS</span>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Low Battery Alert</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={warnLowBattery}
                    onChange={e => setWarnLowBattery(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500"
                  />
                </div>

                {warnLowBattery && (
                  <div className="pl-5">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>ALERT THRESHOLD</span>
                      <span className="text-cyan-400 font-bold">{lowBatteryThreshold}% SoC</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="35"
                      step="5"
                      value={lowBatteryThreshold}
                      onChange={e => setLowBatteryThreshold(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 h-1 rounded-lg bg-slate-800"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Full Battery Alert (100% SoC)</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={warnBatteryFull}
                    onChange={e => setWarnBatteryFull(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ALERT SIMULATOR PREVIEW PANEL */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> LIVE SMS/WHATSAPP SIMULATOR
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Trigger vehicle battery scenarios below to simulate API dispatch.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSimulateAlert('LOW')}
              className="px-3 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500 bg-amber-950/10 hover:bg-amber-950/20 text-xs font-semibold text-amber-300 transition-all flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Simulate Low Soc</span>
            </button>
            <button
              onClick={() => handleSimulateAlert('FULL')}
              className="px-3 py-2 rounded-lg border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/10 hover:bg-emerald-950/20 text-xs font-semibold text-emerald-300 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Simulate Charged</span>
            </button>
          </div>

          {/* SIMULATED DEVICE LOGS */}
          <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 h-64 overflow-y-auto flex flex-col gap-2">
            <span className="block text-[9px] font-mono font-bold text-slate-500 tracking-wider">OUTBOUND SMS GATEWAY WEBHOOKS</span>
            {simulatedNotifications.map(item => (
              <div key={item.id} className={`p-2.5 rounded border text-xs font-mono leading-relaxed ${item.style}`}>
                <div className="flex items-center justify-between mb-1 text-[9px] text-slate-400 font-sans font-bold">
                  <span>{item.title}</span>
                  <span>{item.timestamp}</span>
                </div>
                <div>{item.message}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
