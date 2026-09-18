import { EVVehicle, PriorityBreakdown, PriorityLevel } from '../types';

/**
 * Deterministic Transparent Priority Engine
 * Uses the exact project specification formula:
 * Priority = 48 × Battery Urgency + 35 × Departure Urgency + 15 × Required Energy + 18 × Renewable Availability
 *
 * Max theoretical base points = 48 + 35 + 15 + 18 = 116 points (normalized to 0-100 scale)
 */
export function calculateEvPriority(
  ev: EVVehicle,
  solarSurplusKw: number,
  solarGenerationKw: number,
  totalEvsCount: number
): PriorityBreakdown {
  if (!ev.isConnected || ev.batterySoc >= ev.targetSoc) {
    return {
      evId: ev.id,
      batteryUrgencyScore: 0,
      departureUrgencyScore: 0,
      requiredEnergyScore: 0,
      renewableAvailabilityScore: 0,
      weightedBatteryPoints: 0,
      weightedDeparturePoints: 0,
      weightedRequiredEnergyPoints: 0,
      weightedRenewablePoints: 0,
      rawScore: 0,
      fairnessAdjustment: 0,
      finalScore: 0,
      explanationText: ev.batterySoc >= ev.targetSoc 
        ? `Target SoC (${ev.targetSoc}%) reached. Battery topped up. Standby mode.` 
        : 'Vehicle disconnected from charging port.',
      keyDrivers: ['Standby / Disconnected'],
    };
  }

  // 1. Battery Urgency (0.0 to 1.0)
  // Higher urgency when current SOC is far below target SOC.
  // Quadratic weighting below 30% emphasizes critical depletion.
  const socDeficit = Math.max(0, ev.targetSoc - ev.batterySoc) / 100;
  let batteryUrgency = socDeficit;
  if (ev.batterySoc < 25) {
    batteryUrgency = Math.min(1, batteryUrgency * 1.25); // Critical reserve penalty
  }
  batteryUrgency = Math.max(0, Math.min(1, batteryUrgency));

  // 2. Departure Urgency (0.0 to 1.0)
  // Departure deadline intelligence: incorporates rate needed (kWh / remaining hours)
  // vs charger capability.
  // If vehicle leaves in 1h and needs 20 kWh, required power is 20 kW!
  const hours = Math.max(0.2, ev.departureHoursRemaining);
  const requiredEnergy = Math.max(0, (ev.batteryCapacityKwh * (ev.targetSoc - ev.batterySoc)) / 100);
  const requiredChargingRateKw = requiredEnergy / hours;
  
  // Normalized departure pressure:
  // Combines pure time-horizon urgency and charging rate feasibility
  const timeHorizonFactor = Math.max(0, Math.min(1, 1 - (hours - 0.5) / 10)); // <1h => ~0.95, 2h => ~0.85, 10h+ => ~0.05
  const rateFeasibilityFactor = Math.min(1.2, requiredChargingRateKw / Math.max(1, ev.maxChargingRateKw));
  
  let departureUrgency = 0.6 * timeHorizonFactor + 0.4 * Math.min(1, rateFeasibilityFactor);
  if (hours <= 1.5) {
    departureUrgency = Math.min(1, departureUrgency * 1.3); // Critical departure imminent
  }
  departureUrgency = Math.max(0, Math.min(1, departureUrgency));

  // 3. Required Energy Score (0.0 to 1.0)
  // Absolute energy volume required (normalized against a standard 75 kWh pack)
  const requiredEnergyScore = Math.max(0, Math.min(1, requiredEnergy / 65));

  // 4. Renewable Availability (0.0 to 1.0)
  // When clean energy surplus exists, all active EVs get an absorption incentive,
  // particularly vehicles that have capacity to absorb high charging rates.
  const surplusPerEv = solarSurplusKw / Math.max(1, totalEvsCount);
  const renewableRatio = solarGenerationKw > 0 ? Math.min(1, (solarGenerationKw / 25) * 0.5 + (surplusPerEv / 5) * 0.5) : 0;
  const renewableUrgency = Math.max(0, Math.min(1, renewableRatio));

  // Weighted Component Calculations (Section 8 spec)
  const weightedBattery = Math.round(48 * batteryUrgency * 10) / 10;
  const weightedDeparture = Math.round(35 * departureUrgency * 10) / 10;
  const weightedRequiredEnergy = Math.round(15 * requiredEnergyScore * 10) / 10;
  const weightedRenewable = Math.round(18 * renewableUrgency * 10) / 10;

  const rawSum = weightedBattery + weightedDeparture + weightedRequiredEnergy + weightedRenewable;
  // Normalize 116 theoretical max to 100 scale:
  const normalizedScore = Math.min(100, Math.round((rawSum / 116) * 100));

  // 5. Fairness Mechanism (Section 12 spec)
  // If an EV has had sustained high power (>7 kW) for >30 minutes while other EVs are waiting,
  // damp priority slightly (-5 to -15) so starved EVs get access.
  let fairnessAdj = 0;
  if (ev.consecutiveHighChargingMinutes > 40) {
    fairnessAdj = -12; // Dampen hogging vehicle
  } else if (ev.consecutiveHighChargingMinutes > 20) {
    fairnessAdj = -6;
  } else if (ev.consecutiveHighChargingMinutes === 0 && ev.batterySoc < 50) {
    fairnessAdj = +5; // Starvation boost for recently bypassed vehicle
  }

  const finalScore = Math.max(1, Math.min(100, normalizedScore + fairnessAdj));

  // Generate Key Drivers & Plain-English explanation
  const drivers: string[] = [];
  if (batteryUrgency > 0.65) drivers.push(`Depleted Battery (${Math.round(ev.batterySoc)}%)`);
  if (hours <= 2) drivers.push(`Imminent Departure (${hours < 1 ? Math.round(hours * 60) + ' min' : hours.toFixed(1) + ' hrs'})`);
  if (requiredChargingRateKw > ev.maxChargingRateKw * 0.8) drivers.push(`High Charge Rate Demand (${requiredChargingRateKw.toFixed(1)} kW needed)`);
  if (renewableUrgency > 0.5) drivers.push(`Solar Surplus Available (${solarSurplusKw.toFixed(1)} kW)`);
  if (fairnessAdj < 0) drivers.push(`Fairness Quota Applied (-${Math.abs(fairnessAdj)} pts)`);
  if (fairnessAdj > 0) drivers.push(`Anti-Starvation Boost (+${fairnessAdj} pts)`);

  let narrative = `${ev.id} priority score is ${finalScore}/100. `;
  if (departureUrgency > 0.7 && batteryUrgency > 0.6) {
    narrative += `High departure urgency (${hours.toFixed(1)}h remaining) coupled with depleted state (${Math.round(ev.batterySoc)}%) warrants primary allocation.`;
  } else if (departureUrgency > 0.7) {
    narrative += `Departure-deadline intelligence prioritized this vehicle because it departs in ${hours.toFixed(1)}h, needing ${requiredEnergy.toFixed(1)} kWh soonest.`;
  } else if (renewableUrgency > 0.6) {
    narrative += `Solar generation (${solarGenerationKw.toFixed(1)} kW) provided a clean-energy absorption boost.`;
  } else {
    narrative += `Standard operational pacing with ${requiredEnergy.toFixed(1)} kWh required before ${ev.departureTime}.`;
  }

  return {
    evId: ev.id,
    batteryUrgencyScore: batteryUrgency,
    departureUrgencyScore: departureUrgency,
    requiredEnergyScore,
    renewableAvailabilityScore: renewableUrgency,
    weightedBatteryPoints: weightedBattery,
    weightedDeparturePoints: weightedDeparture,
    weightedRequiredEnergyPoints: weightedRequiredEnergy,
    weightedRenewablePoints: weightedRenewable,
    rawScore: normalizedScore,
    fairnessAdjustment: fairnessAdj,
    finalScore,
    explanationText: narrative,
    keyDrivers: drivers,
  };
}

export function scoreToLevel(score: number): PriorityLevel {
  if (score >= 75) return 'VERY HIGH';
  if (score >= 50) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}
