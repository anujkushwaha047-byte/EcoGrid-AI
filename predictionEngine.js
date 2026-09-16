/**
 * EcoGrid AI - AI Prediction & Forecasting Engine
 * SIH 2026 Problem Statement: 26200
 * Predicts 24-hour solar generation, consumption demand peaks, battery SoC trajectories,
 * and high renewable availability windows.
 */

class PredictionEngine {
  constructor(simulationEngine) {
    this.sim = simulationEngine;
  }

  // Generate 24-hour ahead multi-horizon forecast data
  generate24HourForecast(buildingId, weatherCondition) {
    const forecast = [];
    const bldg = this.sim.buildings[buildingId] || this.sim.buildings["bldg-academic-a"];

    for (let h = 0; h < 24; h += 0.5) {
      const point = this.sim.calculateInstantPhysics(buildingId, h, weatherCondition);
      
      // Predicted upper and lower confidence bounds (+- 8%)
      const solarUpper = Number((point.solarGenKw * 1.08).toFixed(2));
      const solarLower = Number((point.solarGenKw * 0.92).toFixed(2));
      const demandUpper = Number((point.consumptionKw * 1.06).toFixed(2));
      const demandLower = Number((point.consumptionKw * 0.94).toFixed(2));

      // Renewable availability classification
      let windowType = "neutral";
      if (point.solarGenKw > point.consumptionKw * 0.8) {
        windowType = "high_solar"; // Peak green window
      } else if (h >= 18.0 && h <= 21.5) {
        windowType = "peak_grid_tariff"; // High grid demand & cost window
      } else if (h >= 1.0 && h <= 5.5) {
        windowType = "low_baseload";
      }

      forecast.push({
        hour: h,
        label: this.sim.formatHourDecimal(h),
        solarGenKw: point.solarGenKw,
        solarUpper,
        solarLower,
        consumptionKw: point.consumptionKw,
        demandUpper,
        demandLower,
        batterySoc: point.batterySoc,
        gridImportKw: point.gridImportKw,
        gridExportKw: point.gridExportKw,
        renewableUtilPct: point.renewableUtilPct,
        windowType
      });
    }

    return forecast;
  }

  // Identify high-priority predictive windows
  getPredictiveWindows(forecast) {
    const windows = [];

    // 1. High Solar Window
    const solarPoints = forecast.filter(f => f.solarGenKw > 40);
    if (solarPoints.length > 0) {
      const start = solarPoints[0].label;
      const end = solarPoints[solarPoints.length - 1].label;
      const peak = Math.max(...solarPoints.map(p => p.solarGenKw));
      windows.push({
        type: "solar-peak",
        title: "High Renewable Availability Window",
        timeRange: `${start} - ${end}`,
        peakVal: `${peak} kW`,
        description: "Optimal window for scheduling water pumping, EV charging, and heavy thermal pre-cooling.",
        badge: "Green Energy Surge"
      });
    }

    // 2. Evening Peak Grid Demand Window
    const peakDemandPoints = forecast.filter(f => f.hour >= 18 && f.hour <= 21.5);
    if (peakDemandPoints.length > 0) {
      const peakDemand = Math.max(...peakDemandPoints.map(p => p.consumptionKw));
      windows.push({
        type: "demand-peak",
        title: "Evening Grid Peak & High Tariff Window",
        timeRange: "6:00 PM - 9:30 PM",
        peakVal: `${peakDemand} kW`,
        description: "Grid tariff at maximum ₹8.50/kWh. Automatic battery peak-shaving recommended.",
        badge: "Critical Shaving"
      });
    }

    // 3. Overnight Battery Storage Window
    windows.push({
      type: "arbitrage",
      title: "Clean Energy Storage & Balance",
      timeRange: "12:00 PM - 3:30 PM",
      peakVal: "98% SoC Target",
      description: "Battery will reach maximum state of charge. Excess solar exported to grid for credit.",
      badge: "Self-Sufficiency"
    });

    return windows;
  }

  // Utility to configure canvas for High-DPI displays without pixelation/blur
  setupCrispCanvas(canvas, targetWidth, targetHeight) {
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const width = Math.max(10, Math.round(targetWidth));
    const height = Math.max(10, Math.round(targetHeight));

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx.resetTransform) {
      ctx.resetTransform();
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    return { ctx, width, height, dpr };
  }

