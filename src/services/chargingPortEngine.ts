import { FlatRecord, ChargingPort } from '../types';
import { getAllFlats } from './flatsData';

export interface PriorityResult {
  priorityScore: number;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityString: string;
}

export interface FivePortAllocationSummary {
  ports: ChargingPort[];
  activeCount: number;
  totalPorts: number;
  userPort: ChargingPort | null;
  userWaitTimeMinutes: number;
  userQueuePosition: number | null;
  nextAvailablePortMinutes: number;
  nextAvailablePortId: number;
  allPortFinishMinutes: { portId: number; flatNumber: number | null; minutes: number }[];
  fairExplanation: string;
}

/**
 * Multi-factor Smart Priority Algorithm:
 * - Battery Deficit: How much charge is missing to reach the target
 * - Departure Urgency: Time left until departure
 * - Energy Required (kWh): Large batteries requiring significant energy are balanced fairly
 * - Reserve Penalty: Under 25% battery receives an emergency boost
 */
export function calculateFlatPriority(
  currentSoc: number,
  targetSoc: number,
  departureHours: number,
  batteryCapacityKwh: number = 60,
  maxChargingRateKw: number = 11.0
): PriorityResult {
  const socDeficit = Math.max(0, targetSoc - currentSoc);
  
  if (socDeficit <= 0) {
    return {
      priorityScore: 0,
      priorityLevel: 'LOW',
      priorityString: 'Topped Up (Score 0)',
    };
  }

  // 1. Deficit points (0 to 45)
  const deficitRatio = socDeficit / 100;
  let deficitPoints = deficitRatio * 45;
  if (currentSoc < 25) {
    deficitPoints = Math.min(48, deficitPoints * 1.2); // Reserve penalty boost
  }

  // 2. Departure Urgency points (0 to 35)
  const hours = Math.max(0.3, departureHours);
  const urgencyFactor = Math.min(1.0, 1 / (hours * 0.85));
  const departurePoints = urgencyFactor * 35;

  // 3. Energy Requirement & Power Feasibility points (0 to 20)
  const kwhNeeded = (socDeficit / 100) * batteryCapacityKwh;
  const energyPoints = Math.min(20, (kwhNeeded / 50) * 20);

  const rawScore = Math.round(deficitPoints + departurePoints + energyPoints);
  const finalScore = Math.max(5, Math.min(99, rawScore));

  let priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (finalScore >= 80 || hours <= 1.0) {
    priorityLevel = 'CRITICAL';
  } else if (finalScore >= 65 || hours <= 2.5) {
    priorityLevel = 'HIGH';
  } else if (finalScore >= 45) {
    priorityLevel = 'MEDIUM';
  } else {
    priorityLevel = 'LOW';
  }

  const priorityString = `${priorityLevel === 'CRITICAL' ? 'P1' : priorityLevel === 'HIGH' ? 'P2' : priorityLevel === 'MEDIUM' ? 'P3' : 'P4'} - ${priorityLevel} (${finalScore}/100)`;

  return {
    priorityScore: finalScore,
    priorityLevel,
    priorityString,
  };
}

/**
 * 5-Port Community Allocation and Queue Wait Time Engine:
 * - Total Ports: 5
 * - Top 5 active flats needing charge are assigned to Ports 1 through 5.
 * - Remaining vehicles needing charge are placed in a waiting queue with computed wait times.
 */
