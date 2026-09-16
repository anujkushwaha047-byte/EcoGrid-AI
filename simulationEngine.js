/**
 * EcoGrid AI - Virtual IoT Simulation Engine
 * SIH 2026 Problem Statement: 26200
 * Simulates multi-building microgrids, solar PV kinetics, BESS battery dynamics,
 * environmental sensors, occupancy-based demand curves, and telemetry streaming.
 */

class SimulationEngine {
  constructor() {
    // Campus / Organization Data Hierarchy
    this.organization = {
      id: "org-aicte-01",
      name: "AICTE Green University Campus",
      site: "South Innovation Complex",
      gridEmissionFactor: 0.82, // kg CO2 per kWh grid
      solarEmissionFactor: 0.04, // kg CO2 per kWh lifecycle solar
      tariffImport: 8.50, // INR/kWh peak grid rate
      tariffExport: 4.20, // INR/kWh net metering credit rate
    };

    // Multi-Building Microgrid Database
    this.buildings = {
      "bldg-academic-a": {
        id: "bldg-academic-a",
        name: "Academic Block A",
        type: "Classrooms & Research Labs",
        areaSqFt: 45000,
        solarCapacityKw: 150,
        batteryCapacityKwh: 200,
        batterySoc: 65, // %
        batteryHealth: 98, // %
        batteryMode: "auto", // "auto", "charge", "discharge", "idle"
        baseLoadKw: 25,
        peakLoadKw: 140,
        occupancy: 75, // %
        flexibleLoads: {
          waterPumps: { name: "Central Hydro Pumps", powerKw: 25, active: false, scheduledTime: "13:00" },
          hvacChillers: { name: "Central HVAC Pre-Cool", powerKw: 40, active: true, ecoMode: false },
          evFleet: { name: "Campus EV Bus Chargers", powerKw: 35, active: false, scheduledTime: "12:30" }
        },
        devices: [
          { id: "DEV-AC-INV-01", name: "Rooftop Solar Inverter 1", type: "Solar Inverter", status: "online", lastPing: "Just now" },
          { id: "DEV-AC-BMS-01", name: "Lithium BESS BMS Controller", type: "Battery BMS", status: "online", lastPing: "Just now" },
          { id: "DEV-AC-MTR-01", name: "Main Smart Energy Meter", type: "Smart Meter", status: "online", lastPing: "Just now" },
          { id: "DEV-AC-ENV-01", name: "Rooftop Pyranometer & Weather", type: "Environmental", status: "online", lastPing: "Just now" },
          { id: "DEV-AC-HVAC-01", name: "Chiller VFD Sub-Meter", type: "Load Monitor", status: "online", lastPing: "Just now" }
        ],
        activeAnomaly: null
      },
      "bldg-hostel-b": {
        id: "bldg-hostel-b",
        name: "Hostel Block B (Dormitories)",
        type: "Residential Hostel & Mess",
        areaSqFt: 38000,
        solarCapacityKw: 80,
        batteryCapacityKwh: 120,
        batterySoc: 52,
        batteryHealth: 96,
        batteryMode: "auto",
        baseLoadKw: 18,
        peakLoadKw: 95,
        occupancy: 90,
        flexibleLoads: {
          waterPumps: { name: "Hostel Geyser & Pump Array", powerKw: 20, active: false, scheduledTime: "14:00" },
          hvacChillers: { name: "Dining Hall Coolers", powerKw: 15, active: false, ecoMode: true },
          evFleet: { name: "Student Scooter E-Hub", powerKw: 15, active: false, scheduledTime: "13:30" }
        },
        devices: [
          { id: "DEV-HB-INV-01", name: "Hostel B Solar Inverter", type: "Solar Inverter", status: "online", lastPing: "Just now" },
          { id: "DEV-HB-BMS-01", name: "BESS Storage Unit 2", type: "Battery BMS", status: "online", lastPing: "Just now" },
          { id: "DEV-HB-MTR-01", name: "Smart Feeder Meter HB", type: "Smart Meter", status: "online", lastPing: "Just now" },
          { id: "DEV-HB-SENS-01", name: "Hostel Kitchen Temp/Load Sensor", type: "Appliance Meter", status: "online", lastPing: "Just now" }
        ],
        activeAnomaly: null
      },
      "bldg-library": {
        id: "bldg-library",
        name: "Central Knowledge Library",
        type: "Library & Server Datacenter",
        areaSqFt: 30000,
        solarCapacityKw: 100,
        batteryCapacityKwh: 150,
        batterySoc: 82,
        batteryHealth: 99,
        batteryMode: "auto",
        baseLoadKw: 30,
        peakLoadKw: 75,
        occupancy: 60,
        flexibleLoads: {
          waterPumps: { name: "Fountain & Landscape Pump", powerKw: 10, active: false, scheduledTime: "12:00" },
          hvacChillers: { name: "Datacenter Precision Cooling", powerKw: 30, active: true, ecoMode: true },
          evFleet: { name: "Staff EV Station", powerKw: 20, active: false, scheduledTime: "11:30" }
        },
        devices: [
          { id: "DEV-LIB-INV-01", name: "Library PV Inverter", type: "Solar Inverter", status: "online", lastPing: "Just now" },
          { id: "DEV-LIB-BMS-01", name: "Datacenter UPS BESS", type: "Battery BMS", status: "online", lastPing: "Just now" },
          { id: "DEV-LIB-MTR-01", name: "Bi-directional Meter", type: "Smart Meter", status: "online", lastPing: "Just now" }
        ],
        activeAnomaly: null
      },
      "bldg-science": {
        id: "bldg-science",
        name: "Science & Technology Wing",
        type: "Heavy Instrument & Cleanrooms",
        areaSqFt: 52000,
        solarCapacityKw: 120,
        batteryCapacityKwh: 180,
        batterySoc: 70,
        batteryHealth: 97,
        batteryMode: "auto",
        baseLoadKw: 45,
        peakLoadKw: 160,
        occupancy: 80,
        flexibleLoads: {
          waterPumps: { name: "Chilled Water Loop Circulator", powerKw: 30, active: true, scheduledTime: "10:00" },
          hvacChillers: { name: "Cleanroom Air Handler Unit", powerKw: 45, active: true, ecoMode: false },
          evFleet: { name: "Research Shuttle Charger", powerKw: 25, active: false, scheduledTime: "14:30" }
        },
        devices: [
          { id: "DEV-SCI-INV-01", name: "Cleanroom Solar Array Inverter", type: "Solar Inverter", status: "online", lastPing: "Just now" },
          { id: "DEV-SCI-BMS-01", name: "High-Drain BESS Subsystem", type: "Battery BMS", status: "online", lastPing: "Just now" },
          { id: "DEV-SCI-MTR-01", name: "Science Wing Industrial Smart Meter", type: "Smart Meter", status: "online", lastPing: "Just now" }
        ],
        activeAnomaly: null
      }
    };

    // Active Building Selection
    this.selectedBuildingId = "bldg-academic-a";

    // Environmental & Simulation State
    this.timeOfDay = 12.5; // 12:30 PM initial
    this.isRunning = true;
    this.simulationSpeed = 1; // 1x, 5x, 15x, 60x
    this.weatherCondition = "sunny"; // "sunny", "partly-cloudy", "overcast", "rainy", "heatwave"
    this.cloudCover = 10; // %
    this.ambientTemp = 31.5; // °C
    this.solarIrradiance = 850; // W/m^2
    this.gridFrequency = 50.02; // Hz

    // Telemetry Telemetry Log Buffer
    this.packetStream = [];
    this.maxPacketHistory = 60;

    // Listeners for UI notification
    this.listeners = [];

    // History for Charts & Prediction
    this.history = {
      timestamps: [],
      solarGen: [],
      consumption: [],
      batterySoc: [],
      gridImport: [],
      gridExport: [],
      renewableUtil: []
    };

    this.initHistory();
    this.startLoop();
  }

