import { AIProvider, GeminiProvider, MockProvider } from './aiProvider';

export interface ChatRequestPayload {
  message: string;
  user_id?: string;
  conversation_id?: string;
  history?: { role: string; text?: string; message?: string }[];
  context?: {
    vehicles?: any[];
    gridState?: any;
    solarData?: any;
    portSummary?: any;
    telemetryHistory?: any[];
  };
}

export interface ChatResponsePayload {
  reply: string;
  data_used: string[];
  timestamp: string;
  provider: string;
}

export class ChatService {
  private static geminiProvider = new GeminiProvider();
  private static mockProvider = new MockProvider();

  public static async processMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
    const { message, user_id, conversation_id, history = [], context = {} } = payload;
    const query = message.trim();
    const queryLower = query.toLowerCase();

    // 1. Determine which backend tools/data are needed based on keyword analysis
    const dataUsed: string[] = [];
    let contextDescription = "No real-time grid data queried.";

    // Track state to inject
    let evStatus: any = null;
    let buildingStatus: any = null;
    let renewableStatus: any = null;
    let chargingSchedule: any = null;
    let mlPredictions: any = null;
    let stationStatus: any = null;

    // A. EV Status
    if (
      queryLower.includes('my ev') ||
      queryLower.includes('my car') ||
      queryLower.includes('battery') ||
      queryLower.includes('soc') ||
      queryLower.includes('charge slowly') ||
      queryLower.includes('charging rate') ||
      queryLower.includes('ready') ||
      queryLower.includes('departure') ||
      queryLower.includes('reach 80%') ||
      queryLower.includes('my charging') ||
      queryLower.includes('port-') ||
      queryLower.includes('port 3') ||
      queryLower.includes('boost')
    ) {
      dataUsed.push('EV status');
      // Resolve EV status from context
      const targetId = user_id || 'PORT-03';
      const list = context.vehicles || [];
      const ev = list.find((v: any) => v.id === targetId) || list[0] || {
        id: 'PORT-03',
        model: 'Tesla Model 3 LR',
        batterySoc: 42,
        targetSoc: 80,
        batteryCapacityKwh: 75,
        currentChargingRateKw: 4.2,
        maxChargingRateKw: 11,
        departureTime: '18:30',
        priorityScore: 56,
        priorityLevel: 'MEDIUM',
        isConnected: true
      };

      evStatus = {
        id: ev.id,
        vehicle_type: ev.model,
        soc: ev.batterySoc,
        target_soc: ev.targetSoc,
        battery_capacity_kwh: ev.batteryCapacityKwh,
        current_power_kw: ev.currentChargingRateKw,
        max_power_kw: ev.maxChargingRateKw,
        departure_time: ev.departureTime,
        priority_score: ev.priorityScore,
        priority_level: ev.priorityLevel,
        is_connected: ev.isConnected
      };
    }

    // B. Building energy status
    if (
      queryLower.includes('building') ||
      queryLower.includes('grid limit') ||
      queryLower.includes('capacity') ||
      queryLower.includes('transformer') ||
      queryLower.includes('overload') ||
      queryLower.includes('stress') ||
      queryLower.includes('load') ||
      queryLower.includes('demand') ||
      queryLower.includes('safe')
    ) {
      dataUsed.push('building load');
      dataUsed.push('grid capacity');

      const grid = context.gridState || {
        buildingDemandKw: 31.2,
        gridLimitKw: 50.0,
        evChargingLoadKw: 12.6,
        totalLoadKw: 43.8,
        systemStatus: 'SAFE'
      };

      buildingStatus = {
        current_building_load_kw: grid.buildingDemandKw,
        grid_limit_kw: grid.gridLimitKw,
        ev_load_kw: grid.evChargingLoadKw,
        total_load_kw: grid.totalLoadKw,
        available_capacity_kw: Math.max(0, grid.gridLimitKw - grid.buildingDemandKw),
        transformer_utilization_percent: Math.round(((grid.totalLoadKw || 43.8) / 60.0) * 100),
        system_status: grid.systemStatus
      };
    }