export function allocateFiveChargingPorts(
  flats: FlatRecord[],
  targetFlatNumber: number
): {
  updatedFlats: FlatRecord[];
  summary: FivePortAllocationSummary;
} {
  // 1. Separate candidates needing charge vs unplugged/topped up
  const activeCandidates = flats
    .filter((f) => f.isConnected && f.currentChargePercent < f.departureGoalPercent)
    .map((f) => {
      const prio = calculateFlatPriority(
        f.currentChargePercent,
        f.departureGoalPercent,
        f.departureHoursRemaining,
        f.batteryCapacityKwh,
        f.maxChargingRateKw
      );
      return {
        ...f,
        priorityScore: prio.priorityScore,
        priorityLevel: prio.priorityLevel,
        priority: prio.priorityString,
      };
    });

  // Sort candidates by priorityScore descending, then sooner departure
  activeCandidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return a.departureHoursRemaining - b.departureHoursRemaining;
  });

  // 2. Initialize the 5 Charging Ports
  const portIds = [1, 2, 3, 4, 5] as const;
  const ports: ChargingPort[] = portIds.map((id) => ({
    portId: id,
    portLabel: `Port ${id}`,
    status: 'AVAILABLE' as const,
    activeFlatNumber: null,
    activeVehicleNumber: null,
    activeModel: null,
    currentSoc: 0,
    targetSoc: 0,
    chargingRateKw: 0,
    kwhRemaining: 0,
    minutesRemaining: 0,
    priorityScore: 0,
    priorityLevel: 'AVAILABLE',
  }));

  // Track the parallel completion minute timeline for the 5 ports
  const portFreeTimelineMinutes = [35, 48, 22, 60, 15];

  // 3. Assign up to 5 highest-priority vehicles to the 5 ports
  const topAssigned = activeCandidates.slice(0, 5);
  const queuedCandidates = activeCandidates.slice(5);

  topAssigned.forEach((flat, index) => {
    const port = ports[index];
    const kwhNeeded = ((flat.departureGoalPercent - flat.currentChargePercent) / 100) * flat.batteryCapacityKwh;
    const rateKw = Math.max(3.3, Math.min(flat.maxChargingRateKw, flat.currentChargingSpeedKw || 7.4));
    const minutesToFinish = Math.max(10, Math.round((kwhNeeded / rateKw) * 55));

    port.status = 'CHARGING';
    port.activeFlatNumber = flat.flatNumber;
    port.activeVehicleNumber = flat.vehicleNumber;
    port.activeModel = flat.model;
    port.currentSoc = flat.currentChargePercent;
    port.targetSoc = flat.departureGoalPercent;
    port.chargingRateKw = rateKw;
    port.kwhRemaining = Math.round(kwhNeeded * 10) / 10;
    port.minutesRemaining = minutesToFinish;
    port.priorityScore = flat.priorityScore;
    port.priorityLevel = flat.priorityLevel;

    portFreeTimelineMinutes[index] = minutesToFinish;
  });

  // 4. Calculate wait time for queued vehicles
  const queuedWithWaitTimes = queuedCandidates.map((qFlat, qIndex) => {
    let earliestPortIdx = 0;
    let minTime = portFreeTimelineMinutes[0];
    for (let p = 1; p < 5; p++) {
      if (portFreeTimelineMinutes[p] < minTime) {
        minTime = portFreeTimelineMinutes[p];
        earliestPortIdx = p;
      }
    }

    const waitTime = Math.round(minTime + (qIndex * 15));
    portFreeTimelineMinutes[earliestPortIdx] += 25; // add estimated next session block

    return {
      ...qFlat,
      status: 'Queued' as const,
      assignedPort: null,
      expectedPortId: (earliestPortIdx + 1) as 1 | 2 | 3 | 4 | 5,
      waitTimeMinutes: waitTime,
      queuePosition: qIndex + 1,
    };
  });

  // 5. Build full updated flats list
  const activeMap = new Map<number, FlatRecord>();
  topAssigned.forEach((f, idx) => {
    activeMap.set(f.flatNumber, {
      ...f,
      status: 'Charging',
      assignedPort: (idx + 1) as 1 | 2 | 3 | 4 | 5,
      waitTimeMinutes: 0,
      queuePosition: 0,
    });
  });
  queuedWithWaitTimes.forEach((f) => {
    activeMap.set(f.flatNumber, f);
  });

  const updatedFlats = flats.map((orig) => {
    if (activeMap.has(orig.flatNumber)) {
      return activeMap.get(orig.flatNumber)!;
    }
    const isTopped = orig.currentChargePercent >= orig.departureGoalPercent;
    const prio = calculateFlatPriority(
      orig.currentChargePercent,
      orig.departureGoalPercent,
      orig.departureHoursRemaining,
      orig.batteryCapacityKwh,
      orig.maxChargingRateKw
    );
    return {
      ...orig,
      priorityScore: prio.priorityScore,
      priorityLevel: prio.priorityLevel,
      priority: isTopped ? 'Topped Up' : prio.priorityString,
      status: isTopped ? ('Fully Charged' as const) : orig.isConnected ? ('Idle (Plugged)' as const) : ('Unplugged' as const),
      assignedPort: null,
      waitTimeMinutes: 0,
      queuePosition: undefined,
    };
  });

  // 6. Build summary for the target flat
  const targetUpdated = updatedFlats.find((f) => f.flatNumber === targetFlatNumber);
  const userPort = targetUpdated?.assignedPort
    ? ports.find((p) => p.portId === targetUpdated.assignedPort) || null
    : null;

  const allPortFinishMinutes = ports.map((p) => ({
    portId: p.portId,
    flatNumber: p.activeFlatNumber,
    minutes: p.minutesRemaining,
  }));

  const activePortsFinishing = [...allPortFinishMinutes].filter((p) => p.minutes > 0);
  activePortsFinishing.sort((a, b) => a.minutes - b.minutes);

  const nextAvailablePortMinutes = activePortsFinishing.length > 0 ? activePortsFinishing[0].minutes : 15;
  const nextAvailablePortId = activePortsFinishing.length > 0 ? activePortsFinishing[0].portId : 1;

  let fairExplanation = '';
  if (userPort) {
    fairExplanation = `Flat ${targetFlatNumber} is currently assigned to Port ${userPort.portId} based on high priority score (${targetUpdated?.priorityScore}/100) and departure urgency.`;
  } else if (targetUpdated?.status === 'Queued') {
    fairExplanation = `All 5 community ports are currently busy. Flat ${targetFlatNumber} is placed in the fair queue at position #${targetUpdated.queuePosition} with an estimated wait time of ${targetUpdated.waitTimeMinutes} mins.`;
  } else if (targetUpdated?.currentChargePercent && targetUpdated.departureGoalPercent && targetUpdated.currentChargePercent >= targetUpdated.departureGoalPercent) {
    fairExplanation = `Flat ${targetFlatNumber} has reached its target state of charge (${targetUpdated.departureGoal}). Charging port was automatically released for other community residents.`;
  } else {
    fairExplanation = `Flat ${targetFlatNumber} is currently unplugged. Plug in to join the intelligent community charging queue.`;
  }

  return {
    updatedFlats,
    summary: {
      ports,
      activeCount: ports.filter((p) => p.status === 'CHARGING').length,
      totalPorts: 5,
      userPort,
      userWaitTimeMinutes: targetUpdated?.waitTimeMinutes ?? 0,
      userQueuePosition: targetUpdated?.queuePosition ?? null,
      nextAvailablePortMinutes,
      nextAvailablePortId,
      allPortFinishMinutes,
      fairExplanation,
    },
  };
}

export function getFivePortSummary(
  targetFlatNumber: number,
  customFlats?: FlatRecord[]
): FivePortAllocationSummary {
  const flatsToUse = customFlats && customFlats.length > 0 ? customFlats : getAllFlats();
  return allocateFiveChargingPorts(flatsToUse, targetFlatNumber).summary;
}
