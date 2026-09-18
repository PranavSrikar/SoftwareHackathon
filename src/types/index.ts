export type PriorityLevel = 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SystemStatus = 
  | 'SAFE'
  | 'CAUTION'
  | 'HIGH DEMAND'
  | 'OVERLOAD PREVENTED'
  | 'CLEAN ENERGY AVAILABLE'
  | 'RENEWABLE DROP';

export type ScenarioType = 
  | 'NORMAL'
  | 'GRID_STRESS'
  | 'SOLAR_SURPLUS'
  | 'RENEWABLE_DROP'
  | 'EV_ARRIVAL';

export interface EVVehicle {
  id: string; // e.g. 'EV-01'
  model: string; // e.g. 'Tesla Model 3'
  batterySoc: number; // 0 to 100%
  batteryCapacityKwh: number; // e.g. 60 kWh
  targetSoc: number; // e.g. 80% or 100%
  maxChargingRateKw: number; // e.g. 11 kW
  currentChargingRateKw: number; // calculated dynamically
  departureTime: string; // e.g. '07:00' or ISO time
  departureHoursRemaining: number; // dynamically updated
  requiredEnergyKwh: number; // calculated: capacity * (target - soc)/100
  priorityScore: number; // 0 to 100
  priorityLevel: PriorityLevel;
  isConnected: boolean;
  status: 'CHARGING' | 'OPTIMIZED' | 'STANDBY' | 'TOPPED_UP' | 'DISCONNECTED';
  consecutiveHighChargingMinutes: number; // for fairness algorithm
  totalChargedKwh: number;
  fairnessFactor: number; // 1.0 = normal, < 1.0 = dampened if hogging, > 1.0 if starved
  arrivalOrder: number;
}

export interface PriorityBreakdown {
  evId: string;
  batteryUrgencyScore: number; // 0-1
  departureUrgencyScore: number; // 0-1
  requiredEnergyScore: number; // 0-1
  renewableAvailabilityScore: number; // 0-1
  weightedBatteryPoints: number; // max 48
  weightedDeparturePoints: number; // max 35
  weightedRequiredEnergyPoints: number; // max 15
  weightedRenewablePoints: number; // max 18
  rawScore: number;
  fairnessAdjustment: number;
  finalScore: number;
  explanationText: string;
  keyDrivers: string[];
}

export interface GridState {
  gridLimitKw: number; // 50 kW
  transformerCapacityKw: number; // 60 kW
  buildingDemandKw: number; // e.g. 30 kW
  solarGenerationKw: number; // e.g. 14.5 kW
  evChargingLoadKw: number; // sum of active EV rates
  totalLoadKw: number; // buildingDemandKw + evChargingLoadKw
  availableGridCapacityKw: number; // gridLimitKw - buildingDemandKw
  solarSurplusKw: number; // Math.max(0, solarGenerationKw - buildingDemandKw)
  availableChargingCapacityKw: number; // dynamic charging headroom
  systemStatus: SystemStatus;
  statusMessage: string;
  activeScenario: ScenarioType;
  lastOverloadPrevention?: {
    uncontrolledLoadKw: number;
    controlledLoadKw: number;
    curtailedKw: number;
    timestamp: string;
  } | null;
}

export interface TelemetryPoint {
  time: string;
  gridLimit: number;
  totalLoad: number;
  buildingDemand: number;
  evChargingLoad: number;
  solarGeneration: number;
  availableCapacity: number;
}

export interface SupabaseRecord {
  id: string;
  created_at: string;
  event_type: string;
  details: Record<string, any>;
}

export interface ChargingPort {
  portId: 1 | 2 | 3 | 4 | 5;
  portLabel: string; // e.g. "Port 1"
  status: 'CHARGING' | 'AVAILABLE';
  activeFlatNumber: number | null;
  activeVehicleNumber: string | null;
  activeModel: string | null;
  currentSoc: number;
  targetSoc: number;
  chargingRateKw: number;
  kwhRemaining: number;
  minutesRemaining: number;
  priorityScore: number;
  priorityLevel: string;
}