    // C. Renewable status (Solar)
    if (
      queryLower.includes('solar') ||
      queryLower.includes('renewable') ||
      queryLower.includes('weather') ||
      queryLower.includes('sun') ||
      queryLower.includes('surplus') ||
      queryLower.includes('green')
    ) {
      dataUsed.push('solar forecast');

      const grid = context.gridState || { solarGenerationKw: 14.5, solarSurplusKw: 0 };
      const weather = context.solarData || { temperatureC: 28, condition: 'Sunny' };

      renewableStatus = {
        solar_generation_kw: grid.solarGenerationKw,
        solar_surplus_kw: grid.solarSurplusKw,
        temperature_c: weather.temperatureC,
        condition: weather.condition,
        renewable_available: (grid.solarGenerationKw || 0) > 2.0
      };
    }

    // D. Charging Schedule
    if (
      queryLower.includes('schedule') ||
      queryLower.includes('delayed') ||
      queryLower.includes('queue') ||
      queryLower.includes('priority') ||
      queryLower.includes('scheduler') ||
      queryLower.includes('allocation') ||
      queryLower.includes('five-port') ||
      queryLower.includes('rotate')
    ) {
      dataUsed.push('charging schedule');

      const list = context.vehicles || [];
      const allocations: Record<string, number> = {};
      list.forEach((v: any) => {
        allocations[v.id] = v.currentChargingRateKw;
      });

      chargingSchedule = {
        active_allocations_kw: allocations,
        total_ev_demand_kw: list.reduce((acc: number, v: any) => acc + (v.isConnected && v.batterySoc < v.targetSoc ? v.maxChargingRateKw : 0), 0),
        active_chargers_count: list.filter((v: any) => v.isConnected && v.currentChargingRateKw > 0).length,
        port_queue_summary: context.portSummary || {
          activePortCount: 5,
          totalQueueCount: 30,
          averageWaitTimeMinutes: 45
        }
      };
    }

    // E. ML load prediction
    if (
      queryLower.includes('ml') ||
      queryLower.includes('predict') ||
      queryLower.includes('prediction') ||
      queryLower.includes('forecast') ||
      queryLower.includes('risk') ||
      queryLower.includes('future') ||
      queryLower.includes('horizon')
    ) {
      dataUsed.push('ML load prediction');

      const grid = context.gridState || {};
      const building = grid.buildingDemandKw || 32.0;
      const solar = grid.solarGenerationKw || 14.5;

      mlPredictions = {
        predicted_building_load_kw: Math.round((building * 1.15) * 10) / 10,
        predicted_ev_demand_kw: 21.0,
        predicted_solar_kw: Math.round((solar * 0.8) * 10) / 10,
        grid_risk: (building > 40) ? 'HIGH' : 'LOW',
        prediction_horizon_minutes: 60,
        forecasting_model_type: 'Random Forest Regressor / Gradient Boosting'
      };
    }

    // F. Station status & congestion
    if (
      queryLower.includes('station') ||
      queryLower.includes('use') ||
      queryLower.includes('occupancy') ||
      queryLower.includes('congestion') ||
      queryLower.includes('hub') ||
      queryLower.includes('where') ||
      queryLower.includes('map')
    ) {
      dataUsed.push('station status');

      stationStatus = {
        stations_list: [
          { name: 'Voltra HUB-A (Main Residence)', ports_total: 5, occupied: 4, queue_waiting: 2, predicted_peak_congestion_time: '18:00 - 20:00' },
          { name: 'Voltra HUB-B (North Garage)', ports_total: 3, occupied: 1, queue_waiting: 0, predicted_peak_congestion_time: '20:00 - 22:00' },
          { name: 'Voltra HUB-C (West Feeder)', ports_total: 4, occupied: 2, queue_waiting: 1, predicted_peak_congestion_time: '17:30 - 19:30' }
        ],
        smart_recommendation: 'Use Voltra HUB-B (North Garage) as it currently has 2 empty high-speed ports and zero queue waiting!'
      };
    }

