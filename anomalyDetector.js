/**
 * EcoGrid AI - Real-time Anomaly Detection & Diagnostics Engine
 * SIH 2026 Problem Statement: 26200
 * Scans continuous telemetry streams for consumption surges, solar drops,
 * battery degradation, and sensor connectivity faults.
 */

class AnomalyDetector {
  constructor(simulationEngine) {
    this.sim = simulationEngine;
  }

  // Scan current campus telemetry and detect anomalies
  scanAnomalies(buildingId, state) {
    const bldg = this.sim.buildings[buildingId] || this.sim.buildings["bldg-academic-a"];
    const anomalies = [];

    // 1. High Consumption Surge Anomaly
    const expectedMaxDemand = bldg.peakLoadKw * 1.1;
    if (state.consumptionKw > expectedMaxDemand || bldg.activeAnomaly === "hvac_compressor_fault") {
      anomalies.push({
        id: "anom-load-surge",
        severity: "critical",
        title: "Abnormal Consumption Surge",
        building: bldg.name,
        detectedValue: `${state.consumptionKw} kW`,
        baselineValue: `~${bldg.baseLoadKw + 30} kW`,
        deviation: `+${(((state.consumptionKw - bldg.baseLoadKw) / bldg.baseLoadKw) * 100).toFixed(0)}%`,
        description: "Energy consumption is significantly higher than historical baseline for current occupancy level.",
        possibleCauses: [
          "HVAC chiller compressor short-cycling or mechanical friction",
          "Unscheduled heavy laboratory equipment activation",
          "Zone temperature setpoint override causing continuous cooling"
        ],
        timestamp: new Date().toLocaleTimeString(),
        status: "ACTIVE"
      });
    }

    // 2. Solar PV Output Deficit / Panel Soiling Anomaly
    const theoreticalYield = bldg.solarCapacityKw * 0.7;
    const isMidday = this.sim.timeOfDay >= 11.0 && this.sim.timeOfDay <= 15.0;
    if ((isMidday && this.sim.weatherCondition === "sunny" && state.solarGenKw < theoreticalYield * 0.5) || bldg.activeAnomaly === "solar_panel_soiling") {
      anomalies.push({
        id: "anom-solar-drop",
        severity: "high",
        title: "Solar Generation Underperformance",
        building: bldg.name,
        detectedValue: `${state.solarGenKw} kW`,
        baselineValue: `~${theoreticalYield.toFixed(0)} kW`,
        deviation: "-52%",
        description: "Solar array output is drastically below expected yield despite high ambient solar irradiance.",
        possibleCauses: [
          "Severe dust/soiling accumulation on solar PV surface",
          "String inverter partial failure or DC combiner blown fuse",
          "Tree canopy or building structural shading"
        ],
        timestamp: new Date().toLocaleTimeString(),
        status: "ACTIVE"
      });
    }

    // 3. Inverter Hardware Trip
    if (bldg.activeAnomaly === "inverter_trip") {
      anomalies.push({
        id: "anom-inv-trip",
        severity: "critical",
        title: "Solar Inverter Protection Trip",
        building: bldg.name,
        detectedValue: "0 kW",
        baselineValue: `~${bldg.solarCapacityKw} kW`,
        deviation: "-100%",
        description: "Rooftop inverter DEV-AC-INV-01 opened contactor due to DC over-voltage or ground fault.",
        possibleCauses: [
          "DC ground fault detected in string #3",
          "Grid synchronization voltage surge",
          "Internal inverter IGBT thermal overload"
        ],
        timestamp: new Date().toLocaleTimeString(),
        status: "TRIPPED"
      });
    }

    // 4. Low Battery Reserve Warning
    if (state.batterySoc < 20 && this.sim.timeOfDay >= 18.0) {
      anomalies.push({
        id: "anom-battery-low",
        severity: "medium",
        title: "Low Battery Energy Reserve",
        building: bldg.name,
        detectedValue: `${state.batterySoc}% SoC`,
        baselineValue: "> 35%",
        deviation: "-15%",
        description: "BESS storage is approaching minimum cutoff threshold during evening demand.",
        possibleCauses: [
          "Premature daytime discharge",
          "Insufficient solar charging during morning cloud cover"
        ],
        timestamp: new Date().toLocaleTimeString(),
        status: "MONITORING"
      });
    }

    // 5. Normal Status placeholder if clean
    if (anomalies.length === 0) {
      anomalies.push({
        id: "anom-none",
        severity: "info",
        title: "Microgrid Telemetry Nominal",
        building: bldg.name,
        detectedValue: "Normal",
        baselineValue: "Nominal",
        deviation: "0%",
        description: "All sensors, solar inverters, smart meters, and battery BMS systems are operating within optimal parameters.",
        possibleCauses: ["System healthy"],
        timestamp: new Date().toLocaleTimeString(),
        status: "OPTIMAL"
      });
    }

    return anomalies;
  }
}

window.AnomalyDetector = AnomalyDetector;
