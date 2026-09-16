/**
 * EcoGrid AI - Analytics, Sustainability & Report Generator
 * SIH 2026 Problem Statement: 26200
 * Handles multi-horizon comparative charts, ESG carbon metrics, printable audit reports, and CSV exports.
 */

class AnalyticsReports {
  constructor(simulationEngine) {
    this.sim = simulationEngine;
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

  // Draw Comparative Building Matrix Chart
  renderBuildingComparisonChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const parentW = canvas.parentElement.clientWidth || canvas.parentElement.getBoundingClientRect().width || 600;
    const parentH = canvas.parentElement.clientHeight || canvas.parentElement.getBoundingClientRect().height || 280;

    const { ctx, width, height } = this.setupCrispCanvas(canvas, parentW, parentH);
    ctx.clearRect(0, 0, width, height);

    const bldgs = Object.values(this.sim.buildings);
    const padding = { top: 34, right: 24, bottom: 52, left: 62 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...bldgs.map(b => Math.max(b.solarCapacityKw, b.peakLoadKw))) * 1.25 || 150;

    // Y-Axis Horizontal Grid Lines (Pixel-Snapped Crisp Lines)
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * i);
      const y = Math.floor(padding.top + chartH - (i / 4) * chartH) + 0.5;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${val} kW`, padding.left - 8, y);
    }

    // Draw Grouped Bars for each building (Solar Capacity vs Peak Load)
    const groupWidth = chartW / bldgs.length;
    const barWidth = Math.min(28, Math.max(14, groupWidth * 0.32));

    bldgs.forEach((b, i) => {
      const groupCenterX = padding.left + i * groupWidth + groupWidth / 2;

      // 1. Solar Capacity Bar (Amber Gradient)
      const solarH = Math.max(4, (b.solarCapacityKw / maxVal) * chartH);
      const solarX = groupCenterX - barWidth - 4;
      const solarY = padding.top + chartH - solarH;

      const solarGrad = ctx.createLinearGradient(0, solarY, 0, solarY + solarH);
      solarGrad.addColorStop(0, "#fbbf24");
      solarGrad.addColorStop(1, "#d97706");
      ctx.fillStyle = solarGrad;

      this.drawRoundedBar(ctx, solarX, solarY, barWidth, solarH, 4);

      // Direct Numeric Value on top of Solar Bar
      ctx.fillStyle = "#fbbf24";
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(b.solarCapacityKw)}`, solarX + barWidth / 2, Math.max(padding.top + 10, solarY - 5));

      // 2. Peak Load Bar (Rose Gradient)
      const loadH = Math.max(4, (b.peakLoadKw / maxVal) * chartH);
      const loadX = groupCenterX + 4;
      const loadY = padding.top + chartH - loadH;

      const loadGrad = ctx.createLinearGradient(0, loadY, 0, loadY + loadH);
      loadGrad.addColorStop(0, "#fb7185");
      loadGrad.addColorStop(1, "#e11d48");
      ctx.fillStyle = loadGrad;

      this.drawRoundedBar(ctx, loadX, loadY, barWidth, loadH, 4);

      // Direct Numeric Value on top of Load Bar
      ctx.fillStyle = "#fb7185";
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(b.peakLoadKw)}`, loadX + barWidth / 2, Math.max(padding.top + 10, loadY - 5));

      // Building Label below
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "600 12px Outfit, sans-serif";
      ctx.textAlign = "center";
      const shortName = b.name.replace("Building", "Bldg").replace("Center", "Ctr");
      ctx.fillText(shortName, groupCenterX, height - padding.bottom + 18);
    });

    // Chart Legend
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#fbbf24";
    this.drawRoundedBar(ctx, padding.left, 12, 12, 12, 3);
    ctx.font = "700 12px Outfit, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText("Solar Capacity (kW)", padding.left + 18, 18);

    ctx.fillStyle = "#fb7185";
    this.drawRoundedBar(ctx, padding.left + 175, 12, 12, 3);
    ctx.font = "700 12px Outfit, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText("Peak Demand (kW)", padding.left + 193, 18);
  }

  // Helper to draw rounded top bars
  drawRoundedBar(ctx, x, y, width, height, radius) {
    if (height < radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Live 24-Hour Multi-Series Area Chart on Dashboard Home Screen
  renderHomeLiveAreaChart(canvasId, buildingId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const parentW = canvas.parentElement.clientWidth || canvas.parentElement.getBoundingClientRect().width || 680;
    const parentH = canvas.parentElement.clientHeight || canvas.parentElement.getBoundingClientRect().height || 290;

    const { ctx, width, height } = this.setupCrispCanvas(canvas, parentW, parentH);
    ctx.clearRect(0, 0, width, height);

    // Build 24-hour baseline curve points (48 half-hour slots)
    const points = [];
    for (let h = 0; h < 24; h += 0.5) {
      const pt = this.sim.calculateInstantPhysics(buildingId, h, this.sim.weatherCondition);
      points.push({
        h,
        label: this.sim.formatHourDecimal(h),
        solar: pt.solarGenKw,
        load: pt.consumptionKw,
        battery: pt.batteryPowerKw
      });
    }
    canvas._cachedPoints = points;

    const padding = { top: 26, right: 28, bottom: 38, left: 58 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(
      ...points.map(p => Math.max(p.solar, p.load)),
      120
    ) * 1.15;

    // Y Grid - Crisp Pixel-Snapped Lines
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * i);
      const y = Math.floor(padding.top + chartH - (i / 4) * chartH) + 0.5;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${val} kW`, padding.left - 8, y);
    }

    const getX = (idx) => padding.left + (idx / (points.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

    // 1. Solar Generation Area Fill & Crisp Vibrant Curve
    const solarGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    solarGrad.addColorStop(0, "rgba(245, 158, 11, 0.42)");
    solarGrad.addColorStop(0.7, "rgba(245, 158, 11, 0.12)");
    solarGrad.addColorStop(1, "rgba(245, 158, 11, 0.0)");

    ctx.beginPath();
    ctx.moveTo(getX(0), padding.top + chartH);
    ctx.lineTo(getX(0), getY(points[0].solar));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].solar));
    }
    ctx.lineTo(getX(points.length - 1), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = solarGrad;
    ctx.fill();

    // Solar Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0].solar));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].solar));
    }
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 2. Load / Demand Curve Fill & Stroke
    const loadGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    loadGrad.addColorStop(0, "rgba(251, 113, 133, 0.22)");
    loadGrad.addColorStop(1, "rgba(251, 113, 133, 0.0)");

    ctx.beginPath();
    ctx.moveTo(getX(0), padding.top + chartH);
    ctx.lineTo(getX(0), getY(points[0].load));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].load));
    }
    ctx.lineTo(getX(points.length - 1), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = loadGrad;
    ctx.fill();

    // Load Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0].load));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].load));
    }
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 3. Current Time Cursor Line (Live vertical guide)
    const currentHour = this.sim.timeOfDay;
    const currentX = Math.floor(padding.left + (currentHour / 24) * chartW) + 0.5;

    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, padding.top + chartH);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current Time Pulsing Dot with white core
    ctx.beginPath();
    ctx.arc(currentX, padding.top + 6, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(currentX, padding.top + 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // "NOW" Pill Badge above current time
    ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
    this.drawRoundedBar(ctx, currentX - 22, padding.top - 18, 44, 16, 4);
    ctx.fillStyle = "#34d399";
    ctx.font = "700 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("LIVE NOW", currentX, padding.top - 8);

    // 4. Interactive Hover Highlight (if user is hovering)
    if (canvas._hoverIndex !== undefined && canvas._hoverIndex >= 0 && canvas._hoverIndex < points.length) {
      const idx = canvas._hoverIndex;
      const pt = points[idx];
      const hoverX = Math.floor(getX(idx)) + 0.5;

      // Vertical crosshair
      ctx.beginPath();
      ctx.moveTo(hoverX, padding.top);
      ctx.lineTo(hoverX, padding.top + chartH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point dots on curves
      const solarPtY = getY(pt.solar);
      const loadPtY = getY(pt.load);

      ctx.beginPath();
      ctx.arc(hoverX, solarPtY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hoverX, loadPtY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fb7185";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. X Axis Hour Labels (High-contrast, crisp typography)
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i < points.length; i += 6) { // Every 3 hours (00:00, 03:00, 06:00, etc.)
      const x = getX(i);
      ctx.fillText(points[i].label, x, height - padding.bottom + 12);
    }

    // Setup interactive mouse tracking once
    if (!canvas._hasHoverSetup) {
      canvas._hasHoverSetup = true;
      this.attachChartHoverEvents(canvas, padding, chartW, () => {
        this.renderHomeLiveAreaChart(canvasId, buildingId);
      });
    }
  }

  // Attach hover events for precision inspection tooltip
  attachChartHoverEvents(canvas, padding, chartW, redrawFn) {
    let tooltip = canvas.parentElement.querySelector('.chart-tooltip-floating');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip-floating';
      canvas.parentElement.appendChild(tooltip);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const points = canvas._cachedPoints;
      if (!points || points.length === 0) return;

      if (mouseX < padding.left || mouseX > padding.left + chartW) {
        canvas._hoverIndex = -1;
        tooltip.style.display = 'none';
        redrawFn();
        return;
      }

      const ratio = (mouseX - padding.left) / chartW;
      const idx = Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
      canvas._hoverIndex = idx;
      const pt = points[idx];

      tooltip.innerHTML = `
        <div class="tooltip-title">🕒 Time: ${pt.label}</div>
        <div class="tooltip-row"><span style="color:#f59e0b"><span class="tooltip-dot" style="background:#f59e0b"></span>Solar:</span> <strong>${Math.round(pt.solar)} kW</strong></div>
        <div class="tooltip-row"><span style="color:#fb7185"><span class="tooltip-dot" style="background:#fb7185"></span>Load:</span> <strong>${Math.round(pt.load)} kW</strong></div>
        <div class="tooltip-row"><span style="color:#34d399"><span class="tooltip-dot" style="background:#34d399"></span>Net:</span> <strong>${Math.round(pt.solar - pt.load)} kW</strong></div>
      `;
      tooltip.style.display = 'block';

      // Position tooltip safely within bounds
      const tipW = tooltip.offsetWidth || 130;
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

  // Draw Clean Energy Mix Donut Ring
  renderHomeEnergyMixDonut(canvasId, state) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const parentW = canvas.parentElement.clientWidth || 160;
    const size = Math.min(parentW, 160);

    const { ctx } = this.setupCrispCanvas(canvas, size, size);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const lineWidth = size * 0.11;

    // Background track ring (crisp dark glass guide)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Data Segments
    const solarVal = Math.max(0.1, state.solarGenKw);
    const batteryVal = Math.max(0.1, state.batteryPowerKw > 0 ? state.batteryPowerKw : 10);
    const gridVal = Math.max(0.1, state.gridImportKw > 0 ? state.gridImportKw : 8);
    const total = solarVal + batteryVal + gridVal;

    const segments = [
      { val: solarVal / total, color: "#f59e0b" },    // Solar Gold
      { val: batteryVal / total, color: "#06b6d4" },  // Battery Cyan
      { val: gridVal / total, color: "#8b5cf6" }     // Grid Purple
    ];

    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
      const sliceAngle = seg.val * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle - 0.03);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      startAngle = endAngle;
    });

    // Update center percentage label
    const cleanPct = Math.min(100, Math.round(((solarVal + (state.batteryPowerKw > 0 ? state.batteryPowerKw : 0)) / total) * 100)) || 86;
    const cleanEl = document.getElementById("donutCleanPct");
    if (cleanEl) cleanEl.textContent = `${cleanPct}%`;
  }

  // Draw Mini KPI Sparkline Canvas (Ultra-Sharp with Soft Area Glow and Endpoint Dot)
  renderKpiSparkline(canvasId, points, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const parentW = canvas.parentElement.clientWidth || canvas.getBoundingClientRect().width || 160;
    const parentH = canvas.parentElement.clientHeight || canvas.getBoundingClientRect().height || 28;

    const { ctx, width, height } = this.setupCrispCanvas(canvas, parentW, parentH);
    ctx.clearRect(0, 0, width, height);

    if (!points || points.length < 2) return;

    const min = Math.min(...points);
    const max = Math.max(...points, min + 1);

    const getX = (i) => (i / (points.length - 1)) * width;
    const getY = (val) => height - 4 - ((val - min) / (max - min)) * (height - 8);

    // Crisp Gradient Area Fill
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, color + "40");
    grad.addColorStop(1, color + "00");

    ctx.beginPath();
    ctx.moveTo(getX(0), height);
    ctx.lineTo(getX(0), getY(points[0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i]));
    }
    ctx.lineTo(getX(points.length - 1), height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Sharp Foreground Stroke
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Glowing Endpoint Dot
    const lastX = getX(points.length - 1);
    const lastY = getY(points[points.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }


  // Generate CSV Data Export
  exportTelemetryCSV() {
    const bldg = this.sim.buildings[this.sim.selectedBuildingId];
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Building,Solar_Generation_kW,Consumption_kW,Battery_SoC_Pct,Battery_Power_kW,Grid_Import_kW,Grid_Export_kW,Renewable_Util_Pct,Cost_INR,CO2_Avoided_kg\n";

    for (let h = 0; h < 24; h += 0.5) {
      const pt = this.sim.calculateInstantPhysics(this.sim.selectedBuildingId, h, this.sim.weatherCondition);
      const row = [
        this.sim.formatHourDecimal(h),
        `"${bldg.name}"`,
        pt.solarGenKw,
        pt.consumptionKw,
        pt.batterySoc,
        pt.batteryPowerKw,
        pt.gridImportKw,
        pt.gridExportKw,
        pt.renewableUtilPct,
        pt.costHourly,
        pt.co2OffsetKgHourly
      ].join(",");
      csvContent += row + "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoGridAI_${bldg.id}_AuditReport_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Print Executive Summary Report
  triggerPrintReport() {
    window.print();
  }
}

window.AnalyticsReports = AnalyticsReports;