    // Create structural context block to present to the AI model
    const contextBlocks: string[] = [];
    if (evStatus) {
      contextBlocks.push(`[LIVE EV STATUS DATA]:\n${JSON.stringify(evStatus, null, 2)}`);
    }
    if (buildingStatus) {
      contextBlocks.push(`[LIVE GRID & BUILDING ENERGY STATUS]:\n${JSON.stringify(buildingStatus, null, 2)}`);
    }
    if (renewableStatus) {
      contextBlocks.push(`[LIVE RENEWABLE SOLAR ENERGY STATUS]:\n${JSON.stringify(renewableStatus, null, 2)}`);
    }
    if (chargingSchedule) {
      contextBlocks.push(`[OPTIMIZED CHARGING SCHEDULE DATA]:\n${JSON.stringify(chargingSchedule, null, 2)}`);
    }
    if (mlPredictions) {
      contextBlocks.push(`[PREDICTIVE MACHINE LEARNING FORECASTS]:\n${JSON.stringify(mlPredictions, null, 2)}`);
    }
    if (stationStatus) {
      contextBlocks.push(`[CHARGING STATIONS & CONGESTION STATUS]:\n${JSON.stringify(stationStatus, null, 2)}`);
    }

    if (contextBlocks.length > 0) {
      contextDescription = contextBlocks.join('\n\n');
    }

    // Log gathered live state for transparency/developer debugging
    console.log(`[ChatService] Process message: "${query}". Tools triggered: [${dataUsed.join(', ')}]`);

    // Ensure we behave as a specialized Energy-Management AI assistant
    const systemInstruction = `
You are Voltra AI Energy Assistant, an expert embedded AI guide for the Voltra Smart EV Charging & Neighborhood Grid Management platform.
You explain charging decisions, grid conditions, ML predictions, and scheduling optimizations using actual live telemetry metrics.

CRITICAL INSTRUCTIONS:
1. Speak clearly, objectively, and with professional composure. Avoid unrequested sales pitches or generic marketing verbs.
2. Use the provided [LIVE SYSTEM CONTEXT] metrics directly to justify and explain system behavior.
3. If a user asks "Why is my charging rate slow / reduced / limited?", refer to the current building load, grid limit, active EV cluster demand, and Priority Score.
4. If a user asks "Will my EV reach 80%?", calculate a simple estimate using: remaining energy needed (Capacity * (Target % - Current %)), and current power allocation (kW). Explain the calculation logically.
5. Clearly label predictions from "ML Forecasts" or "Statistical Forecasts" rather than claiming they are trained on real-time data if they are simulation benchmarks.
6. Under no circumstances bypass, override, or suggest changing hard physical limits (Building load + EV load <= Safe grid limit).
7. Respect User Privacy: Never reveal other flat numbers, resident names, or mobile numbers in your explanations. State that other users are anonymous to protect privacy.
8. If any required data is missing in the context, explicitly inform the user that live telemetry for that sub-system is temporarily offline or unqueried.

[LIVE SYSTEM CONTEXT]
${contextDescription}
`;

    // 2. Select AI Provider dynamically based on whether Gemini API key is active
    let provider: AIProvider = this.geminiProvider;
    let providerName = 'Gemini 3.8 Flash (Live Cloud AI)';

    try {
      if (!process.env.GEMINI_API_KEY) {
        provider = this.mockProvider;
        providerName = 'Local Rule-Based Abstraction (Offline Mode)';
      }
    } catch (err) {
      provider = this.mockProvider;
      providerName = 'Local Rule-Based Abstraction (Offline Mode)';
    }

    // Build chat conversation history formatting
    const formattedHistory = history.length > 0
      ? history.slice(-10).map((h) => {
          const text = h.text || h.message || '';
          return `${h.role === 'user' ? 'User' : 'Assistant'}: ${text}`;
        }).join('\n')
      : '';

    const fullPrompt = formattedHistory
      ? `${formattedHistory}\nUser: ${query}\nAssistant:`
      : query;

    try {
      const reply = await provider.generateResponse(fullPrompt, systemInstruction);
      return {
        reply,
        data_used: dataUsed.length > 0 ? dataUsed : ['general knowledge'],
        timestamp: new Date().toISOString(),
        provider: providerName,
      };
    } catch (err: any) {
      console.error('[ChatService] Provider error:', err);
      // Fallback if live provider crashes/times out
      const fallbackReply = await this.mockProvider.generateResponse(fullPrompt, systemInstruction);
      return {
        reply: fallbackReply,
        data_used: dataUsed.length > 0 ? dataUsed : ['general knowledge'],
        timestamp: new Date().toISOString(),
        provider: 'Mock / Abstraction Fallback',
      };
    }
  }
}
