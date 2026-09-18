import { FlatRecord } from '../types';
import { 
  getAllFlats, 
  getFlatByNumber, 
  updateFlatDeparture, 
  updateFlatSession, 
  getFivePortSummary 
} from './flatsData';
import { FivePortAllocationSummary } from './chargingPortEngine';

export interface FlatApiResponse {
  success: boolean;
  flat?: FlatRecord;
  portSummary?: FivePortAllocationSummary;
  message?: string;
  speedBoostKw?: number;
  previousSpeedKw?: number;
  timestamp: string;
}

export interface FlatSessionUpdateResponse {
  success: boolean;
  flat?: FlatRecord;
  summary?: FivePortAllocationSummary;
  message?: string;
  timestamp: string;
}

export interface AllFlatsApiResponse {
  success: boolean;
  count: number;
  data: FlatRecord[];
  timestamp: string;
}

/**
 * Fetch EV charging status and details for a specific flat number
 * Calls API endpoint /api/flats/:flatNumber with seamless local fallback
 */
export const fetchFlatDetailsByNumber = async (flatNumber: number): Promise<FlatApiResponse> => {
  const cleanNum = Number(flatNumber);
  if (isNaN(cleanNum) || cleanNum < 1 || cleanNum > 300) {
    return {
      success: false,
      message: `Invalid Flat number "${flatNumber}". Please enter a valid flat number between 1 and 300.`,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`/api/flats/${cleanNum}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        flat: data.flat ?? data,
        message: `Retrieved EV status for Flat ${cleanNum} via API endpoint /api/flats/${cleanNum}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Network or offline fallback
  }

  // Fallback to in-memory dataset
  const localFlat = getFlatByNumber(cleanNum);
  if (localFlat) {
    return {
      success: true,
      flat: localFlat,
      message: `Retrieved EV status for Flat ${cleanNum} (Vehicle: ${localFlat.vehicleNumber})`,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    message: `Flat ${cleanNum} not found in the community database.`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Update departure time for a specific flat, recalculating speed if earlier
 * Calls POST /api/flats/:flatNumber/departure with local fallback
 */
export const updateFlatDepartureTimeApi = async (
  flatNumber: number,
  hoursRemaining: number
): Promise<FlatApiResponse> => {
  const cleanNum = Number(flatNumber);

  try {
    const response = await fetch(`/api/flats/${cleanNum}/departure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursRemaining }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        flat: data.flat,
        speedBoostKw: data.speedBoostKw,
        previousSpeedKw: data.previousSpeedKw,
        message: data.message ?? `Departure time updated for Flat ${cleanNum}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Fallback
  }

  // Local fallback
  try {
    const result = updateFlatDeparture(cleanNum, hoursRemaining);
    return {
      success: true,
      flat: result.flat,
      speedBoostKw: result.speedBoostKw,
      previousSpeedKw: result.previousSpeedKw,
      message: result.speedBoostKw > 0
        ? `Earlier departure requested. Smart controller increased charging rate by +${result.speedBoostKw.toFixed(1)} kW!`
        : `Updated departure time for Flat ${cleanNum}.`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to update departure time.',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Get all 30 flats via API
 */
export const fetchAllFlatsApi = async (): Promise<AllFlatsApiResponse> => {
  try {
    const response = await fetch('/api/flats', {
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        count: (data.data || data).length,
        data: data.data || data,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Fallback
  }

  const flats = getAllFlats();
  return {
    success: true,
    count: flats.length,
    data: flats,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Update Flat's current battery, target charge, and departure time in dataset
 * Runs Priority calculation and Fair 5-Port allocation
 */
export const updateFlatSessionApi = async (
  flatNumber: number,
  currentSoc: number,
  targetSoc: number,
  departureHours: number
): Promise<FlatSessionUpdateResponse> => {
  const cleanNum = Number(flatNumber);

  try {
    const response = await fetch(`/api/flats/${cleanNum}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSoc, targetSoc, departureHours }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        flat: data.flat,
        summary: data.summary,
        message: data.message ?? `Flat ${cleanNum} updated with priority ${data.flat?.priority}.`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Network fallback
  }

  // Local fallback
  try {
    const result = updateFlatSession(cleanNum, currentSoc, targetSoc, departureHours);
    return {
      success: true,
      flat: result.flat,
      summary: result.summary,
      message: `Flat ${cleanNum} updated in community dataset. Priority: ${result.flat.priority}.`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to update flat session.',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Fetch status of the 5 community charging ports
 */
export const fetchFivePortSummaryApi = async (targetFlatNumber: number = 1): Promise<FivePortAllocationSummary> => {
  try {
    const response = await fetch('/api/flats/ports', {
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.summary) {
        return data.summary;
      }
    }
  } catch {
    // Fallback
  }

  return getFivePortSummary(targetFlatNumber);
};

