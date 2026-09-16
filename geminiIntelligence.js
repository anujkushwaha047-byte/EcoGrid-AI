/**
 * EcoGrid AI - Gemini Flash Intelligence & Reasoning Layer
 * SIH 2026 Problem Statement: 26200
 * Performs deep semantic reasoning on live telemetry, generates actionable advice,
 * and provides an interactive conversational AI energy auditor.
 */

class GeminiIntelligence {
  constructor(simulationEngine) {
    this.sim = simulationEngine;
    this.apiKey = localStorage.getItem("ecogrid_gemini_api_key") || "";
    this.selectedModel = "gemini-1.5-flash";
    this.chatHistory = [
      {
        role: "assistant",
        text: "Hello! I am **EcoGrid AI Intelligence** (powered by Gemini Flash). I continuously analyze live sensor data, microgrid solar yields, and battery dynamics across your campus. How can I assist you with energy optimization or demand forecasting today?"
      }
    ];
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem("ecogrid_gemini_api_key", this.apiKey);
  }

  // Generate live automated contextual insight for the dashboard card
  async generateLiveReasoning(buildingId, state) {
    const bldg = this.sim.buildings[buildingId] || this.sim.buildings["bldg-academic-a"];
    const weather = this.sim.weatherCondition;
    const timeStr = this.sim.formatHourDecimal(this.sim.timeOfDay);

    // If custom API key is present, try live Gemini Flash API call
    if (this.apiKey) {
      try {
        const prompt = `You are EcoGrid AI's real-time energy intelligence system for ${bldg.name}.
Current Time: ${timeStr}
Weather: ${weather}
Solar PV Generation: ${state.solarGenKw} kW (Capacity: ${bldg.solarCapacityKw} kW)
Building Consumption: ${state.consumptionKw} kW (Occupancy: ${bldg.occupancy}%)
Battery SoC: ${state.batterySoc}% (Health: ${bldg.batteryHealth}%)
Battery Flow: ${state.batteryPowerKw} kW (${state.batteryPowerKw < 0 ? 'Charging' : state.batteryPowerKw > 0 ? 'Discharging' : 'Idle'})
Grid Status: ${state.gridImportKw > 0 ? `Importing ${state.gridImportKw} kW` : `Exporting ${state.gridExportKw} kW`}
Active Anomaly: ${bldg.activeAnomaly || 'None'}

Provide a 2-3 sentence executive energy management reasoning with concrete advice for the facility manager. Keep it concise, professional, and actionable.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const json = await response.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (err) {
        console.warn("Gemini API call failed, falling back to local expert heuristics:", err);
      }
    }

    // Built-in Intelligent Heuristic Reasoning Engine (Zero Config)
    return this.synthesizeLocalHeuristicInsight(bldg, state, timeStr, weather);
  }

  synthesizeLocalHeuristicInsight(bldg, state, timeStr, weather) {
    const solarGen = state.solarGenKw;
    const load = state.consumptionKw;
    const soc = state.batterySoc;

    if (bldg.activeAnomaly === "solar_panel_soiling") {
      return `⚠️ **Solar PV Output Deficit Detected**: Generation (${solarGen} kW) is 55% below theoretical yield for ${weather} conditions at ${timeStr}. Recommend scheduling drone/manual panel cleaning and inspecting string combiner boxes.`;
    }

    if (bldg.activeAnomaly === "hvac_compressor_fault") {
      return `⚠️ **Abnormal Load Spike in ${bldg.name}**: Total demand surged to ${load} kW (65% above historical baseline). Suspected HVAC chiller compressor short-cycling or uncoordinated heavy equipment start.`;
    }

    if (solarGen > load * 1.25) {
      if (soc < 95) {
        return `High renewable generation surplus (+${(solarGen - load).toFixed(1)} kW) observed at ${timeStr}. Battery is actively storing clean power (current SoC: ${soc}%). Excellent window to shift water pump operations or activate campus EV charging stations before peak grid hours.`;
      } else {
        return `Solar generation (${solarGen} kW) is exceeding building demand (${load} kW) with battery near full capacity (${soc}%). Exporting excess ${state.gridExportKw} kW to utility grid at ₹4.20/kWh net-metering tariff.`;
      }
    } else if (state.gridImportKw > 30 && this.sim.timeOfDay >= 17.5 && this.sim.timeOfDay <= 21.5) {
      return `High grid import (${state.gridImportKw} kW) detected during peak tariff period (₹8.50/kWh). Discharging ${bldg.name} BESS battery (current SoC: ${soc}%) to shave peak demand and reduce operational expenses.`;
    } else if (this.sim.timeOfDay >= 22.0 || this.sim.timeOfDay <= 5.5) {
      return `Night baseload period active (${load} kW). Solar PV idle. Campus microgrid running on optimal low-demand configuration. Recommended maintaining minimum reserve SoC for morning readiness.`;
    } else {
      return `Balanced microgrid operation in ${bldg.name} at ${timeStr}. Renewable contribution is meeting ${state.renewableUtilPct}% of active load with stable grid synchronization (${this.sim.gridFrequency} Hz).`;
    }
  }

  // Interactive Chat Assistant
  async sendChatMessage(userText) {
    const bldg = this.sim.buildings[this.sim.selectedBuildingId];
    const state = this.sim.calculateInstantPhysics(this.sim.selectedBuildingId, this.sim.timeOfDay, this.sim.weatherCondition);
    const timeStr = this.sim.formatHourDecimal(this.sim.timeOfDay);

    this.chatHistory.push({ role: "user", text: userText });

    if (this.apiKey) {
      try {
        const systemPrompt = `You are EcoGrid AI - an expert energy consultant for university campus microgrids.
Current context:
- Campus Building: ${bldg.name} (${bldg.type})
- Time of day: ${timeStr}
- Weather: ${this.sim.weatherCondition} (Irradiance: ${state.irradianceWm2} W/m²)
- Solar PV: ${state.solarGenKw} kW / ${bldg.solarCapacityKw} kW rated
- Load: ${state.consumptionKw} kW
- Battery: ${state.batterySoc}% SoC (${bldg.batteryCapacityKwh} kWh)
- Grid Import: ${state.gridImportKw} kW | Export: ${state.gridExportKw} kW
- Grid Tariff: ₹${this.sim.organization.tariffImport}/kWh (Peak), Net Metering: ₹${this.sim.organization.tariffExport}/kWh

Answer the user's question with precise technical clarity, actionable calculations, and markdown formatting.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.selectedModel}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: systemPrompt }] },
              ...this.chatHistory.slice(-6).map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.text }]
              }))
            ]
          })
        });

        if (response.ok) {
          const json = await response.json();
          const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            this.chatHistory.push({ role: "assistant", text: reply.trim() });
            return reply.trim();
          }
        }
      } catch (err) {
        console.warn("Gemini Chat API error:", err);
      }
    }

    // Heuristic Local Conversational Assistant Fallback
    const localReply = this.generateLocalChatReply(userText.toLowerCase(), bldg, state, timeStr);
    this.chatHistory.push({ role: "assistant", text: localReply });
    return localReply;
  }

  generateLocalChatReply(query, bldg, state, timeStr) {
    if (query.includes("battery") || query.includes("soc") || query.includes("storage")) {
      return `### 🔋 Battery Storage Status (${bldg.name})
- **Current SoC**: ${state.batterySoc}% (Capacity: ${bldg.batteryCapacityKwh} kWh)
- **Status**: ${state.batteryPowerKw < 0 ? `Charging at ${Math.abs(state.batteryPowerKw)} kW` : state.batteryPowerKw > 0 ? `Discharging at ${state.batteryPowerKw} kW` : 'Idle'}
- **Health Rating**: ${bldg.batteryHealth}% SOH (State of Health)
- **Recommendation**: Maintain discharge limit at 15% depth-of-discharge (DoD) to extend lithium cell cycle life past 4,500 cycles.`;
    }

    if (query.includes("solar") || query.includes("generation") || query.includes("pv")) {
      return `### ☀️ Solar Generation Analysis
- **Current Output**: **${state.solarGenKw} kW** (Installed Peak: ${bldg.solarCapacityKw} kW)
- **Capacity Factor**: ${((state.solarGenKw / bldg.solarCapacityKw) * 100).toFixed(1)}%
- **Environmental Irradiance**: ${state.irradianceWm2} W/m² (${this.sim.weatherCondition})
- **Forecast**: Peak solar generation will occur between **11:30 AM and 2:30 PM** generating an estimated ${Math.round(bldg.solarCapacityKw * 5.2)} kWh today.`;
    }

    if (query.includes("save") || query.includes("cost") || query.includes("tariff") || query.includes("roi")) {
      const dailySaving = (state.savingsHourly * 14).toFixed(0);
      return `### 💰 Financial & Tariff Optimization
- **Peak Grid Tariff**: ₹${this.sim.organization.tariffImport}/kWh
- **Net-Metering Export Credit**: ₹${this.sim.organization.tariffExport}/kWh
- **Estimated Savings Today**: **₹${dailySaving}** through self-consumption & peak shaving.
- **Action**: Shifting flexible loads (pumps & EV fleet) to afternoon solar surplus avoids ~₹420/day in peak grid surcharges.`;
    }

    if (query.includes("co2") || query.includes("carbon") || query.includes("sustainability") || query.includes("green")) {
      const co2Daily = (state.co2OffsetKgHourly * 12).toFixed(1);
      const trees = (co2Daily / 21).toFixed(1);
      return `### 🌿 Sustainability & Carbon Metrics
- **Grid Emission Factor**: ${this.sim.organization.gridEmissionFactor} kg CO₂ / kWh
- **Today's Carbon Offset**: **${co2Daily} kg CO₂** avoided
- **Equivalent Trees**: ~${trees} mature trees absorbing carbon for a year
- **Renewable Utilization**: Currently **${state.renewableUtilPct}%** of active demand is powered by zero-carbon energy.`;
    }

    if (query.includes("pump") || query.includes("schedule") || query.includes("water")) {
      return `### 💧 Water Pump Optimization
- **Pump Load**: ${bldg.flexibleLoads.waterPumps.powerKw} kW
- **Current Status**: ${bldg.flexibleLoads.waterPumps.active ? '🟢 ACTIVE' : '⚪ IDLE'}
- **Optimal Window**: Schedule between **12:30 PM – 2:30 PM** during peak solar generation. Running it now vs evening saves ~₹180/cycle.`;
    }

    return `Based on live telemetry at **${timeStr}** for **${bldg.name}**:
- Solar PV is generating **${state.solarGenKw} kW**, covering **${state.renewableUtilPct}%** of the active load (${state.consumptionKw} kW).
- Battery is at **${state.batterySoc}% SoC**.
- You can ask me specific questions regarding **battery optimization**, **solar forecasts**, **cost savings & tariffs**, or **load scheduling**!`;
  }
}

window.GeminiIntelligence = GeminiIntelligence;