  // Pre-populate realistic 24-hour historical baseline for instant graphs
  initHistory() {
    const now = this.timeOfDay;
    for (let h = 0; h < 24; h += 0.5) {
      const point = this.calculateInstantPhysics("bldg-academic-a", h, this.weatherCondition);
      this.history.timestamps.push(this.formatHourDecimal(h));
      this.history.solarGen.push(point.solarGenKw);
      this.history.consumption.push(point.consumptionKw);
      this.history.batterySoc.push(point.batterySoc);
      this.history.gridImport.push(point.gridImportKw);
      this.history.gridExport.push(point.gridExportKw);
      this.history.renewableUtil.push(point.renewableUtilPct);
    }
  }

  formatHourDecimal(h) {
    const hours = Math.floor(h);
    const mins = Math.floor((h - hours) * 60);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const displayM = mins < 10 ? `0${mins}` : mins;
    return `${displayH}:${displayM} ${ampm}`;
  }

  // Subscribe callback for live state updates
  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(cb => cb(data));
  }

  // Physics calculation for given building at given hour
  calculateInstantPhysics(buildingId, hour, weather) {
    const bldg = this.buildings[buildingId] || this.buildings["bldg-academic-a"];

    // 1. Solar Radiation Curve Calculation (Gaussian peak around 12:45 PM)
    let solarMultiplier = 0;
    if (hour >= 6.0 && hour <= 18.5) {
      // Bell curve between 6:00 AM (sunrise) and 6:30 PM (sunset)
      const peakHour = 12.75;
      const sigma = 2.8;
      const gaussian = Math.exp(-Math.pow(hour - peakHour, 2) / (2 * Math.pow(sigma, 2)));
      solarMultiplier = Math.max(0, gaussian);
    }

    // Weather impact
    let weatherFactor = 1.0;
    if (weather === "partly-cloudy") weatherFactor = 0.72;
    else if (weather === "overcast") weatherFactor = 0.28;
    else if (weather === "rainy") weatherFactor = 0.12;
    else if (weather === "heatwave") weatherFactor = 0.88; // PV thermal efficiency loss

    const cloudNoise = 1 - (this.cloudCover / 100) * 0.85;
    const effectiveSolarFactor = Math.max(0, solarMultiplier * weatherFactor * cloudNoise);

    let solarGenKw = Number((bldg.solarCapacityKw * effectiveSolarFactor).toFixed(2));

    // Panel Soiling or Hardware Anomaly Reduction if active
    if (bldg.activeAnomaly === "solar_panel_soiling") {
      solarGenKw = Number((solarGenKw * 0.45).toFixed(2));
    } else if (bldg.activeAnomaly === "inverter_trip") {
      solarGenKw = 0;
    }

    // 2. Consumption / Demand Curve
    // Baseline + Occupancy + Time of day schedule (classes / work hours 8:30 to 17:30)
    let occupancyCurve = 0.3; // night baseline
    if (hour >= 7.5 && hour <= 19.0) {
      occupancyCurve = 0.75 + 0.25 * Math.sin(((hour - 7.5) / 11.5) * Math.PI);
    } else if (hour > 19.0 && hour <= 23.0) {
      occupancyCurve = 0.45;
    }

    let dynamicBaseKw = bldg.baseLoadKw + (bldg.peakLoadKw - bldg.baseLoadKw) * (bldg.occupancy / 100) * occupancyCurve;

    // Flexible Loads addition
    let flexibleKw = 0;
    if (bldg.flexibleLoads.waterPumps.active) flexibleKw += bldg.flexibleLoads.waterPumps.powerKw;
    if (bldg.flexibleLoads.hvacChillers.active) {
      const hvacPwr = bldg.flexibleLoads.hvacChillers.ecoMode 
        ? bldg.flexibleLoads.hvacChillers.powerKw * 0.7 
        : bldg.flexibleLoads.hvacChillers.powerKw;
      flexibleKw += hvacPwr;
    }
    if (bldg.flexibleLoads.evFleet.active) flexibleKw += bldg.flexibleLoads.evFleet.powerKw;

    // Add slight natural fluctuations
    const jitter = (Math.sin(hour * 10) * 2.5);
    let consumptionKw = Math.max(bldg.baseLoadKw, Number((dynamicBaseKw + flexibleKw + jitter).toFixed(2)));

    // Load Spike Anomaly
    if (bldg.activeAnomaly === "hvac_compressor_fault") {
      consumptionKw = Number((consumptionKw * 1.65).toFixed(2));
    }

    // 3. Battery Storage & Microgrid Energy Balance
    // Net generated vs consumed
    const deltaPower = solarGenKw - consumptionKw;
    let batteryPowerKw = 0; // positive = discharging to load, negative = charging from excess solar
    let gridImportKw = 0;
    let gridExportKw = 0;
    let currentSoc = bldg.batterySoc;

    if (deltaPower > 0) {
      // Excess solar available -> Charge battery first up to 98% SoC
      if (currentSoc < 98 && bldg.batteryMode !== "discharge") {
        const maxChargeKw = bldg.batteryCapacityKwh * 0.35; // 0.35C max charge rate
        const chargeKw = Math.min(deltaPower, maxChargeKw);
        batteryPowerKw = -Number(chargeKw.toFixed(2)); // charging
        const remainingExcess = deltaPower - chargeKw;
        gridExportKw = Number(remainingExcess.toFixed(2));
      } else {
        gridExportKw = Number(deltaPower.toFixed(2));
      }
    } else {
      // Deficit -> Discharge battery if SoC > 15%
      const deficit = Math.abs(deltaPower);
      if (currentSoc > 15 && bldg.batteryMode !== "charge") {
        const maxDischargeKw = bldg.batteryCapacityKwh * 0.45; // 0.45C discharge rate
        const dischargeKw = Math.min(deficit, maxDischargeKw);
        batteryPowerKw = Number(dischargeKw.toFixed(2)); // discharging
        const remainingDeficit = deficit - dischargeKw;
        gridImportKw = Number(remainingDeficit.toFixed(2));
      } else {
        gridImportKw = Number(deficit.toFixed(2));
      }
    }

    // Renewable Utilization Rate (%)
    const directSolarUsed = Math.min(solarGenKw, consumptionKw);
    const batteryGreenUsed = batteryPowerKw > 0 ? batteryPowerKw : 0;
    const totalRenewableUsed = directSolarUsed + batteryGreenUsed;
    const renewableUtilPct = consumptionKw > 0 ? Math.min(100, Number(((totalRenewableUsed / consumptionKw) * 100).toFixed(1))) : 100;

    // Environmental & Financial Metrics (Instantaneous rate & daily estimated accumulation)
    const costHourly = (gridImportKw * this.organization.tariffImport) - (gridExportKw * this.organization.tariffExport);
    const baselineGridCostHourly = consumptionKw * this.organization.tariffImport;
    const savingsHourly = Math.max(0, baselineGridCostHourly - costHourly);
    const co2OffsetKgHourly = Number((totalRenewableUsed * this.organization.gridEmissionFactor).toFixed(2));

    return {
      hour,
      solarGenKw,
      consumptionKw,
      batteryPowerKw,
      batterySoc: currentSoc,
      gridImportKw,
      gridExportKw,
      renewableUtilPct,
      costHourly: Number(costHourly.toFixed(2)),
      savingsHourly: Number(savingsHourly.toFixed(2)),
      co2OffsetKgHourly,
      ambientTemp: Number((this.ambientTemp + Math.sin((hour - 6) / 12 * Math.PI) * 4).toFixed(1)),
      irradianceWm2: Math.round(effectiveSolarFactor * 1000)
    };
  }

  // Simulation tick loop
  startLoop() {
    this.intervalId = setInterval(() => {
      if (!this.isRunning) return;

      // Advance time based on speed
      const stepHours = (0.02 * this.simulationSpeed);
      this.timeOfDay = (this.timeOfDay + stepHours) % 24;

      const currentBuilding = this.buildings[this.selectedBuildingId];
      const state = this.calculateInstantPhysics(this.selectedBuildingId, this.timeOfDay, this.weatherCondition);

      // Update battery SoC based on power flow
      if (state.batteryPowerKw < 0) {
        // Charging
        const chargedKwh = (Math.abs(state.batteryPowerKw) * (stepHours)) * 0.95; // 95% efficiency
        const socGain = (chargedKwh / currentBuilding.batteryCapacityKwh) * 100;
        currentBuilding.batterySoc = Math.min(98, Number((currentBuilding.batterySoc + socGain).toFixed(2)));
      } else if (state.batteryPowerKw > 0) {
        // Discharging
        const dischargedKwh = (state.batteryPowerKw * (stepHours)) / 0.95;
        const socLoss = (dischargedKwh / currentBuilding.batteryCapacityKwh) * 100;
        currentBuilding.batterySoc = Math.max(12, Number((currentBuilding.batterySoc - socLoss).toFixed(2)));
      }
      state.batterySoc = currentBuilding.batterySoc;

      // Update grid frequency with subtle micro-grid inertia jitter
      this.gridFrequency = Number((50.00 + (Math.random() * 0.06 - 0.03)).toFixed(3));

      // Emit Structured Virtual IoT Packets
      this.emitSensorPackets(this.selectedBuildingId, state);

      // Notify all subscribers
      this.notifyListeners({
        timestamp: this.formatHourDecimal(this.timeOfDay),
        decimalHour: this.timeOfDay,
        building: currentBuilding,
        state: state,
        gridFrequency: this.gridFrequency,
        weather: this.weatherCondition,
        organization: this.organization,
        allBuildings: this.buildings
      });

    }, 600); // 600ms tick for smooth live responsiveness
  }

  // Structured IoT Telemetry Stream Generator (PRD Section 21)
  emitSensorPackets(buildingId, state) {
    const ts = new Date().toISOString();
    const bldg = this.buildings[buildingId];

    const packets = [
      {
        deviceId: `${bldg.id.toUpperCase()}-INV-01`,
        buildingId: buildingId,
        sensorType: "solar_generation_active_power",
        value: state.solarGenKw,
        unit: "kW",
        timestamp: ts,
        status: bldg.activeAnomaly === "inverter_trip" ? "CRITICAL_TRIP" : "ONLINE"
      },
      {
        deviceId: `${bldg.id.toUpperCase()}-MTR-MAIN`,
        buildingId: buildingId,
        sensorType: "building_total_active_load",
        value: state.consumptionKw,
        unit: "kW",
        timestamp: ts,
        status: bldg.activeAnomaly === "hvac_compressor_fault" ? "WARNING_SURGE" : "ONLINE"
      },
      {
        deviceId: `${bldg.id.toUpperCase()}-BMS-01`,
        buildingId: buildingId,
        sensorType: "battery_state_of_charge",
        value: state.batterySoc,
        unit: "%",
        timestamp: ts,
        status: state.batterySoc < 20 ? "LOW_RESERVE" : "HEALTHY"
      },
      {
        deviceId: `${bldg.id.toUpperCase()}-GRID-EXCH`,
        buildingId: buildingId,
        sensorType: "grid_import_export_active",
        value: state.gridImportKw > 0 ? -state.gridImportKw : state.gridExportKw,
        unit: "kW",
        timestamp: ts,
        status: "SYNCHRONIZED"
      },
      {
        deviceId: `${bldg.id.toUpperCase()}-ENV-PYR`,
        buildingId: buildingId,
        sensorType: "solar_irradiance_global_horizontal",
        value: state.irradianceWm2,
        unit: "W/m²",
        timestamp: ts,
        status: "CALIBRATED"
      }
    ];

    // Prepend to packet log buffer
    packets.forEach(p => {
      this.packetStream.unshift(p);
      if (this.packetStream.length > this.maxPacketHistory) {
        this.packetStream.pop();
      }
    });
  }

  // Interactive Simulator Controls
  setWeather(weather) {
    this.weatherCondition = weather;
    if (weather === "sunny") this.cloudCover = 5;
    else if (weather === "partly-cloudy") this.cloudCover = 40;
    else if (weather === "overcast") this.cloudCover = 85;
    else if (weather === "rainy") this.cloudCover = 95;
    else if (weather === "heatwave") { this.cloudCover = 0; this.ambientTemp = 42; }
  }

  setTimeOfDay(hour) {
    this.timeOfDay = Math.max(0, Math.min(23.99, hour));
  }

  setSimulationSpeed(speed) {
    this.simulationSpeed = speed;
  }

  setBuildingOccupancy(buildingId, occupancy) {
    if (this.buildings[buildingId]) {
      this.buildings[buildingId].occupancy = Math.max(0, Math.min(100, occupancy));
    }
  }

  setCloudCover(cloudPct) {
    this.cloudCover = Math.max(0, Math.min(100, cloudPct));
  }

  toggleFlexibleLoad(buildingId, loadKey, state) {
    if (this.buildings[buildingId] && this.buildings[buildingId].flexibleLoads[loadKey]) {
      this.buildings[buildingId].flexibleLoads[loadKey].active = state;
    }
  }

  injectAnomaly(buildingId, anomalyType) {
    if (this.buildings[buildingId]) {
      this.buildings[buildingId].activeAnomaly = anomalyType;
    }
  }

  clearAnomaly(buildingId) {
    if (this.buildings[buildingId]) {
      this.buildings[buildingId].activeAnomaly = null;
    }
  }

  selectBuilding(buildingId) {
    if (this.buildings[buildingId]) {
      this.selectedBuildingId = buildingId;
    }
  }

  togglePlayPause() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }
}

// Instantiate global simulation instance
window.ecoSimulation = new SimulationEngine();