  // Draw Interactive Canvas Multi-Curve Chart with High Clarity and Hover Inspection
  renderForecastChart(canvasId, forecast) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !forecast || forecast.length === 0) return;

    const parentW = canvas.parentElement.clientWidth || canvas.parentElement.getBoundingClientRect().width || 700;
    const parentH = canvas.parentElement.clientHeight || canvas.parentElement.getBoundingClientRect().height || 320;

    const { ctx, width, height } = this.setupCrispCanvas(canvas, parentW, parentH);
    ctx.clearRect(0, 0, width, height);
    canvas._cachedForecast = forecast;

    const padding = { top: 35, right: 55, bottom: 42, left: 62 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Determine max Y value for power
    const maxVal = Math.max(
      ...forecast.map(f => Math.max(f.solarUpper, f.demandUpper)),
      100
    ) * 1.15;

    // Helper coordinates
    const getX = (index) => padding.left + (index / (forecast.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;
    const getBatteryY = (soc) => padding.top + chartH - (soc / 100) * chartH;

    // 1. Draw Grid Lines & Left Y-Axis (Power kW)
    ctx.lineWidth = 1;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = Math.round((maxVal / yTicks) * i);
      const yPos = Math.floor(padding.top + chartH - (i / yTicks) * chartH) + 0.5;

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartW, yPos);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.stroke();

      // Left Axis: Power (kW)
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${yVal} kW`, padding.left - 8, yPos);

      // Right Axis: Battery SoC (%)
      const socVal = Math.round((100 / yTicks) * i);
      ctx.fillStyle = "#06b6d4";
      ctx.textAlign = "left";
      ctx.fillText(`${socVal}%`, padding.left + chartW + 8, yPos);
    }

    // Right Y-Axis Header Label
    ctx.fillStyle = "#06b6d4";
    ctx.font = "700 10px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SoC (%)", padding.left + chartW + 28, padding.top - 14);

    // Left Y-Axis Header Label
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Power (kW)", padding.left - 15, padding.top - 14);

    // 2. Solar Window Highlight Zone
    const solarStartIdx = forecast.findIndex(f => f.hour === 10.0);
    const solarEndIdx = forecast.findIndex(f => f.hour === 16.0);
    if (solarStartIdx !== -1 && solarEndIdx !== -1) {
      const xStart = getX(solarStartIdx);
      const xEnd = getX(solarEndIdx);

      const winGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      winGrad.addColorStop(0, "rgba(245, 158, 11, 0.16)");
      winGrad.addColorStop(1, "rgba(245, 158, 11, 0.03)");
      ctx.fillStyle = winGrad;
      ctx.fillRect(xStart, padding.top, xEnd - xStart, chartH);

      // Vertical border lines for solar window
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xStart, padding.top); ctx.lineTo(xStart, padding.top + chartH);
      ctx.moveTo(xEnd, padding.top); ctx.lineTo(xEnd, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Window Header Pill
      const winCenterX = (xStart + xEnd) / 2;
      ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(winCenterX - 75, padding.top + 6, 150, 20, 10) : ctx.rect(winCenterX - 75, padding.top + 6, 150, 20);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "700 10px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☀️ Solar Generation Window", winCenterX, padding.top + 16);
    }

    // 3. Solar Confidence Band (Area and Bounds)
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(forecast[0].solarUpper));
    for (let i = 1; i < forecast.length; i++) {
      ctx.lineTo(getX(i), getY(forecast[i].solarUpper));
    }
    for (let i = forecast.length - 1; i >= 0; i--) {
      ctx.lineTo(getX(i), getY(forecast[i].solarLower));
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
    ctx.fill();

    // Dotted Upper / Lower Bound Lines
    ctx.strokeStyle = "rgba(245, 158, 11, 0.38)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(forecast[0].solarUpper));
    for (let i = 1; i < forecast.length; i++) ctx.lineTo(getX(i), getY(forecast[i].solarUpper));
    ctx.moveTo(getX(0), getY(forecast[0].solarLower));
    for (let i = 1; i < forecast.length; i++) ctx.lineTo(getX(i), getY(forecast[i].solarLower));
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Solar Generation Line (Amber 3px Crisp Stroke)
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(forecast[0].solarGenKw));
    for (let i = 1; i < forecast.length; i++) {
      ctx.lineTo(getX(i), getY(forecast[i].solarGenKw));
    }
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 5. Demand / Consumption Line (Rose 2.8px Crisp Stroke)
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(forecast[0].consumptionKw));
    for (let i = 1; i < forecast.length; i++) {
      ctx.lineTo(getX(i), getY(forecast[i].consumptionKw));
    }
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 6. Battery SoC Curve (Cyan 2.2px Crisp Dashed Line on Right Scale)
    ctx.beginPath();
    ctx.moveTo(getX(0), getBatteryY(forecast[0].batterySoc));
    for (let i = 1; i < forecast.length; i++) {
      ctx.lineTo(getX(i), getBatteryY(forecast[i].batterySoc));
    }
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 7. Peak Solar & Peak Demand Badges
    let peakSolarIdx = 0;
    let peakDemandIdx = 0;
    forecast.forEach((f, i) => {
      if (f.solarGenKw > forecast[peakSolarIdx].solarGenKw) peakSolarIdx = i;
      if (f.consumptionKw > forecast[peakDemandIdx].consumptionKw) peakDemandIdx = i;
    });

    if (forecast[peakSolarIdx].solarGenKw > 5) {
      const psX = getX(peakSolarIdx);
      const psY = getY(forecast[peakSolarIdx].solarGenKw);
      ctx.beginPath();
      ctx.arc(psX, psY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 8. Interactive Hover Crosshair & Data Highlight
    if (canvas._hoverIndex !== undefined && canvas._hoverIndex >= 0 && canvas._hoverIndex < forecast.length) {
      const idx = canvas._hoverIndex;
      const f = forecast[idx];
      const hX = Math.floor(getX(idx)) + 0.5;

      ctx.beginPath();
      ctx.moveTo(hX, padding.top);
      ctx.lineTo(hX, padding.top + chartH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point dots
      [
        { y: getY(f.solarGenKw), color: "#f59e0b" },
        { y: getY(f.consumptionKw), color: "#fb7185" },
        { y: getBatteryY(f.batterySoc), color: "#06b6d4" }
      ].forEach(p => {
        ctx.beginPath();
        ctx.arc(hX, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // 9. X-Axis Time Labels (Every 3 hours)
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < forecast.length; i += 6) {
      const f = forecast[i];
      const x = getX(i);
      ctx.fillText(f.label, x, height - padding.bottom + 12);
    }

    // Attach hover listener once
    if (!canvas._hasHoverSetup) {
      canvas._hasHoverSetup = true;
      this.attachForecastHoverEvents(canvas, padding, chartW, () => {
        this.renderForecastChart(canvasId, forecast);
      });
    }
  }

  // Interactive Hover Tooltip for 24-Hour Forecast
  attachForecastHoverEvents(canvas, padding, chartW, redrawFn) {
    let tooltip = canvas.parentElement.querySelector('.chart-tooltip-floating');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip-floating';
      canvas.parentElement.appendChild(tooltip);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const forecast = canvas._cachedForecast;
      if (!forecast || forecast.length === 0) return;

      if (mouseX < padding.left || mouseX > padding.left + chartW) {
        canvas._hoverIndex = -1;
        tooltip.style.display = 'none';
        redrawFn();
        return;
      }

      const ratio = (mouseX - padding.left) / chartW;
      const idx = Math.min(forecast.length - 1, Math.max(0, Math.round(ratio * (forecast.length - 1))));
      canvas._hoverIndex = idx;
      const f = forecast[idx];

      tooltip.innerHTML = `
        <div class="tooltip-title">📈 Horizon: ${f.label}</div>
        <div class="tooltip-row"><span style="color:#f59e0b"><span class="tooltip-dot" style="background:#f59e0b"></span>Pred. Solar:</span> <strong>${Math.round(f.solarGenKw)} kW</strong></div>
        <div class="tooltip-row" style="font-size:0.7rem; color:#94a3b8; margin-left: 12px;">Bounds: [${Math.round(f.solarLower)} - ${Math.round(f.solarUpper)} kW]</div>
        <div class="tooltip-row"><span style="color:#fb7185"><span class="tooltip-dot" style="background:#fb7185"></span>Pred. Demand:</span> <strong>${Math.round(f.consumptionKw)} kW</strong></div>
        <div class="tooltip-row"><span style="color:#06b6d4"><span class="tooltip-dot" style="background:#06b6d4"></span>Battery SoC:</span> <strong>${Math.round(f.batterySoc)}%</strong></div>
      `;
      tooltip.style.display = 'block';

      const tipW = tooltip.offsetWidth || 150;
      let tipX = mouseX + 14;
      if (tipX + tipW > rect.width - 10) {
        tipX = mouseX - tipW - 14;
      }
      tooltip.style.left = `${tipX}px`;
      tooltip.style.top = `30px`;

      redrawFn();
    });

    canvas.addEventListener('mouseleave', () => {
      canvas._hoverIndex = -1;
      tooltip.style.display = 'none';
      redrawFn();
    });
  }

}

window.PredictionEngine = PredictionEngine;
