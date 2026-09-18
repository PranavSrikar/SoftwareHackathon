import { EVVehicle, GridState, PriorityBreakdown } from '../types';

export interface AllocationResult {
  allocations: Record<string, number>; // evId -> kW
  totalEvLoadKw: number;
  availableCapacityKw: number;
  uncontrolledLoadKw: number;
  isOverloadPrevented: boolean;
  curtailedPowerKw: number;
  headroomKw: number;
  breakdowns: Record<string, PriorityBreakdown>;
}

/**
 * Intelligent Cluster Power Allocator
 * Guarantees that Building Demand + EV Charging Load never exceeds Grid Limit (taking into account solar)
 */
export function allocatePowerToEvs(
  vehicles: EVVehicle[],
  gridLimitKw: number,
  buildingDemandKw: number,
  solarGenerationKw: number,
  priorityBreakdowns: Record<string, PriorityBreakdown>
): AllocationResult {
  // 1. Calculate base available grid capacity before renewables
  const rawGridHeadroom = gridLimitKw - buildingDemandKw;
  
  // Solar energy generated on-site reduces building draw from grid.
  // Net building load drawn from grid = Math.max(0, buildingDemandKw - solarGenerationKw)
  // Solar surplus (if any) = Math.max(0, solarGenerationKw - buildingDemandKw)
  const solarSurplusKw = Math.max(0, solarGenerationKw - buildingDemandKw);
  
  // Total safe charging capacity available for EV cluster:
  // If solar offsets building, grid has more room. If building exceeds solar, remaining grid capacity is (gridLimit - (building - solar)).
  const netBuildingFromGrid = Math.max(0, buildingDemandKw - solarGenerationKw);
  const maxSafeGridDrawForEvs = Math.max(0, gridLimitKw - netBuildingFromGrid);
  
  // Total charging power available (from grid capacity + solar surplus)
  const availableChargingCapacityKw = Math.max(0, Math.min(gridLimitKw, maxSafeGridDrawForEvs + solarSurplusKw));

  // 2. Identify active charging candidates
  const eligibleVehicles = vehicles.filter(
    (ev) => ev.isConnected && ev.batterySoc < ev.targetSoc
  );

  // Theoretical uncontrolled load if every EV charged at its maximum speed:
  const uncontrolledEvLoad = eligibleVehicles.reduce((sum, ev) => sum + ev.maxChargingRateKw, 0);
  const potentialTotalGridLoad = buildingDemandKw + uncontrolledEvLoad - solarGenerationKw;
  const isOverloadCondition = potentialTotalGridLoad > gridLimitKw;

  const allocations: Record<string, number> = {};
  vehicles.forEach((ev) => {
    allocations[ev.id] = 0;
  });

  if (eligibleVehicles.length === 0 || availableChargingCapacityKw <= 0.1) {
    return {
      allocations,
      totalEvLoadKw: 0,
      availableCapacityKw: availableChargingCapacityKw,
      uncontrolledLoadKw: potentialTotalGridLoad,
      isOverloadPrevented: isOverloadCondition && availableChargingCapacityKw < uncontrolledEvLoad,
      curtailedPowerKw: isOverloadCondition ? Math.max(0, potentialTotalGridLoad - gridLimitKw) : 0,
      headroomKw: Math.max(0, gridLimitKw - netBuildingFromGrid),
      breakdowns: priorityBreakdowns,
    };
  }

  // 3. Multi-Pass Proportional Intelligent Distribution
  // Sort eligible EVs by priority score descending
  const sortedEligible = [...eligibleVehicles].sort((a, b) => {
    const scoreA = priorityBreakdowns[a.id]?.finalScore ?? a.priorityScore;
    const scoreB = priorityBreakdowns[b.id]?.finalScore ?? b.priorityScore;
    return scoreB - scoreA;
  });

  // Calculate sum of priority scores
  const totalScore = sortedEligible.reduce(
    (sum, ev) => sum + Math.max(5, priorityBreakdowns[ev.id]?.finalScore ?? ev.priorityScore),
    0
  );

  let remainingCapacity = availableChargingCapacityKw;

  // Pass 1: Allocate fair baseline (if capacity allows, ensure each EV gets at least 1.4 kW trickle unless capacity is super tight)
  const minTrickleKw = 1.4;
  const canGiveAllTrickle = availableChargingCapacityKw >= sortedEligible.length * minTrickleKw;

  if (canGiveAllTrickle && sortedEligible.length > 1) {
    // Reserve minimum trickle for lower priority vehicles to ensure fairness
    sortedEligible.forEach((ev) => {
      allocations[ev.id] = minTrickleKw;
      remainingCapacity -= minTrickleKw;
    });
  }

  // Pass 2: Distribute remaining capacity according to normalized priority weight
  // Iterative cap allocation to respect maxChargingRateKw
  let activePool = [...sortedEligible];
  let poolScore = activePool.reduce(
    (sum, ev) => sum + Math.max(5, priorityBreakdowns[ev.id]?.finalScore ?? ev.priorityScore),
    0
  );

  let maxIterations = 5;
  while (remainingCapacity > 0.05 && activePool.length > 0 && maxIterations > 0) {
    maxIterations--;
    let capacityDistributedInThisPass = 0;
    const cappedThisPass: string[] = [];

    for (const ev of activePool) {
      const evScore = Math.max(5, priorityBreakdowns[ev.id]?.finalScore ?? ev.priorityScore);
      const shareRatio = poolScore > 0 ? evScore / poolScore : 1 / activePool.length;
      const proposedAddition = remainingCapacity * shareRatio;
      
      const currentAlloc = allocations[ev.id] || 0;
      const roomToMax = ev.maxChargingRateKw - currentAlloc;

      if (proposedAddition >= roomToMax) {
        // Vehicle reaches max charging capability
        allocations[ev.id] = ev.maxChargingRateKw;
        capacityDistributedInThisPass += roomToMax;
        cappedThisPass.push(ev.id);
      } else {
        allocations[ev.id] = currentAlloc + proposedAddition;
        capacityDistributedInThisPass += proposedAddition;
      }
    }

    remainingCapacity = Math.max(0, remainingCapacity - capacityDistributedInThisPass);
    // Remove capped EVs from subsequent proportional passes
    activePool = activePool.filter((ev) => !cappedThisPass.includes(ev.id));
    poolScore = activePool.reduce(
      (sum, ev) => sum + Math.max(5, priorityBreakdowns[ev.id]?.finalScore ?? ev.priorityScore),
      0
    );
  }

  // 4. Strict Safety Guard & Clean Rounding
  // Never exceed availableChargingCapacityKw or EV max rate
  let totalEvAllocated = 0;
  vehicles.forEach((ev) => {
    let val = Math.max(0, allocations[ev.id] || 0);
    val = Math.min(val, ev.maxChargingRateKw);
    // round to 1 decimal place
    val = Math.round(val * 10) / 10;
    allocations[ev.id] = val;
    totalEvAllocated += val;
  });

  // If due to rounding totalEvAllocated slightly overshoots available, trim from lowest priority
  if (totalEvAllocated > availableChargingCapacityKw) {
    let overshoot = totalEvAllocated - availableChargingCapacityKw;
    const lowestFirst = [...sortedEligible].reverse();
    for (const ev of lowestFirst) {
      if (overshoot <= 0) break;
      const curr = allocations[ev.id];
      const deduct = Math.min(curr, overshoot);
      allocations[ev.id] = Math.round((curr - deduct) * 10) / 10;
      overshoot -= deduct;
    }
  }

  // Final sum
  const finalTotalEvLoadKw = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const roundedFinalEvLoad = Math.round(finalTotalEvLoadKw * 10) / 10;

  const actualGridDraw = Math.max(0, buildingDemandKw + roundedFinalEvLoad - solarGenerationKw);
  const curtailedPower = isOverloadCondition 
    ? Math.max(0, Math.round((potentialTotalGridLoad - gridLimitKw) * 10) / 10) 
    : 0;

  return {
    allocations,
    totalEvLoadKw: roundedFinalEvLoad,
    availableCapacityKw: Math.round(availableChargingCapacityKw * 10) / 10,
    uncontrolledLoadKw: Math.round(potentialTotalGridLoad * 10) / 10,
    isOverloadPrevented: isOverloadCondition,
    curtailedPowerKw: curtailedPower,
    headroomKw: Math.max(0, Math.round((gridLimitKw - actualGridDraw) * 10) / 10),
    breakdowns: priorityBreakdowns,
  };
}