export interface FlatRecord {
  flatNumber: number; // 1 to 30
  flatLabel: string; // e.g. "Flat 1"
  vehicleNumber: string; // e.g. "TS 09 EA 4120"
  model: string; // e.g. "Tesla Model 3"
  status: 'Charging' | 'Idle (Plugged)' | 'Unplugged' | 'Fully Charged' | 'Queued';
  currentCharge: string; // e.g. "45%"
  currentChargePercent: number; // 45
  currentChargingSpeed: string; // e.g. "7.4 kW"
  currentChargingSpeedKw: number; // 7.4
  currentRange: string; // e.g. "185 km"
  currentRangeKm: number; // 185
  departureGoal: string; // e.g. "85%"
  departureGoalPercent: number; // 85
  scheduledDepartureTime: string; // e.g. "07:30 AM"
  departureHoursRemaining: number; // e.g. 1.5
  batteryCapacityKwh: number; // e.g. 60
  maxChargingRateKw: number; // e.g. 11.0
  isConnected: boolean;
  boostedEarlier?: boolean;
  priority: string; // e.g. "P1 - CRITICAL (Score 92)" or "P2 - HIGH"
  priorityScore: number; // 0 to 100
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedPort?: number | null; // 1 to 5 if charging, null if waiting in queue
  waitTimeMinutes?: number; // 0 if currently charging, or estimated wait time
  queuePosition?: number; // 1, 2, ... if queued
  expectedPortId?: number | null; // port that this queued vehicle is assigned to wait for
  phoneNumber?: string; // e.g. "+919876543210" - private field
}

export interface SolarHourForecast {
  time: string; // "12:00"
  solarKw: number; // 22.5
  cloudCoverPercent: number; // 15
}

export interface SolarWeatherData {
  temperatureC: number;
  condition: string; // "Sunny / Clear" | "Partly Cloudy" | "Overcast" | "Rain"
  cloudCoverPercent: number;
  solarIrradianceKw: number;
  uvIndex: number;
  windSpeedKmh: number;
  sunriseTime: string;
  sunsetTime: string;
  forecast: SolarHourForecast[];
  dataSource: 'LIVE API' | 'SIMULATION' | 'DATABASE';
  lastUpdated: string;
}

export type NotificationType = 
  | 'LOW_BATTERY'
  | 'PORT_AVAILABLE'
  | 'CHARGING_COMPLETE'
  | 'DEPARTURE_RISK'
  | 'GRID_WARNING'
  | 'TRANSFORMER_ALERT';

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'IN_APP';
export type NotificationStatus = 'Pending' | 'Sent' | 'Delivered' | 'Failed';
export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export interface NotificationRecord {
  id: string;
  flatNumber?: number;
  recipientPhoneMasked: string; // "+91 ******4821"
  alertType: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  severity: NotificationSeverity;
  timestamp: string;
  relatedPortId?: number;
  relatedEvId?: string;
  isRead: boolean;
}

export interface NotificationPreferences {
  lowBatteryAlert: boolean;
  lowBatteryThreshold: number; // e.g. 20%
  portAvailableAlert: boolean;
  chargingCompleteAlert: boolean;
  departureRiskAlert: boolean;
  gridWarningAlert: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
}

export interface DistributionNode {
  id: string;
  name: string;
  type: 'GRID' | 'SUBSTATION' | 'FEEDER' | 'TRANSFORMER' | 'BUILDING' | 'EV_CLUSTER';
  voltageKv: number;
  currentPowerKw: number;
  capacityKw: number;
  utilizationPercent: number;
  safeLimitKw?: number;
  status: 'NORMAL' | 'WARNING' | 'HIGH' | 'OVERLOAD';
  details: string;
}

export interface StationMapItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  totalPorts: number;
  availablePorts: number;
  occupiedPorts: number;
  currentPowerKw: number;
  maxPowerKw: number;
  utilizationPercent: number;
  estimatedWaitMins: number;
  renewablePercent: number;
  status: 'AVAILABLE' | 'MODERATE' | 'CONGESTED';
  isFastCharger: boolean;
}

export type { FivePortAllocationSummary } from '../services/chargingPortEngine';
