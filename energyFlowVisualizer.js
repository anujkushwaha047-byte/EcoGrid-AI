/**
 * EcoGrid AI - Dynamic Energy Flow Visualizer
 * High-performance HTML5 Canvas particle animation rendering live energy dynamics:
 * Solar Panels ➔ Inverter/EMS ➔ Battery Bank ⇄ Building Sub-loads ⇄ Utility Grid
 */

class EnergyFlowVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.particles = [];
    this.maxParticles = 120;
    this.animationFrameId = null;

    // Node layout positions (calculated on resize)
    this.nodes = {
      solar: { x: 0, y: 0, radius: 36, label: "Solar Array", color: "#f59e0b", icon: "☀️", power: 0, unit: "kW" },
      ems: { x: 0, y: 0, radius: 46, label: "Smart EMS Hub", color: "#10b981", icon: "⚡", power: 0, unit: "kW" },
      battery: { x: 0, y: 0, radius: 36, label: "BESS Storage", color: "#06b6d4", icon: "🔋", power: 0, unit: "%", sub: "" },
      building: { x: 0, y: 0, radius: 36, label: "Building Load", color: "#fb7185", icon: "🏢", power: 0, unit: "kW" },
      grid: { x: 0, y: 0, radius: 36, label: "Utility Grid", color: "#8b5cf6", icon: "🌐", power: 0, unit: "kW", dir: "" }
    };

    this.currentData = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.setupInteractivity();
    this.animate();
  }

  setupInteractivity() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let hovered = false;
      for (const key in this.nodes) {
        const node = this.nodes[key];
        const dist = Math.hypot(mouseX - node.x, mouseY - node.y);
        if (dist <= node.radius + 5) {
          hovered = true;
          break;
        }
      }
      this.canvas.style.cursor = hovered ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const key in this.nodes) {
        const node = this.nodes[key];
        const dist = Math.hypot(mouseX - node.x, mouseY - node.y);
        if (dist <= node.radius + 5) {
          if (window.openNodeTelemetryModal) {
            window.openNodeTelemetryModal(key, node, this.currentData);
          }
          break;
        }
      }
    });
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    
    this.width = Math.max(10, Math.round(rect.width || this.canvas.parentElement.clientWidth || 600));
    this.height = Math.max(10, Math.round(rect.height || this.canvas.parentElement.clientHeight || 380));

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Reposition nodes gracefully
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.nodes.ems.x = cx;
    this.nodes.ems.y = cy;

    this.nodes.solar.x = cx - this.width * 0.28;
    this.nodes.solar.y = cy - this.height * 0.28;

    this.nodes.battery.x = cx - this.width * 0.32;
    this.nodes.battery.y = cy + this.height * 0.25;

    this.nodes.building.x = cx + this.width * 0.32;
    this.nodes.building.y = cy - this.height * 0.22;

    this.nodes.grid.x = cx + this.width * 0.28;
    this.nodes.grid.y = cy + this.height * 0.28;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        channel: 'solar-to-ems', // 'solar-to-ems', 'ems-to-battery', 'battery-to-ems', 'ems-to-building', 'grid-to-ems', 'ems-to-grid'
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.008,
        size: 2.5 + Math.random() * 2,
        alpha: 0.6 + Math.random() * 0.4
      });
    }
  }

  updateData(state, building) {
    this.currentData = { state, building };

    this.nodes.solar.power = state.solarGenKw;
    this.nodes.building.power = state.consumptionKw;
    this.nodes.battery.power = state.batterySoc;
    this.nodes.battery.sub = state.batteryPowerKw < 0 ? `Charging (${Math.abs(state.batteryPowerKw)} kW)` : state.batteryPowerKw > 0 ? `Discharging (${state.batteryPowerKw} kW)` : "Idle";

    if (state.gridImportKw > 0) {
      this.nodes.grid.power = state.gridImportKw;
      this.nodes.grid.dir = "Importing";
    } else {
      this.nodes.grid.power = state.gridExportKw;
      this.nodes.grid.dir = "Exporting";
    }

    this.nodes.ems.power = Math.max(state.solarGenKw, state.consumptionKw);
  }

  drawConnectionLine(n1, n2, color, active) {
    this.ctx.beginPath();
    this.ctx.moveTo(n1.x, n1.y);
    this.ctx.lineTo(n2.x, n2.y);
    this.ctx.strokeStyle = active ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.09)';
    this.ctx.lineWidth = active ? 2.5 : 1.5;
    this.ctx.setLineDash(active ? [] : [4, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawNode(node) {
    this.ctx.save();

    // Outer Glow Ring
    const gradient = this.ctx.createRadialGradient(node.x, node.y, node.radius * 0.6, node.x, node.y, node.radius * 1.5);
    gradient.addColorStop(0, node.color + "55");
    gradient.addColorStop(1, "transparent");

    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius * 1.4, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Node Circle Body
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#111a28";
    this.ctx.fill();
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = node.color;
    this.ctx.stroke();

    // Node Icon / Symbol
    this.ctx.font = `${Math.round(node.radius * 0.7)}px sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(node.icon, node.x, node.y - (node.radius > 40 ? 4 : 2));

    // Label & Metrics below node
    this.ctx.font = "700 12px Outfit, sans-serif";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(node.label, node.x, node.y + node.radius + 15);

    this.ctx.font = "700 13px 'JetBrains Mono', monospace";
    this.ctx.fillStyle = node.color;
    const valueText = `${node.power} ${node.unit}`;
    this.ctx.fillText(valueText, node.x, node.y + node.radius + 30);

    if (node.sub || node.dir) {
      this.ctx.font = "600 11px Outfit, sans-serif";
      this.ctx.fillStyle = "#cbd5e1";
      this.ctx.fillText(node.sub || node.dir, node.x, node.y + node.radius + 44);
    }

    this.ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (!this.currentData) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
      return;
    }

    const { state } = this.currentData;

    // Draw static/dashed connection paths
    const hasSolar = state.solarGenKw > 0;
    const hasBatteryCharge = state.batteryPowerKw < 0;
    const hasBatteryDischarge = state.batteryPowerKw > 0;
    const hasConsumption = state.consumptionKw > 0;
    const hasGridImport = state.gridImportKw > 0;
    const hasGridExport = state.gridExportKw > 0;

    this.drawConnectionLine(this.nodes.solar, this.nodes.ems, "#f59e0b", hasSolar);
    this.drawConnectionLine(this.nodes.ems, this.nodes.battery, "#06b6d4", hasBatteryCharge || hasBatteryDischarge);
    this.drawConnectionLine(this.nodes.ems, this.nodes.building, "#fb7185", hasConsumption);
    this.drawConnectionLine(this.nodes.ems, this.nodes.grid, "#8b5cf6", hasGridImport || hasGridExport);

    // Update & Draw Flow Particles
    this.particles.forEach(p => {
      let startNode = null;
      let endNode = null;
      let color = "#fff";
      let active = false;

      // Assign channels based on current physical power transfer
      if (hasSolar && Math.random() < 0.35) {
        startNode = this.nodes.solar;
        endNode = this.nodes.ems;
        color = "#f59e0b";
        active = true;
      } else if (hasConsumption && Math.random() < 0.4) {
        startNode = this.nodes.ems;
        endNode = this.nodes.building;
        color = "#fb7185";
        active = true;
      } else if (hasBatteryCharge) {
        startNode = this.nodes.ems;
        endNode = this.nodes.battery;
        color = "#06b6d4";
        active = true;
      } else if (hasBatteryDischarge) {
        startNode = this.nodes.battery;
        endNode = this.nodes.ems;
        color = "#06b6d4";
        active = true;
      } else if (hasGridImport) {
        startNode = this.nodes.grid;
        endNode = this.nodes.ems;
        color = "#a855f7";
        active = true;
      } else if (hasGridExport) {
        startNode = this.nodes.ems;
        endNode = this.nodes.grid;
        color = "#10b981";
        active = true;
      }

      if (startNode && endNode && active) {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const px = startNode.x + (endNode.x - startNode.x) * p.progress;
        const py = startNode.y + (endNode.y - startNode.y) * p.progress;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 8;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    // Draw all nodes on top
    this.drawNode(this.nodes.solar);
    this.drawNode(this.nodes.battery);
    this.drawNode(this.nodes.ems);
    this.drawNode(this.nodes.building);
    this.drawNode(this.nodes.grid);

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

window.EnergyFlowVisualizer = EnergyFlowVisualizer;
