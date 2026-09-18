import * as XLSX from 'xlsx';
import { FlatRecord, EVVehicle } from '../types';
import { 
  calculateFlatPriority, 
  allocateFiveChargingPorts, 
  FivePortAllocationSummary 
} from './chargingPortEngine';

// Initial dataset of 30 cars registered to 30 different flats (Flat 1 to Flat 30)
const rawInitialFlats = [
  {
    flatNumber: 1,
    flatLabel: 'Flat 1',
    vehicleNumber: 'TS 09 EA 4120',
    model: 'Tesla Model 3',
    status: 'Charging',
    currentCharge: '45%',
    currentChargePercent: 45,
    currentChargingSpeed: '7.4 kW',
    currentChargingSpeedKw: 7.4,
    currentRange: '185 km',
    currentRangeKm: 185,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '07:30 AM',
    departureHoursRemaining: 1.5,
    batteryCapacityKwh: 60,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 2,
    flatLabel: 'Flat 2',
    vehicleNumber: 'DL 01 EV 8821',
    model: 'Hyundai Ioniq 5',
    status: 'Charging',
    currentCharge: '38%',
    currentChargePercent: 38,
    currentChargingSpeed: '6.8 kW',
    currentChargingSpeedKw: 6.8,
    currentRange: '155 km',
    currentRangeKm: 155,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '08:00 AM',
    departureHoursRemaining: 2.0,
    batteryCapacityKwh: 72,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 3,
    flatLabel: 'Flat 3',
    vehicleNumber: 'KA 05 MN 9012',
    model: 'Tata Nexon EV',
    status: 'Charging',
    currentCharge: '52%',
    currentChargePercent: 52,
    currentChargingSpeed: '3.3 kW',
    currentChargingSpeedKw: 3.3,
    currentRange: '160 km',
    currentRangeKm: 160,
    departureGoal: '90%',
    departureGoalPercent: 90,
    scheduledDepartureTime: '09:30 AM',
    departureHoursRemaining: 3.5,
    batteryCapacityKwh: 40,
    maxChargingRateKw: 7.2,
    isConnected: true,
  },
  {
    flatNumber: 4,
    flatLabel: 'Flat 4',
    vehicleNumber: 'MH 02 BZ 3344',
    model: 'Porsche Taycan',
    status: 'Charging',
    currentCharge: '28%',
    currentChargePercent: 28,
    currentChargingSpeed: '9.6 kW',
    currentChargingSpeedKw: 9.6,
    currentRange: '120 km',
    currentRangeKm: 120,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '07:00 AM',
    departureHoursRemaining: 1.0,
    batteryCapacityKwh: 93,
    maxChargingRateKw: 22.0,
    isConnected: true,
  },
  {
    flatNumber: 5,
    flatLabel: 'Flat 5',
    vehicleNumber: 'TS 08 FG 5511',
    model: 'MG ZS EV',
    status: 'Charging',
    currentCharge: '64%',
    currentChargePercent: 64,
    currentChargingSpeed: '4.2 kW',
    currentChargingSpeedKw: 4.2,
    currentRange: '235 km',
    currentRangeKm: 235,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '10:00 AM',
    departureHoursRemaining: 4.0,
    batteryCapacityKwh: 50,
    maxChargingRateKw: 7.4,
    isConnected: true,
  },
  {
    flatNumber: 6,
    flatLabel: 'Flat 6',
    vehicleNumber: 'HR 26 DK 7701',
    model: 'Kia EV6',
    status: 'Charging',
    currentCharge: '72%',
    currentChargePercent: 72,
    currentChargingSpeed: '3.6 kW',
    currentChargingSpeedKw: 3.6,
    currentRange: '310 km',
    currentRangeKm: 310,
    departureGoal: '90%',
    departureGoalPercent: 90,
    scheduledDepartureTime: '11:15 AM',
    departureHoursRemaining: 5.25,
    batteryCapacityKwh: 77,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 7,
    flatLabel: 'Flat 7',
    vehicleNumber: 'KL 07 CZ 2289',
    model: 'BMW i4',
    status: 'Charging',
    currentCharge: '35%',
    currentChargePercent: 35,
    currentChargingSpeed: '8.4 kW',
    currentChargingSpeedKw: 8.4,
    currentRange: '165 km',
    currentRangeKm: 165,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '07:45 AM',
    departureHoursRemaining: 1.75,
    batteryCapacityKwh: 83,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 8,
    flatLabel: 'Flat 8',
    vehicleNumber: 'TN 09 BK 6632',
    model: 'BYD Atto 3',
    status: 'Charging',
    currentCharge: '48%',
    currentChargePercent: 48,
    currentChargingSpeed: '5.5 kW',
    currentChargingSpeedKw: 5.5,
    currentRange: '200 km',
    currentRangeKm: 200,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '09:00 AM',
    departureHoursRemaining: 3.0,
    batteryCapacityKwh: 60,
    maxChargingRateKw: 7.4,
    isConnected: true,
  },
  {
    flatNumber: 9,
    flatLabel: 'Flat 9',
    vehicleNumber: 'AP 10 EL 4410',
    model: 'Mahindra XUV400',
    status: 'Idle (Plugged)',
    currentCharge: '82%',
    currentChargePercent: 82,
    currentChargingSpeed: '0.0 kW',
    currentChargingSpeedKw: 0.0,
    currentRange: '280 km',
    currentRangeKm: 280,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '12:00 PM',
    departureHoursRemaining: 6.0,
    batteryCapacityKwh: 39,
    maxChargingRateKw: 7.2,
    isConnected: true,
  },
  {
    flatNumber: 10,
    flatLabel: 'Flat 10',
    vehicleNumber: 'GJ 01 ER 8890',
    model: 'Audi e-tron',
    status: 'Charging',
    currentCharge: '31%',
    currentChargePercent: 31,
    currentChargingSpeed: '11.0 kW',
    currentChargingSpeedKw: 11.0,
    currentRange: '135 km',
    currentRangeKm: 135,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '06:45 AM',
    departureHoursRemaining: 0.75,
    batteryCapacityKwh: 95,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 11,
    flatLabel: 'Flat 11',
    vehicleNumber: 'UP 32 ES 1234',
    model: 'Volvo XC40 Recharge',
    status: 'Charging',
    currentCharge: '58%',
    currentChargePercent: 58,
    currentChargingSpeed: '5.2 kW',
    currentChargingSpeedKw: 5.2,
    currentRange: '225 km',
    currentRangeKm: 225,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '08:30 AM',
    departureHoursRemaining: 2.5,
    batteryCapacityKwh: 78,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 12,
    flatLabel: 'Flat 12',
    vehicleNumber: 'WB 02 ET 5678',
    model: 'Mercedes-Benz EQB',
    status: 'Charging',
    currentCharge: '41%',
    currentChargePercent: 41,
    currentChargingSpeed: '7.0 kW',
    currentChargingSpeedKw: 7.0,
    currentRange: '170 km',
    currentRangeKm: 170,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '07:15 AM',
    departureHoursRemaining: 1.25,
    batteryCapacityKwh: 66,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 13,
    flatLabel: 'Flat 13',
    vehicleNumber: 'TS 07 EV 9901',
    model: 'Tata Punch EV',
    status: 'Charging',
    currentCharge: '60%',
    currentChargePercent: 60,
    currentChargingSpeed: '3.3 kW',
    currentChargingSpeedKw: 3.3,
    currentRange: '175 km',
    currentRangeKm: 175,
    departureGoal: '90%',
    departureGoalPercent: 90,
    scheduledDepartureTime: '10:30 AM',
    departureHoursRemaining: 4.5,
    batteryCapacityKwh: 35,
    maxChargingRateKw: 7.2,
    isConnected: true,
  },
  {
    flatNumber: 14,
    flatLabel: 'Flat 14',
    vehicleNumber: 'KA 03 EU 2345',
    model: 'Hyundai Kona Electric',
    status: 'Fully Charged',
    currentCharge: '100%',
    currentChargePercent: 100,
    currentChargingSpeed: '0.0 kW',
    currentChargingSpeedKw: 0.0,
    currentRange: '390 km',
    currentRangeKm: 390,
    departureGoal: '100%',
    departureGoalPercent: 100,
    scheduledDepartureTime: '06:30 AM',
    departureHoursRemaining: 0.5,
    batteryCapacityKwh: 64,
    maxChargingRateKw: 7.4,
    isConnected: true,
  },
  {
    flatNumber: 15,
    flatLabel: 'Flat 15',
    vehicleNumber: 'MH 12 EW 6789',
    model: 'Tesla Model Y',
    status: 'Charging',
    currentCharge: '44%',
    currentChargePercent: 44,
    currentChargingSpeed: '8.8 kW',
    currentChargingSpeedKw: 8.8,
    currentRange: '210 km',
    currentRangeKm: 210,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '07:30 AM',
    departureHoursRemaining: 1.5,
    batteryCapacityKwh: 75,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 16,
    flatLabel: 'Flat 16',
    vehicleNumber: 'DL 04 EX 3456',
    model: 'MG Comet EV',
    status: 'Unplugged',
    currentCharge: '68%',
    currentChargePercent: 68,
    currentChargingSpeed: '0.0 kW',
    currentChargingSpeedKw: 0.0,
    currentRange: '135 km',
    currentRangeKm: 135,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '01:00 PM',
    departureHoursRemaining: 7.0,
    batteryCapacityKwh: 17,
    maxChargingRateKw: 3.3,
    isConnected: false,
  },
  {
    flatNumber: 17,
    flatLabel: 'Flat 17',
    vehicleNumber: 'TN 11 EY 7890',
    model: 'Citroen eC3',
    status: 'Charging',
    currentCharge: '50%',
    currentChargePercent: 50,
    currentChargingSpeed: '3.3 kW',
    currentChargingSpeedKw: 3.3,
    currentRange: '145 km',
    currentRangeKm: 145,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '09:45 AM',
    departureHoursRemaining: 3.75,
    batteryCapacityKwh: 29,
    maxChargingRateKw: 7.2,
    isConnected: true,
  },
  {
    flatNumber: 18,
    flatLabel: 'Flat 18',
    vehicleNumber: 'KL 01 EZ 4567',
    model: 'Tata Tiago EV',
    status: 'Charging',
    currentCharge: '62%',
    currentChargePercent: 62,
    currentChargingSpeed: '3.1 kW',
    currentChargingSpeedKw: 3.1,
    currentRange: '140 km',
    currentRangeKm: 140,
    departureGoal: '90%',
    departureGoalPercent: 90,
    scheduledDepartureTime: '10:00 AM',
    departureHoursRemaining: 4.0,
    batteryCapacityKwh: 24,
    maxChargingRateKw: 7.2,
    isConnected: true,
  },
  {
    flatNumber: 19,
    flatLabel: 'Flat 19',
    vehicleNumber: 'HR 51 FA 8901',
    model: 'Kia Niro EV',
    status: 'Charging',
    currentCharge: '55%',
    currentChargePercent: 55,
    currentChargingSpeed: '5.8 kW',
    currentChargingSpeedKw: 5.8,
    currentRange: '230 km',
    currentRangeKm: 230,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '08:45 AM',
    departureHoursRemaining: 2.75,
    batteryCapacityKwh: 64,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 20,
    flatLabel: 'Flat 20',
    vehicleNumber: 'AP 16 FB 5678',
    model: 'Lotus Eletre',
    status: 'Charging',
    currentCharge: '22%',
    currentChargePercent: 22,
    currentChargingSpeed: '11.0 kW',
    currentChargingSpeedKw: 11.0,
    currentRange: '110 km',
    currentRangeKm: 110,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '06:15 AM',
    departureHoursRemaining: 0.25,
    batteryCapacityKwh: 112,
    maxChargingRateKw: 22.0,
    isConnected: true,
  },
  {
    flatNumber: 21,
    flatLabel: 'Flat 21',
    vehicleNumber: 'GJ 06 FC 9012',
    model: 'Mini Cooper SE',
    status: 'Charging',
    currentCharge: '66%',
    currentChargePercent: 66,
    currentChargingSpeed: '4.8 kW',
    currentChargingSpeedKw: 4.8,
    currentRange: '130 km',
    currentRangeKm: 130,
    departureGoal: '90%',
    departureGoalPercent: 90,
    scheduledDepartureTime: '09:15 AM',
    departureHoursRemaining: 3.25,
    batteryCapacityKwh: 32,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 22,
    flatLabel: 'Flat 22',
    vehicleNumber: 'UP 16 FD 2345',
    model: 'Jaguar I-PACE',
    status: 'Charging',
    currentCharge: '40%',
    currentChargePercent: 40,
    currentChargingSpeed: '7.8 kW',
    currentChargingSpeedKw: 7.8,
    currentRange: '175 km',
    currentRangeKm: 175,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '07:45 AM',
    departureHoursRemaining: 1.75,
    batteryCapacityKwh: 90,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 23,
    flatLabel: 'Flat 23',
    vehicleNumber: 'TS 10 FE 6789',
    model: 'Polestar 2',
    status: 'Charging',
    currentCharge: '49%',
    currentChargePercent: 49,
    currentChargingSpeed: '6.4 kW',
    currentChargingSpeedKw: 6.4,
    currentRange: '240 km',
    currentRangeKm: 240,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '08:15 AM',
    departureHoursRemaining: 2.25,
    batteryCapacityKwh: 78,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 24,
    flatLabel: 'Flat 24',
    vehicleNumber: 'KA 04 FF 3456',
    model: 'Genesis GV60',
    status: 'Charging',
    currentCharge: '37%',
    currentChargePercent: 37,
    currentChargingSpeed: '7.6 kW',
    currentChargingSpeedKw: 7.6,
    currentRange: '160 km',
    currentRangeKm: 160,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '07:30 AM',
    departureHoursRemaining: 1.5,
    batteryCapacityKwh: 77,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 25,
    flatLabel: 'Flat 25',
    vehicleNumber: 'MH 04 FG 7890',
    model: 'Porsche Macan EV',
    status: 'Charging',
    currentCharge: '33%',
    currentChargePercent: 33,
    currentChargingSpeed: '9.2 kW',
    currentChargingSpeedKw: 9.2,
    currentRange: '180 km',
    currentRangeKm: 180,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '07:00 AM',
    departureHoursRemaining: 1.0,
    batteryCapacityKwh: 100,
    maxChargingRateKw: 22.0,
    isConnected: true,
  },
  {
    flatNumber: 26,
    flatLabel: 'Flat 26',
    vehicleNumber: 'DL 08 FH 4567',
    model: 'Ford Mustang Mach-E',
    status: 'Charging',
    currentCharge: '54%',
    currentChargePercent: 54,
    currentChargingSpeed: '6.0 kW',
    currentChargingSpeedKw: 6.0,
    currentRange: '235 km',
    currentRangeKm: 235,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '08:30 AM',
    departureHoursRemaining: 2.5,
    batteryCapacityKwh: 88,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 27,
    flatLabel: 'Flat 27',
    vehicleNumber: 'TN 02 FJ 8901',
    model: 'Nissan Ariya',
    status: 'Charging',
    currentCharge: '61%',
    currentChargePercent: 61,
    currentChargingSpeed: '4.5 kW',
    currentChargingSpeedKw: 4.5,
    currentRange: '275 km',
    currentRangeKm: 275,
    departureGoal: '90%',
    departureGoalPercent: 90,
    scheduledDepartureTime: '09:45 AM',
    departureHoursRemaining: 3.75,
    batteryCapacityKwh: 87,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 28,
    flatLabel: 'Flat 28',
    vehicleNumber: 'KL 08 FK 1234',
    model: 'BYD Seal',
    status: 'Charging',
    currentCharge: '46%',
    currentChargePercent: 46,
    currentChargingSpeed: '7.2 kW',
    currentChargingSpeedKw: 7.2,
    currentRange: '255 km',
    currentRangeKm: 255,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '08:00 AM',
    departureHoursRemaining: 2.0,
    batteryCapacityKwh: 82,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 29,
    flatLabel: 'Flat 29',
    vehicleNumber: 'HR 29 FL 5678',
    model: 'Skoda Enyaq',
    status: 'Idle (Plugged)',
    currentCharge: '79%',
    currentChargePercent: 79,
    currentChargingSpeed: '0.0 kW',
    currentChargingSpeedKw: 0.0,
    currentRange: '360 km',
    currentRangeKm: 360,
    departureGoal: '80%',
    departureGoalPercent: 80,
    scheduledDepartureTime: '11:00 AM',
    departureHoursRemaining: 5.0,
    batteryCapacityKwh: 77,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
  {
    flatNumber: 30,
    flatLabel: 'Flat 30',
    vehicleNumber: 'TS 11 FM 9012',
    model: 'Volkswagen ID.4',
    status: 'Charging',
    currentCharge: '51%',
    currentChargePercent: 51,
    currentChargingSpeed: '6.2 kW',
    currentChargingSpeedKw: 6.2,
    currentRange: '230 km',
    currentRangeKm: 230,
    departureGoal: '85%',
    departureGoalPercent: 85,
    scheduledDepartureTime: '08:30 AM',
    departureHoursRemaining: 2.5,
    batteryCapacityKwh: 77,
    maxChargingRateKw: 11.0,
    isConnected: true,
  },
];

// Map raw records to full FlatRecord with Priority and 5-port scheduling
export const initialFlatsDataset: FlatRecord[] = rawInitialFlats.map((f, index) => {
  const prio = calculateFlatPriority(
    f.currentChargePercent,
    f.departureGoalPercent,
    f.departureHoursRemaining,
    f.batteryCapacityKwh,
    f.maxChargingRateKw
  );
  const defaultPhone = `+9198765${(4821 + index).toString().padStart(5, '0')}`;
  return {
    ...f,
    phoneNumber: defaultPhone,
    status: f.status as FlatRecord['status'],
    priority: prio.priorityString,
    priorityScore: prio.priorityScore,
    priorityLevel: prio.priorityLevel,
    assignedPort: null,
    waitTimeMinutes: 0,
    queuePosition: undefined,
  };
});

// Run initial 5-port allocation
const initialAlloc = allocateFiveChargingPorts(initialFlatsDataset, 1);

export const completeFlatsDataset: FlatRecord[] = [...initialAlloc.updatedFlats];

// In-memory state store for the 30 flats
let currentFlatsState: FlatRecord[] = [...initialAlloc.updatedFlats];
let latestPortSummary: FivePortAllocationSummary = initialAlloc.summary;

export const getAllFlats = (): FlatRecord[] => {
  return currentFlatsState;
};

export const getFlatByNumber = (flatNum: number): FlatRecord | undefined => {
  return currentFlatsState.find((f) => f.flatNumber === Number(flatNum));
};

export const getFivePortSummary = (targetFlatNumber: number = 1): FivePortAllocationSummary => {
  const alloc = allocateFiveChargingPorts(currentFlatsState, targetFlatNumber);
  currentFlatsState = alloc.updatedFlats;
  latestPortSummary = alloc.summary;
  return latestPortSummary;
};

/**
 * Update a flat's battery, target goal, and departure time in the dataset.
 * Recalculates the priority levels and updates the 'priority' column.
 * Recalculates 5 charging ports and fair wait time across the community.
 */
export const updateFlatSession = (
  flatNum: number,
  currentSoc: number,
  targetSoc: number,
  departureHours: number
): {
  flat: FlatRecord;
  allFlats: FlatRecord[];
  summary: FivePortAllocationSummary;
} => {
  const index = currentFlatsState.findIndex((f) => f.flatNumber === Number(flatNum));
  if (index === -1) {
    throw new Error(`Flat ${flatNum} not found in community database (valid: 1-30).`);
  }

  const current = currentFlatsState[index];
  const boundedSoc = Math.max(0, Math.min(100, Math.round(currentSoc)));
  const boundedTarget = Math.max(boundedSoc, Math.min(100, Math.round(targetSoc)));
  const boundedHours = Math.max(0.2, Math.round(departureHours * 10) / 10);

  // Compute departure time string from hours remaining
  const now = new Date();
  const depDate = new Date(now.getTime() + boundedHours * 3600 * 1000);
  const hours = depDate.getHours();
  const minutes = depDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const scheduledDepartureTime = `${formattedHours}:${formattedMinutes} ${ampm}`;

  // Estimate new range based on battery capacity (avg ~5.2 km/kWh)
  const estimatedRangeKm = Math.round((boundedSoc / 100) * current.batteryCapacityKwh * 5.2);

  // Update this specific flat
  currentFlatsState[index] = {
    ...current,
    currentChargePercent: boundedSoc,
    currentCharge: `${boundedSoc}%`,
    departureGoalPercent: boundedTarget,
    departureGoal: `${boundedTarget}%`,
    departureHoursRemaining: boundedHours,
    scheduledDepartureTime,
    currentRangeKm: estimatedRangeKm,
    currentRange: `${estimatedRangeKm} km`,
    isConnected: true,
  };

  // Re-run fair 5-port allocation & priority recalculation across the entire community
  const alloc = allocateFiveChargingPorts(currentFlatsState, flatNum);
  currentFlatsState = alloc.updatedFlats;
  latestPortSummary = alloc.summary;

  const updatedFlat = currentFlatsState.find((f) => f.flatNumber === Number(flatNum))!;

  return {
    flat: updatedFlat,
    allFlats: currentFlatsState,
    summary: alloc.summary,
  };
};

// Calculate and apply earlier departure boost
export const updateFlatDeparture = (
  flatNum: number, 
  newHoursRemaining: number
): { flat: FlatRecord; speedBoostKw: number; previousSpeedKw: number; summary: FivePortAllocationSummary } => {
  const index = currentFlatsState.findIndex((f) => f.flatNumber === Number(flatNum));
  if (index === -1) {
    throw new Error(`Flat ${flatNum} not found in database (valid flats: 1-30).`);
  }

  const current = currentFlatsState[index];
  const prevSpeed = current.currentChargingSpeedKw;
  const isEarlier = newHoursRemaining < current.departureHoursRemaining;

  // Energy needed in kWh
  const socDeficit = Math.max(0, current.departureGoalPercent - current.currentChargePercent);
  const kwhNeeded = (socDeficit / 100) * current.batteryCapacityKwh;

  // Calculate required kW power to finish before departure
  const effectiveHours = Math.max(0.3, newHoursRemaining);
  let targetKw = kwhNeeded / effectiveHours;

  let newSpeedKw = current.currentChargingSpeedKw;
  if (isEarlier && socDeficit > 0) {
    targetKw = Math.max(targetKw, prevSpeed + 2.5);
    newSpeedKw = Math.min(current.maxChargingRateKw, Math.round(targetKw * 10) / 10);
    if (newSpeedKw <= prevSpeed) {
      newSpeedKw = Math.min(current.maxChargingRateKw, Math.round((prevSpeed + 2.2) * 10) / 10);
    }
  } else if (!isEarlier) {
    newSpeedKw = Math.max(1.8, Math.min(prevSpeed, Math.round((kwhNeeded / effectiveHours) * 10) / 10));
  }

  const now = new Date();
  const depDate = new Date(now.getTime() + newHoursRemaining * 3600 * 1000);
  const hours = depDate.getHours();
  const minutes = depDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const newDepartureTimeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;

  currentFlatsState[index] = {
    ...current,
    status: current.isConnected ? 'Charging' : 'Unplugged',
    departureHoursRemaining: newHoursRemaining,
    scheduledDepartureTime: newDepartureTimeStr,
    currentChargingSpeedKw: current.isConnected ? newSpeedKw : 0.0,
    currentChargingSpeed: `${(current.isConnected ? newSpeedKw : 0.0).toFixed(1)} kW`,
    boostedEarlier: isEarlier,
  };

  const alloc = allocateFiveChargingPorts(currentFlatsState, flatNum);
  currentFlatsState = alloc.updatedFlats;
  latestPortSummary = alloc.summary;

  const updatedFlat = currentFlatsState.find((f) => f.flatNumber === Number(flatNum))!;

  return {
    flat: updatedFlat,
    speedBoostKw: Math.max(0, Math.round((newSpeedKw - prevSpeed) * 10) / 10),
    previousSpeedKw: prevSpeed,
    summary: alloc.summary,
  };
};

// Convert FlatRecord to EVVehicle for full compatibility with existing components
export const convertFlatToEVVehicle = (flat: FlatRecord): EVVehicle => {
  return {
    id: `FLAT-${flat.flatNumber}`,
    model: `${flat.model} (${flat.vehicleNumber})`,
    batterySoc: flat.currentChargePercent,
    batteryCapacityKwh: flat.batteryCapacityKwh,
    targetSoc: flat.departureGoalPercent,
    maxChargingRateKw: flat.maxChargingRateKw,
    currentChargingRateKw: flat.currentChargingSpeedKw,
    departureTime: flat.scheduledDepartureTime,
    departureHoursRemaining: flat.departureHoursRemaining,
    requiredEnergyKwh: ((flat.departureGoalPercent - flat.currentChargePercent) / 100) * flat.batteryCapacityKwh,
    priorityScore: flat.priorityScore,
    priorityLevel: flat.priorityLevel === 'CRITICAL' ? 'VERY HIGH' : flat.priorityLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
    isConnected: flat.isConnected,
    status: flat.currentChargePercent >= flat.departureGoalPercent ? 'TOPPED_UP' : flat.currentChargingSpeedKw > 0 ? 'CHARGING' : 'STANDBY',
    consecutiveHighChargingMinutes: 12,
    totalChargedKwh: 14.5,
    fairnessFactor: 1.0,
    arrivalOrder: flat.flatNumber,
  };
};

// Export to genuine Excel (.xlsx) file including the new Priority column
export const exportFlatsToExcel = (flats: FlatRecord[] = currentFlatsState): void => {
  const excelRows = flats.map((f) => ({
    'Flat Number': f.flatNumber,
    'Vehicle Number': f.vehicleNumber,
    'Model': f.model,
    'Status': f.status,
    'Current Charge': f.currentCharge,
    'Current Charging Speed': f.currentChargingSpeed,
    'Current Range': f.currentRange,
    'Departure Goal': f.departureGoal,
    'Scheduled Departure Time': f.scheduledDepartureTime,
    'Priority': f.priority,
    'Assigned Port / Wait Time': f.assignedPort 
      ? `Port ${f.assignedPort} (Charging Active)` 
      : f.status === 'Queued'
      ? `Queued (Approx. wait: ${f.waitTimeMinutes ?? 0} mins)`
      : f.status === 'Fully Charged'
      ? 'Fully Charged'
      : 'Unplugged',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  worksheet['!cols'] = [
    { wch: 14 }, // Flat Number
    { wch: 20 }, // Vehicle Number
    { wch: 22 }, // Model
    { wch: 18 }, // Status
    { wch: 16 }, // Current Charge
    { wch: 24 }, // Current Charging Speed
    { wch: 16 }, // Current Range
    { wch: 18 }, // Departure Goal
    { wch: 26 }, // Scheduled Departure Time
    { wch: 28 }, // Priority
    { wch: 34 }, // Assigned Port / Wait Time
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resident EV Charging');

  XLSX.writeFile(workbook, 'Resident_EV_Charging_Dataset_30_Flats.xlsx');
};

// Also generate CSV download as alternate format
export const exportFlatsToCsv = (flats: FlatRecord[] = currentFlatsState): void => {
  const headers = [
    'Flat Number',
    'Vehicle Number',
    'Model',
    'Status',
    'Current Charge',
    'Current Charging Speed',
    'Current Range',
    'Departure Goal',
    'Scheduled Departure Time',
    'Priority',
    'Assigned Port / Wait Time',
  ];

  const rows = flats.map((f) => [
    f.flatNumber,
    `"${f.vehicleNumber}"`,
    `"${f.model}"`,
    `"${f.status}"`,
    `"${f.currentCharge}"`,
    `"${f.currentChargingSpeed}"`,
    `"${f.currentRange}"`,
    `"${f.departureGoal}"`,
    `"${f.scheduledDepartureTime}"`,
    `"${f.priority}"`,
    `"${f.assignedPort ? `Port ${f.assignedPort} (Charging Active)` : f.status === 'Queued' ? `Queued (~${f.waitTimeMinutes ?? 0} mins)` : f.status}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Resident_EV_Charging_Dataset_30_Flats.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const updateFlatPhoneNumber = (flatNum: number, phoneNumber: string): FlatRecord => {
  const index = currentFlatsState.findIndex((f) => f.flatNumber === Number(flatNum));
  if (index === -1) {
    throw new Error(`Flat ${flatNum} not found.`);
  }
  currentFlatsState[index] = {
    ...currentFlatsState[index],
    phoneNumber,
  };
  return currentFlatsState[index];
};
