import { MlDatasetRow } from '../../types';

/**
 * Realistic 90-Day Hourly Synthetic Dataset Generator for Machine Learning
 * Generates 2,160 hourly historical records containing realistic diurnal building load curves,
 * solar generation bell curves, EV charging arrival spikes, weather variations, and transformer loading.
 */
export class MlDatasetGenerator {
  private static cachedDataset: MlDatasetRow[] | null = null;

  public static generate90DaysDataset(daysCount = 90): MlDatasetRow[] {
    if (this.cachedDataset && this.cachedDataset.length === daysCount * 24) {
      return this.cachedDataset;
    }

    const rows: MlDatasetRow[] = [];
    const totalHours = daysCount * 24;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    for (let i = 0; i < totalHours; i++) {
      const currentDate = new Date(startDate.getTime() + i * 3600 * 1000);
      const hourOfDay = currentDate.getHours();
      const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Seasonal / daily ambient temperature variation (18°C to 34°C)
      const baseTemp = 24 + Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI) * 7;
      const tempNoise = (Math.random() - 0.5) * 2;
      const temperatureC = Math.round((baseTemp + tempNoise) * 10) / 10;

      // Cloud cover % (0% to 100%)
      const cloudBase = 20 + Math.sin(i / 48) * 25 + (Math.random() - 0.5) * 30;
      const cloudCoverPercent = Math.min(100, Math.max(0, Math.round(cloudBase)));

      // Humidity % (30% to 90%)
      const humidityPercent = Math.min(95, Math.max(30, Math.round(75 - (temperatureC - 20) * 2 + (Math.random() - 0.5) * 10)));

      // 1. Building Electricity Load Curve (kW)
      // Morning rise (06-09h), mid-day steady, evening peak (18-22h), overnight drop (23-05h)
      let buildingBase = 25.0; // overnight baseload
      if (hourOfDay >= 6 && hourOfDay <= 9) {
        buildingBase = 38.0 + (hourOfDay - 6) * 4; // morning ramp up
      } else if (hourOfDay > 9 && hourOfDay < 17) {
        buildingBase = 42.0 + (isWeekend ? -6 : 3); // daytime
      } else if (hourOfDay >= 17 && hourOfDay <= 22) {
        buildingBase = 48.0 + Math.sin(((hourOfDay - 17) / 5) * Math.PI) * 12; // evening peak
      } else {
        buildingBase = 28.0; // late night
      }
      // Temperature impact (AC load)
      const acLoad = temperatureC > 28 ? (temperatureC - 28) * 1.8 : 0;
      const buildingNoise = (Math.random() - 0.5) * 4.0;
      const buildingLoadKw = Math.round(Math.max(15, buildingBase + acLoad + buildingNoise) * 10) / 10;

      // 2. Solar Generation Bell Curve (kW)
      // Peak 28 kW around 12:30-13:00, zero at night (before 06:00 or after 18:30)
      let solarKw = 0;
      if (hourOfDay >= 6 && hourOfDay <= 18) {
        const solarAngle = ((hourOfDay - 6) / 12) * Math.PI;
        const maxSolarCapacity = 28.0;
        const cloudFactor = (100 - cloudCoverPercent * 0.75) / 100;
        solarKw = maxSolarCapacity * Math.sin(solarAngle) * cloudFactor;
        solarKw += (Math.random() - 0.5) * 1.5;
        solarKw = Math.max(0, Math.min(28.0, solarKw));
      }
      solarKw = Math.round(solarKw * 10) / 10;

      // 3. EV Charging Demand (kW)
      // Arrival spikes around 18:00 - 21:00, minor morning plugged demand
      let evBase = 4.0;
      if (hourOfDay >= 18 && hourOfDay <= 23) {
        evBase = 18.0 + Math.sin(((hourOfDay - 18) / 5) * Math.PI) * 14;
      } else if (hourOfDay >= 0 && hourOfDay <= 6) {
        evBase = 12.0; // overnight charging queue
      } else if (hourOfDay >= 7 && hourOfDay <= 9) {
        evBase = 6.0;
      }
      const evNoise = (Math.random() - 0.5) * 3.5;
      const evDemandKw = Math.round(Math.max(0, evBase + evNoise) * 10) / 10;

      // 4. Station Occupancy %
      const stationOccBase = (evDemandKw / 35.0) * 100;
      const stationOccupancyPercent = Math.min(100, Math.max(5, Math.round(stationOccBase + (Math.random() - 0.5) * 10)));

      // 5. Transformer Loading (kVA out of 500 kVA rating)
      // Total load = Building + EV Charging - Solar (internal offset)
      const netGridKw = Math.max(0, buildingLoadKw + evDemandKw - solarKw * 0.6);
      const transformerKva = Math.round((280 + netGridKw * 2.8 + (Math.random() - 0.5) * 15) * 10) / 10;

      rows.push({
        timestamp: currentDate.toISOString(),
        hourOfDay,
        dayOfWeek,
        temperatureC,
        cloudCoverPercent,
        humidityPercent,
        buildingLoadKw,
        solarKw,
        evDemandKw,
        stationOccupancyPercent,
        transformerKva,
        isWeekend,
      });
    }

    this.cachedDataset = rows;
    return rows;
  }

  /**
   * Export dataset to CSV string for downloading
   */
  public static exportToCsv(dataset: MlDatasetRow[]): string {
    const headers = [
      'timestamp',
      'hourOfDay',
      'dayOfWeek',
      'temperatureC',
      'cloudCoverPercent',
      'humidityPercent',
      'buildingLoadKw',
      'solarKw',
      'evDemandKw',
      'stationOccupancyPercent',
      'transformerKva',
      'isWeekend',
    ];

    const csvRows = dataset.map((r) => [
      r.timestamp,
      r.hourOfDay,
      r.dayOfWeek,
      r.temperatureC,
      r.cloudCoverPercent,
      r.humidityPercent,
      r.buildingLoadKw,
      r.solarKw,
      r.evDemandKw,
      r.stationOccupancyPercent,
      r.transformerKva,
      r.isWeekend ? 'TRUE' : 'FALSE',
    ].join(','));

    return [headers.join(','), ...csvRows].join('\n');
  }
}
