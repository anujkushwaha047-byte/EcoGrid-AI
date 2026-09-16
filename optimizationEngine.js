/**
 * EcoGrid AI - Actionable Energy Optimization Engine
 * SIH 2026 Problem Statement: 26200
 * Formulates structured Problem ➔ Recommended Action ➔ Expected Benefit optimizations
 * and dispatches live feedback into the Virtual IoT simulation.
 */

class OptimizationEngine {
  constructor(simulationEngine) {
    this.sim = simulationEngine;
    this.appliedOptimizations = new Set();
  }

  // Generate real-time actionable recommendations for the active building
  getRecommendations(buildingId, state) {
    const bldg = this.sim.buildings[buildingId] || this.sim.buildings["bldg-academic-a"];
    const recs = [];

    // 1. Flexible Load Shifting (Water Pump)
    const pumpActive = bldg.flexibleLoads.waterPumps.active;
    const isSolarPeak = this.sim.timeOfDay >= 11.0 && this.sim.timeOfDay <= 15.0 && state.solarGenKw > 50;
    
    if (!pumpActive && isSolarPeak) {
      recs.push({
        id: "opt-pump-shift",
        category: "Load Scheduling",
        title: "Shift Heavy Water Pumps to Solar Window",
        problem: `Water pump scheduled for evening grid peak (tariff ₹8.50/kWh). Current surplus solar generation (+${(state.solarGenKw - state.consumptionKw).toFixed(1)} kW) is unutilized or exported at lower credit.`,
        action: `Immediately activate ${bldg.flexibleLoads.waterPumps.powerKw} kW Central Hydro Pumps to utilize free on-site green power.`,
        benefit: {
          energySaved: "35 kWh/cycle",
          costSaved: "₹ 297.50",
          renewableBoost: "+18.5%"
        },
        applied: this.appliedOptimizations.has("opt-pump-shift"),
        applyHandler: () => {
          this.sim.toggleFlexibleLoad(buildingId, "waterPumps", true);
          this.appliedOptimizations.add("opt-pump-shift");
        }
      });
    }

    // 2. Battery Peak Shaving & Arbitrage
    const isEveningPeak = this.sim.timeOfDay >= 17.5 && this.sim.timeOfDay <= 21.5;
    if (isEveningPeak && state.gridImportKw > 20 && state.batterySoc > 35) {
      recs.push({
        id: "opt-battery-shave",
        category: "Storage Arbitrage",
        title: "Activate Peak Demand Shaving via BESS",
        problem: `Campus is importing ${state.gridImportKw} kW from utility grid at maximum peak tariff (₹8.50/kWh) with battery sitting at ${state.batterySoc}% SoC.`,
        action: `Switch BESS controller to forced discharge mode (40 kW) to offset grid draw during peak tariff window.`,
        benefit: {
          energySaved: "40 kWh/hr",
          costSaved: "₹ 340.00/hr",
          renewableBoost: "+32.0%"
        },
        applied: this.appliedOptimizations.has("opt-battery-shave"),
        applyHandler: () => {
          bldg.batteryMode = "discharge";
          this.appliedOptimizations.add("opt-battery-shave");
        }
      });
    }

    // 3. HVAC Pre-Cooling / Eco-Mode
    const hvacActive = bldg.flexibleLoads.hvacChillers.active;
    const hvacEco = bldg.flexibleLoads.hvacChillers.ecoMode;
    if (hvacActive && !hvacEco) {
      recs.push({
        id: "opt-hvac-eco",
        category: "Efficiency Mode",
        title: "Enable Intelligent HVAC Thermal Pre-Cooling",
        problem: `HVAC chillers operating at fixed maximum setpoint (40 kW) causing unnecessary afternoon baseline inflation.`,
        action: `Enable smart variable-frequency eco-mode: modulate compressor based on building occupancy (${bldg.occupancy}%).`,
        benefit: {
          energySaved: "12 kWh/hr",
          costSaved: "₹ 102.00/hr",
          renewableBoost: "+8.2%"
        },
        applied: this.appliedOptimizations.has("opt-hvac-eco"),
        applyHandler: () => {
          bldg.flexibleLoads.hvacChillers.ecoMode = true;
          this.appliedOptimizations.add("opt-hvac-eco");
        }
      });
    }

    // 4. EV Fleet Smart Charging Coordinator
    const evActive = bldg.flexibleLoads.evFleet.active;
    if (!evActive && state.solarGenKw > bldg.baseLoadKw + 30 && state.batterySoc > 75) {
      recs.push({
        id: "opt-ev-fleet",
        category: "Clean Transport",
        title: "Engage Solar-Powered EV Fleet Fast-Charging",
        problem: `High solar generation (${state.solarGenKw} kW) with battery almost topped up (${state.batterySoc}%). Risk of generation curtailment.`,
        action: `Route excess solar generation to Campus EV Bus Chargers (35 kW capacity).`,
        benefit: {
          energySaved: "70 kWh clean fuel",
          costSaved: "₹ 595.00",
          renewableBoost: "+24.0%"
        },
        applied: this.appliedOptimizations.has("opt-ev-fleet"),
        applyHandler: () => {
          this.sim.toggleFlexibleLoad(buildingId, "evFleet", true);
          this.appliedOptimizations.add("opt-ev-fleet");
        }
      });
    }

    // 5. Always available baseline optimization
    recs.push({
      id: "opt-night-baseload",
      category: "Baselining",
      title: "Automate Deep Sleep for Idle Lab Appliances",
      problem: `Standby parasitic loads in research wings consume ~15 kW continuous power during low-occupancy periods.`,
      action: `Deploy smart IoT socket automation to isolate non-essential instrumentation when occupancy drops below 20%.`,
      benefit: {
        energySaved: "60 kWh/day",
        costSaved: "₹ 510.00/day",
        renewableBoost: "+6.5%"
      },
      applied: this.appliedOptimizations.has("opt-night-baseload"),
      applyHandler: () => {
        bldg.baseLoadKw = Math.max(10, bldg.baseLoadKw - 5);
        this.appliedOptimizations.add("opt-night-baseload");
      }
    });

    return recs;
  }
}

window.OptimizationEngine = OptimizationEngine;
