import { EVVehicle, GridState, PriorityBreakdown } from '../types';

export interface SupabaseEvRecord {
  id: string;
  model: string;
  battery_soc: number;
  battery_capacity_kwh: number;
  target_soc: number;
  max_charging_rate_kw: number;
  current_charging_rate_kw: number;
  departure_time: string;
  priority_score: number;
  priority_level: string;
  is_connected: boolean;
  status: string;
  updated_at: string;
}

export interface SupabaseTelemetryRecord {
  id: string;
  timestamp: string;
  grid_limit_kw: number;
  building_demand_kw: number;
  solar_generation_kw: number;
  ev_charging_load_kw: number;
  available_capacity_kw: number;
  system_status: string;
  scenario: string;
}

export interface SupabaseDecisionRecord {
  id: string;
  timestamp: string;
  ev_id: string;
  allocated_kw: number;
  priority_score: number;
  battery_soc: number;
  departure_time: string;
  explanation: string;
}

// SQL Schema Definition for judges / deployment
export const SUPABASE_SQL_SCHEMA = `-- SMART EV CHARGING COMMAND CENTER - SUPABASE POSTGRESQL SCHEMA

-- 1. Table: ev_vehicles
CREATE TABLE IF NOT EXISTS ev_vehicles (
    id VARCHAR(20) PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    battery_soc NUMERIC(5,2) NOT NULL CHECK (battery_soc >= 0 AND battery_soc <= 100),
    battery_capacity_kwh NUMERIC(6,2) NOT NULL DEFAULT 60.0,
    target_soc NUMERIC(5,2) NOT NULL DEFAULT 80.0,
    max_charging_rate_kw NUMERIC(5,2) NOT NULL DEFAULT 11.0,
    current_charging_rate_kw NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    departure_time VARCHAR(20) NOT NULL,
    priority_score NUMERIC(5,2) NOT NULL DEFAULT 50.0,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    is_connected BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(30) NOT NULL DEFAULT 'STANDBY',
    consecutive_high_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: grid_telemetry
CREATE TABLE IF NOT EXISTS grid_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    grid_limit_kw NUMERIC(6,2) NOT NULL,
    building_demand_kw NUMERIC(6,2) NOT NULL,
    solar_generation_kw NUMERIC(6,2) NOT NULL,
    ev_charging_load_kw NUMERIC(6,2) NOT NULL,
    available_capacity_kw NUMERIC(6,2) NOT NULL,
    system_status VARCHAR(50) NOT NULL,
    scenario VARCHAR(50) NOT NULL
);

-- 3. Table: allocation_decisions (Explainability Audit Log)
CREATE TABLE IF NOT EXISTS allocation_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ev_id VARCHAR(20) REFERENCES ev_vehicles(id),
    allocated_kw NUMERIC(5,2) NOT NULL,
    priority_score NUMERIC(5,2) NOT NULL,
    explanation TEXT NOT NULL,
    battery_soc NUMERIC(5,2) NOT NULL,
    departure_time VARCHAR(20) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE ev_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_decisions ENABLE ROW LEVEL SECURITY;

-- 5. Public read/write policy for command center terminal
CREATE POLICY "Allow Command Center access" ON ev_vehicles FOR ALL USING (true);
CREATE POLICY "Allow Telemetry ingestion" ON grid_telemetry FOR ALL USING (true);
CREATE POLICY "Allow Decision logging" ON allocation_decisions FOR ALL USING (true);
`;

const LOCAL_STORAGE_KEY_EV = 'smart_ev_vehicles_db';
const LOCAL_STORAGE_KEY_DECISIONS = 'smart_ev_decisions_db';

class SupabaseDataService {
  private decisionsLog: SupabaseDecisionRecord[] = [];
  private telemetryLog: SupabaseTelemetryRecord[] = [];

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const savedDecisions = localStorage.getItem(LOCAL_STORAGE_KEY_DECISIONS);
      if (savedDecisions) {
        this.decisionsLog = JSON.parse(savedDecisions);
      }
    } catch {
      this.decisionsLog = [];
    }
  }

  public recordDecision(
    ev: EVVehicle,
    allocatedKw: number,
    breakdown: PriorityBreakdown
  ) {
    const record: SupabaseDecisionRecord = {
      id: 'dec-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ev_id: ev.id,
      allocated_kw: allocatedKw,
      priority_score: breakdown.finalScore,
      battery_soc: Math.round(ev.batterySoc),
      departure_time: ev.departureTime,
      explanation: breakdown.explanationText,
    };

    this.decisionsLog.unshift(record);
    if (this.decisionsLog.length > 50) {
      this.decisionsLog.pop();
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DECISIONS, JSON.stringify(this.decisionsLog.slice(0, 20)));
    } catch {
      // ignore
    }
  }

  public recordTelemetry(state: GridState) {
    const record: SupabaseTelemetryRecord = {
      id: 'telem-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      grid_limit_kw: state.gridLimitKw,
      building_demand_kw: state.buildingDemandKw,
      solar_generation_kw: state.solarGenerationKw,
      ev_charging_load_kw: state.evChargingLoadKw,
      available_capacity_kw: state.availableChargingCapacityKw,
      system_status: state.systemStatus,
      scenario: state.activeScenario,
    };

    this.telemetryLog.unshift(record);
    if (this.telemetryLog.length > 50) {
      this.telemetryLog.pop();
    }
  }

  public getRecentDecisions(limit = 10): SupabaseDecisionRecord[] {
    return this.decisionsLog.slice(0, limit);
  }

  public getRecentTelemetry(limit = 10): SupabaseTelemetryRecord[] {
    return this.telemetryLog.slice(0, limit);
  }

  public clearAll() {
    this.decisionsLog = [];
    this.telemetryLog = [];
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_DECISIONS);
    } catch {
      // ignore
    }
  }
}

export const supabaseService = new SupabaseDataService();
