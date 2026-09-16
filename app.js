/**
 * EcoGrid AI - Master Application Controller
 * SIH 2026 Problem Statement: 26200
 * Coordinates state, UI DOM updates, role-based views, event dispatching,
 * modals, and the SIH Judge Interactive Tour.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Subsystems
  const sim = window.ecoSimulation;
  const flowVisualizer = new window.EnergyFlowVisualizer("energyFlowCanvas");
  const predictor = new window.PredictionEngine(sim);
  const gemini = new window.GeminiIntelligence(sim);
  const optimizer = new window.OptimizationEngine(sim);
  const anomalyScanner = new window.AnomalyDetector(sim);
  const reportsMgr = new window.AnalyticsReports(sim);

  // App State & Authentication
  let currentUser = null; // null = not logged in
  let currentRole = "admin"; // "admin", "manager", "user"
  let activeTab = "dashboard";
  let lastAiReasoningUpdate = 0;
  let tourCurrentStep = 0;
  const authStorageKey = "ecogridAuthenticatedUser";
  const landingPage = document.getElementById("landingPage");

  function readStoredUser() {
    try {
      const storedUser = sessionStorage.getItem(authStorageKey);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.warn("Unable to restore the EcoGrid AI session.", error);
      sessionStorage.removeItem(authStorageKey);
      return null;
    }
  }

  function showPublicLanding() {
    if (landingPage) {
      landingPage.classList.remove("landing-page-hidden");
      landingPage.style.display = "";
      landingPage.scrollTop = 0;
    }
    if (authOverlay) {
      authOverlay.classList.add("dismissed");
      authOverlay.style.display = "none";
    }
  }

  function showLoginExperience() {
    if (landingPage) {
      landingPage.classList.add("landing-page-hidden");
    }
    if (authOverlay) {
      authOverlay.classList.remove("dismissed");
      authOverlay.style.display = "flex";
      if (loginFormView) loginFormView.style.display = "block";
      if (registerFormView) registerFormView.style.display = "none";
      if (forgotPasswordFormView) forgotPasswordFormView.style.display = "none";
    }
  }

  currentUser = readStoredUser();
  if (currentUser) currentRole = currentUser.role || "admin";

  // 1. Authentication Page Controller
  const authOverlay = document.getElementById("authPageOverlay");
  const loginFormView = document.getElementById("loginFormView");
  const registerFormView = document.getElementById("registerFormView");
  const forgotPasswordFormView = document.getElementById("forgotPasswordFormView");

  // Form Switchers
  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const showLoginFromRegBtn = document.getElementById("showLoginFromRegBtn");
  const showForgotPasswordBtn = document.getElementById("showForgotPasswordBtn");
  const showLoginFromForgotBtn = document.getElementById("showLoginFromForgotBtn");

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", () => {
      loginFormView.style.display = "none";
      forgotPasswordFormView.style.display = "none";
      registerFormView.style.display = "block";
    });
  }

  if (showLoginFromRegBtn) {
    showLoginFromRegBtn.addEventListener("click", () => {
      registerFormView.style.display = "none";
      forgotPasswordFormView.style.display = "none";
      loginFormView.style.display = "block";
    });
  }

  if (showForgotPasswordBtn) {
    showForgotPasswordBtn.addEventListener("click", () => {
      loginFormView.style.display = "none";
      registerFormView.style.display = "none";
      forgotPasswordFormView.style.display = "block";
    });
  }

  if (showLoginFromForgotBtn) {
    showLoginFromForgotBtn.addEventListener("click", () => {
      forgotPasswordFormView.style.display = "none";
      registerFormView.style.display = "none";
      loginFormView.style.display = "block";
    });
  }

  // Submit Login
  const submitLoginBtn = document.getElementById("submitLoginBtn");
  if (submitLoginBtn) {
    submitLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim() || "admin@aicte.gov.in";
      const role = document.getElementById("loginRoleSelect") ? document.getElementById("loginRoleSelect").value : "admin";
      const userName = email.split("@")[0].toUpperCase();

      loginUser({
        name: userName === "ADMIN" ? "Admin AICTE" : userName,
        email: email,
        role: role,
        org: "AICTE Green Campus"
      }, true); // Go directly to dashboard
    });
  }

  // Support form submit on Enter key
  if (loginFormView) {
    loginFormView.addEventListener("submit", (e) => {
      e.preventDefault();
      if (submitLoginBtn) submitLoginBtn.click();
    });
  }

  // 1-Click Instant Demo / Judge Login (Direct to Dashboard)
  const instantDemoBtn = document.getElementById("instantDemoBtn");
  if (instantDemoBtn) {
    instantDemoBtn.addEventListener("click", () => {
      loginUser({
        name: "SIH 2026 Judge",
        email: "judge@sih.gov.in",
        role: "admin",
        org: "AICTE National Evaluation Hub"
      }, true); // true = direct to dashboard
    });
  }

  // Submit Create Account
  const submitRegisterBtn = document.getElementById("submitRegisterBtn");
  if (submitRegisterBtn) {
    submitRegisterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim() || "New User";
      const org = document.getElementById("regOrg").value.trim() || "Green Campus";
      const email = document.getElementById("regEmail").value.trim() || "user@ecogrid.ai";
      const role = document.getElementById("regRole") ? document.getElementById("regRole").value : "manager";

      showToast(`Account successfully created for ${name}`, "success");
      loginUser({ name, email, role, org }, true);
    });
  }

  if (registerFormView) {
    registerFormView.addEventListener("submit", (e) => {
      e.preventDefault();
      if (submitRegisterBtn) submitRegisterBtn.click();
    });
  }

  // Submit Forgot Password
  const submitForgotBtn = document.getElementById("submitForgotBtn");
  if (submitForgotBtn) {
    submitForgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("forgotEmail").value.trim();
      showToast(`Password recovery link dispatched to: ${email}`, "success");
      forgotPasswordFormView.style.display = "none";
      loginFormView.style.display = "block";
    });
  }

  // Password Visibility Toggle Handlers
  const toggleLoginPasswordBtn = document.getElementById("toggleLoginPasswordBtn");
  if (toggleLoginPasswordBtn) {
    toggleLoginPasswordBtn.addEventListener("click", () => {
      const passInput = document.getElementById("loginPassword");
      if (passInput) {
        if (passInput.type === "password") {
          passInput.type = "text";
          toggleLoginPasswordBtn.textContent = "🙈";
        } else {
          passInput.type = "password";
          toggleLoginPasswordBtn.textContent = "👁️";
        }
      }
    });
  }

  const toggleRegPasswordBtn = document.getElementById("toggleRegPasswordBtn");
  if (toggleRegPasswordBtn) {
    toggleRegPasswordBtn.addEventListener("click", () => {
      const passInput = document.getElementById("regPassword");
      if (passInput) {
        if (passInput.type === "password") {
          passInput.type = "text";
          toggleRegPasswordBtn.textContent = "🙈";
        } else {
          passInput.type = "password";
          toggleRegPasswordBtn.textContent = "👁️";
        }
      }
    });
  }

  // Back to Welcome Intro link inside Login Modal
  const backToWelcomeFromLoginBtn = document.getElementById("backToWelcomeFromLoginBtn");
  if (backToWelcomeFromLoginBtn) {
    backToWelcomeFromLoginBtn.addEventListener("click", () => {
      showPublicLanding();
      history.replaceState({ publicLanding: true }, "", window.location.href);
    });
  }

  function loginUser(userData, directToDashboard = true) {
    currentUser = userData;
    currentRole = userData.role || "admin";
    sessionStorage.setItem(authStorageKey, JSON.stringify(userData));

    // Update Header User Profile
    const headerName = document.getElementById("headerUserName");
    const headerRole = document.getElementById("headerUserRole");
    const headerAvatar = document.getElementById("headerUserAvatar");
    const roleSelect = document.getElementById("roleSelect");

    if (headerName) headerName.textContent = userData.name;
    if (headerRole) headerRole.textContent = userData.role === "admin" ? "Administrator" : userData.role === "manager" ? "Energy Manager" : "General User";
    if (headerAvatar) headerAvatar.textContent = userData.name.charAt(0).toUpperCase();
    if (roleSelect) roleSelect.value = userData.role;

    updateRolePermissions();

    // Dismiss Auth Overlay
    if (authOverlay) {
      authOverlay.classList.add("dismissed");
      authOverlay.style.display = "none";
    }

    // Dismiss Welcome Splash
    if (welcomeSplash) {
      welcomeSplash.classList.add("dismissed");
      welcomeSplash.style.display = "none";
    }
    if (landingPage) landingPage.classList.add("landing-page-hidden");

    if (directToDashboard) switchTab("dashboard");
    playSound("opt");
    showToast(`Logged in as ${userData.name} — EcoGrid AI Dashboard active`, "success");
  }

  // Logout Handler
  const headerLogoutBtn = document.getElementById("headerLogoutBtn");
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener("click", () => {
      currentUser = null;
      sessionStorage.removeItem(authStorageKey);
      activeTab = "dashboard";
      showPublicLanding();
      history.replaceState({ publicLanding: true }, "", window.location.href);
      if (welcomeSplash) {
        welcomeSplash.style.display = "none";
      }
      playSound("click");
      showToast("Signed out successfully", "info");
    });
  }

  // Welcome Splash Screen Controller
  const welcomeSplash = document.getElementById("welcomeSplashOverlay");
  const welcomeJudgeDirectBtn = document.getElementById("welcomeJudgeDirectBtn");
  const welcomeOpenLoginBtn = document.getElementById("welcomeOpenLoginBtn");
  const launchPlatformBtn = document.getElementById("launchPlatformBtn");
  const welcomeStartTourBtn = document.getElementById("welcomeStartTourBtn");
  const replayWelcomeBtn = document.getElementById("replayWelcomeBtn");

  function dismissWelcomeSplash() {
    if (welcomeSplash) {
      welcomeSplash.classList.add("dismissed");
      setTimeout(() => {
        welcomeSplash.style.display = "none";
      }, 400);
      playSound("opt");
      showToast("Welcome to EcoGrid AI Command Center", "success");
    }
  }

  function showWelcomeSplash() {
    if (welcomeSplash) {
      welcomeSplash.style.display = "flex";
      welcomeSplash.classList.remove("dismissed");
      playSound("click");
    }
  }

  // 1. SIH Judges / Direct Demo Access from Welcome Splash
  if (welcomeJudgeDirectBtn) {
    welcomeJudgeDirectBtn.addEventListener("click", () => {
      loginUser({
        name: "SIH 2026 Judge",
        email: "judge@sih.gov.in",
        role: "admin",
        org: "AICTE National Evaluation Hub"
      }, true);
    });
  }

  // 2. Open Login Portal from Welcome Splash
  if (welcomeOpenLoginBtn) {
    welcomeOpenLoginBtn.addEventListener("click", () => {
      if (welcomeSplash) {
        welcomeSplash.classList.add("dismissed");
        welcomeSplash.style.display = "none";
      }
      if (authOverlay) {
        authOverlay.classList.remove("dismissed");
        authOverlay.style.display = "flex";
        if (loginFormView) loginFormView.style.display = "block";
        if (registerFormView) registerFormView.style.display = "none";
        if (forgotPasswordFormView) forgotPasswordFormView.style.display = "none";
      }
      if (landingPage) landingPage.classList.add("landing-page-hidden");
      playSound("click");
    });
  }

  if (launchPlatformBtn) {
    launchPlatformBtn.addEventListener("click", dismissWelcomeSplash);
  }

  if (welcomeStartTourBtn) {
    welcomeStartTourBtn.addEventListener("click", () => {
      dismissWelcomeSplash();
      setTimeout(() => {
        const tourBtn = document.getElementById("startSihTourBtn");
        if (tourBtn) tourBtn.click();
      }, 300);
    });
  }

  if (replayWelcomeBtn) {
    replayWelcomeBtn.addEventListener("click", showWelcomeSplash);
  }

  // 2. Navigation Tab Routing
  const navItems = document.querySelectorAll(".nav-item");
  const viewSections = document.querySelectorAll(".view-section");

  function switchTab(tabId) {
    if (!currentUser) {
      showLoginExperience();
      return;
    }
    activeTab = tabId;
    navItems.forEach(item => {
      if (item.dataset.tab === tabId) item.classList.add("active");
      else item.classList.remove("active");
    });

    viewSections.forEach(sec => {
      if (sec.id === `view-${tabId}`) sec.classList.add("active");
      else sec.classList.remove("active");
    });

    // Specific chart / canvas re-draws on tab switch with frame synchronization
    requestAnimationFrame(() => {
      if (tabId === "dashboard") {
        flowVisualizer.resize();
        const state = sim.calculateInstantPhysics(sim.selectedBuildingId, sim.timeOfDay, sim.weatherCondition);
        reportsMgr.renderHomeLiveAreaChart("homeLiveAreaCanvas", sim.selectedBuildingId);
        reportsMgr.renderHomeEnergyMixDonut("homeEnergyMixCanvas", state);
      } else if (tabId === "predictions") {
        const forecast = predictor.generate24HourForecast(sim.selectedBuildingId, sim.weatherCondition);
        predictor.renderForecastChart("forecastChartCanvas", forecast);
      } else if (tabId === "campus" || tabId === "reports") {
        reportsMgr.renderBuildingComparisonChart("buildingCompCanvas");
        if (document.getElementById("reportsCompCanvas")) {
          reportsMgr.renderBuildingComparisonChart("reportsCompCanvas");
        }
      }
    });
  }

  // Global window resize listener to keep charts razor sharp on window resize or zoom
  let chartResizeTimeout = null;
  window.addEventListener("resize", () => {
    clearTimeout(chartResizeTimeout);
    chartResizeTimeout = setTimeout(() => {
      if (activeTab === "dashboard") {
        flowVisualizer.resize();
        const state = sim.calculateInstantPhysics(sim.selectedBuildingId, sim.timeOfDay, sim.weatherCondition);
        reportsMgr.renderHomeLiveAreaChart("homeLiveAreaCanvas", sim.selectedBuildingId);
        reportsMgr.renderHomeEnergyMixDonut("homeEnergyMixCanvas", state);
      } else if (activeTab === "predictions") {
        const forecast = predictor.generate24HourForecast(sim.selectedBuildingId, sim.weatherCondition);
        predictor.renderForecastChart("forecastChartCanvas", forecast);
      } else if (activeTab === "campus" || activeTab === "reports") {
        reportsMgr.renderBuildingComparisonChart("buildingCompCanvas");
        if (document.getElementById("reportsCompCanvas")) {
          reportsMgr.renderBuildingComparisonChart("reportsCompCanvas");
        }
      }
    }, 80);
  });

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // 3. Role Switcher Controller
  const roleSelect = document.getElementById("roleSelect");
  if (roleSelect) {
    roleSelect.addEventListener("change", (e) => {
      currentRole = e.target.value;
      updateRolePermissions();
      showToast(`Switched active role to: ${currentRole.toUpperCase()}`, "info");
    });
  }

  function updateRolePermissions() {
    const adminElements = document.querySelectorAll(".admin-only");
    const managerElements = document.querySelectorAll(".manager-only");

    if (currentRole === "user") {
      adminElements.forEach(el => el.style.display = "none");
      managerElements.forEach(el => el.style.display = "none");
    } else if (currentRole === "manager") {
      adminElements.forEach(el => el.style.display = "none");
      managerElements.forEach(el => el.style.display = "");
    } else {
      adminElements.forEach(el => el.style.display = "");
      managerElements.forEach(el => el.style.display = "");
    }
  }

  // 4. Campus & Building Selection
  const buildingSelect = document.getElementById("buildingSelect");
  if (buildingSelect) {
    buildingSelect.addEventListener("change", (e) => {
      sim.selectBuilding(e.target.value);
      showToast(`Selected Microgrid Node: ${sim.buildings[e.target.value].name}`, "success");
      updateBuildingCards();
    });
  }

  // 5. Toast Notification Utility
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : type === "warning" ? "⚠️" : type === "error" ? "✕" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  window.showToast = showToast;

  // 6. Simulator Controls DOM Binding
  const timeSlider = document.getElementById("timeSlider");
  const timeVal = document.getElementById("timeVal");
  if (timeSlider) {
    timeSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      sim.setTimeOfDay(val);
      if (timeVal) timeVal.textContent = sim.formatHourDecimal(val);
    });
  }

  const cloudSlider = document.getElementById("cloudSlider");
  const cloudVal = document.getElementById("cloudVal");
  if (cloudSlider) {
    cloudSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      sim.setCloudCover(val);
      if (cloudVal) cloudVal.textContent = `${val}%`;
    });
  }

  const occupancySlider = document.getElementById("occupancySlider");
  const occupancyVal = document.getElementById("occupancyVal");
  if (occupancySlider) {
    occupancySlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      sim.setBuildingOccupancy(sim.selectedBuildingId, val);
      if (occupancyVal) occupancyVal.textContent = `${val}%`;
    });
  }

  const speedSelect = document.getElementById("speedSelect");
  if (speedSelect) {
    speedSelect.addEventListener("change", (e) => {
      sim.setSimulationSpeed(parseFloat(e.target.value));
      showToast(`Simulation speed adjusted to ${e.target.value}x`, "info");
    });
  }

  const playPauseBtn = document.getElementById("playPauseBtn");
  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      const isRunning = sim.togglePlayPause();
      playPauseBtn.innerHTML = isRunning 
        ? `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause Simulation` 
        : `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Resume Simulation`;
      showToast(isRunning ? "Virtual IoT Simulation Active" : "Virtual IoT Simulation Paused", "info");
    });
  }

  // Weather Preset Buttons
  document.querySelectorAll(".preset-btn[data-weather]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn[data-weather]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      sim.setWeather(btn.dataset.weather);
      showToast(`Weather condition updated to: ${btn.dataset.weather.toUpperCase()}`, "info");
    });
  });

  // Anomaly Injection Buttons
  const injectSoilingBtn = document.getElementById("injectSoilingBtn");
  if (injectSoilingBtn) {
    injectSoilingBtn.addEventListener("click", () => {
      sim.injectAnomaly(sim.selectedBuildingId, "solar_panel_soiling");
      showToast("Injected Anomaly: Severe Solar Panel Soiling (-55% Yield)", "warning");
    });
  }

  const injectLoadSurgeBtn = document.getElementById("injectLoadSurgeBtn");
  if (injectLoadSurgeBtn) {
    injectLoadSurgeBtn.addEventListener("click", () => {
      sim.injectAnomaly(sim.selectedBuildingId, "hvac_compressor_fault");
      showToast("Injected Anomaly: HVAC Compressor Mechanical Surge (+65% Load)", "warning");
    });
  }

  const clearAnomalyBtn = document.getElementById("clearAnomalyBtn");
  if (clearAnomalyBtn) {
    clearAnomalyBtn.addEventListener("click", () => {
      sim.clearAnomaly(sim.selectedBuildingId);
      showToast("All injected faults cleared. Microgrid nominal.", "success");
    });
  }

  // 7. Subscribe to Simulation Engine Updates
  sim.subscribe((data) => {
    const { state, building, timestamp, gridFrequency } = data;

    // Update Header Clock & Frequency
    const liveTimeEl = document.getElementById("liveTimeDisplay");
    if (liveTimeEl) liveTimeEl.textContent = `${timestamp} (Simulated)`;

    const gridFreqEl = document.getElementById("gridFreqDisplay");
    if (gridFreqEl) gridFreqEl.textContent = `${gridFrequency} Hz`;

    // Update KPI Ribbon
    const kpiSolar = document.getElementById("kpiSolarVal");
    if (kpiSolar) kpiSolar.textContent = `${state.solarGenKw}`;

    const kpiConsumption = document.getElementById("kpiConsumptionVal");
    if (kpiConsumption) kpiConsumption.textContent = `${state.consumptionKw}`;

    const kpiBattery = document.getElementById("kpiBatteryVal");
    if (kpiBattery) kpiBattery.textContent = `${state.batterySoc}%`;

    const kpiBatterySub = document.getElementById("kpiBatterySub");
    if (kpiBatterySub) {
      kpiBatterySub.textContent = state.batteryPowerKw < 0 
        ? `Charging (-${Math.abs(state.batteryPowerKw)} kW)` 
        : state.batteryPowerKw > 0 
        ? `Discharging (+${state.batteryPowerKw} kW)` 
        : "Idle / Standby";
    }

    const kpiGrid = document.getElementById("kpiGridVal");
    if (kpiGrid) {
      if (state.gridImportKw > 0) {
        kpiGrid.textContent = `${state.gridImportKw} kW (Import)`;
        kpiGrid.style.color = "var(--grid-purple)";
      } else {
        kpiGrid.textContent = `${state.gridExportKw} kW (Export)`;
        kpiGrid.style.color = "var(--emerald-green)";
      }
    }

    const kpiUtil = document.getElementById("kpiUtilVal");
    if (kpiUtil) kpiUtil.textContent = `${state.renewableUtilPct}%`;

    const kpiSavings = document.getElementById("kpiSavingsVal");
    if (kpiSavings) kpiSavings.textContent = `₹ ${(state.savingsHourly * 12).toFixed(0)}`;

    const kpiCo2 = document.getElementById("kpiCo2Val");
    if (kpiCo2) kpiCo2.textContent = `${(state.co2OffsetKgHourly * 12).toFixed(1)} kg`;

    // Update Flow Visualizer
    flowVisualizer.updateData(state, building);

    // Update Telemetry Stream Terminal Box
    updateTelemetryTerminal();

    // Update Anomaly Count Badge
    const anomalies = anomalyScanner.scanAnomalies(sim.selectedBuildingId, state);
    const alertCount = anomalies.filter(a => a.severity === "critical" || a.severity === "high").length;
    const alertBadge = document.getElementById("navAlertBadge");
    if (alertBadge) {
      alertBadge.textContent = alertCount;
      alertBadge.style.display = alertCount > 0 ? "inline-block" : "none";
    }

    // Refresh active tab views if visible
    if (activeTab === "dashboard") {
      reportsMgr.renderHomeLiveAreaChart("homeLiveAreaCanvas", sim.selectedBuildingId);
      reportsMgr.renderHomeEnergyMixDonut("homeEnergyMixCanvas", state);

      // Render mini sparklines
      reportsMgr.renderKpiSparkline("sparkSolar", sim.history.solarGen.slice(-16), "#f59e0b");
      reportsMgr.renderKpiSparkline("sparkDemand", sim.history.consumption.slice(-16), "#fb7185");
      reportsMgr.renderKpiSparkline("sparkBattery", sim.history.batterySoc.slice(-16), "#06b6d4");
      reportsMgr.renderKpiSparkline("sparkGrid", sim.history.gridImport.slice(-16), "#8b5cf6");
      reportsMgr.renderKpiSparkline("sparkUtil", sim.history.renewableUtil.slice(-16), "#10b981");
      reportsMgr.renderKpiSparkline("sparkFinance", [30, 45, 55, 68, 80, 95, 110, 128], "#34d399");

      // Update Sub-load Progress Bars
      updateSubloadBars(state, building);
    } else if (activeTab === "predictions") {
      const forecast = predictor.generate24HourForecast(sim.selectedBuildingId, sim.weatherCondition);
      predictor.renderForecastChart("forecastChartCanvas", forecast);
      renderPredictiveWindows(forecast);
    } else if (activeTab === "optimization") {
      renderOptimizationCards(state);
    } else if (activeTab === "anomalies") {
      renderAnomaliesList(anomalies);
    } else if (activeTab === "sustainability") {
      renderSustainabilityMetrics(state);
    }

    // Periodic AI Reasoning Card update on dashboard (every 6 seconds)
    const now = Date.now();
    if (now - lastAiReasoningUpdate > 6000) {
      lastAiReasoningUpdate = now;
      gemini.generateLiveReasoning(sim.selectedBuildingId, state).then(text => {
        const aiBox = document.getElementById("dashboardAiInsight");
        if (aiBox) aiBox.innerHTML = markedParse(text);
      });
    }
  });

  // 8. Render Helper Functions
  function updateSubloadBars(state, building) {
    const totalLoad = Math.max(1, state.consumptionKw);

    const hvacKw = building.flexibleLoads.hvacChillers.active ? (building.flexibleLoads.hvacChillers.ecoMode ? building.flexibleLoads.hvacChillers.powerKw * 0.7 : building.flexibleLoads.hvacChillers.powerKw) : 0;
    const pumpsKw = building.flexibleLoads.waterPumps.active ? building.flexibleLoads.waterPumps.powerKw : 0;
    const evKw = building.flexibleLoads.evFleet.active ? building.flexibleLoads.evFleet.powerKw : 0;
    const labsKw = Math.max(10, Math.round(building.baseLoadKw * 0.45));

    const hvacPct = Math.min(100, Math.round((hvacKw / totalLoad) * 100));
    const pumpsPct = Math.min(100, Math.round((pumpsKw / totalLoad) * 100));
    const evPct = Math.min(100, Math.round((evKw / totalLoad) * 100));
    const labsPct = Math.min(100, Math.round((labsKw / totalLoad) * 100));

    const barHvacVal = document.getElementById("barHvacVal");
    const barHvacFill = document.getElementById("barHvacFill");
    if (barHvacVal) barHvacVal.textContent = `${hvacKw.toFixed(0)} kW (${hvacPct}%)`;
    if (barHvacFill) barHvacFill.style.width = `${hvacPct}%`;

    const barPumpsVal = document.getElementById("barPumpsVal");
    const barPumpsFill = document.getElementById("barPumpsFill");
    if (barPumpsVal) barPumpsVal.textContent = `${pumpsKw.toFixed(0)} kW (${pumpsPct}%)`;
    if (barPumpsFill) barPumpsFill.style.width = `${pumpsPct}%`;

    const barEvVal = document.getElementById("barEvVal");
    const barEvFill = document.getElementById("barEvFill");
    if (barEvVal) barEvVal.textContent = `${evKw.toFixed(0)} kW (${evPct}%)`;
    if (barEvFill) barEvFill.style.width = `${evPct}%`;

    const barLabsVal = document.getElementById("barLabsVal");
    const barLabsFill = document.getElementById("barLabsFill");
    if (barLabsVal) barLabsVal.textContent = `${labsKw} kW (${labsPct}%)`;
    if (barLabsFill) barLabsFill.style.width = `${labsPct}%`;
  }

  function updateTelemetryTerminal() {
    const termBody = document.getElementById("telemetryTerminalBody");
    if (!termBody) return;
    termBody.innerHTML = sim.packetStream.slice(0, 18).map(p => `
      <div class="packet-row">
        <span class="packet-time">[${p.timestamp.split('T')[1].substring(0, 8)}]</span>
        <span class="packet-dev">${p.deviceId}</span>
        <span class="packet-type">${p.sensorType}:</span>
        <span class="packet-val">${p.value} ${p.unit}</span>
      </div>
    `).join("");
  }

  function renderPredictiveWindows(forecast) {
    const container = document.getElementById("predictiveWindowsContainer");
    if (!container) return;
    const windows = predictor.getPredictiveWindows(forecast);
    container.innerHTML = windows.map(w => `
      <div class="time-window-item ${w.type}">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.92rem;">${w.title}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${w.description}</div>
        </div>
        <div style="text-align: right; white-space: nowrap;">
          <div style="font-weight: 800; color: var(--solar-amber); font-family: 'JetBrains Mono', monospace;">${w.timeRange}</div>
          <div style="font-size: 0.72rem; color: #34d399; font-weight: 700;">${w.peakVal}</div>
        </div>
      </div>
    `).join("");
  }

  function renderOptimizationCards(state) {
    const container = document.getElementById("optimizationsGridContainer");
    if (!container) return;
    const recs = optimizer.getRecommendations(sim.selectedBuildingId, state);

    container.innerHTML = recs.map(r => `
      <div class="opt-card">
        <div class="opt-card-header">
          <div>
            <span class="opt-category-tag">${r.category}</span>
            <h3 style="font-size: 1.05rem; margin-top: 6px;">${r.title}</h3>
          </div>
        </div>
        <div class="opt-section-box">
          <span class="opt-label">Identified Inefficiency</span>
          <p class="opt-problem">${r.problem}</p>
        </div>
        <div class="opt-section-box">
          <span class="opt-label">Recommended Action</span>
          <p class="opt-action">${r.action}</p>
        </div>
        <div class="opt-benefit-metrics">
          <div class="opt-benefit-metric">
            <div class="val">${r.benefit.energySaved}</div>
            <div class="lbl">Energy Impact</div>
          </div>
          <div class="opt-benefit-metric">
            <div class="val">${r.benefit.costSaved}</div>
            <div class="lbl">Financial Saving</div>
          </div>
          <div class="opt-benefit-metric">
            <div class="val">${r.benefit.renewableBoost}</div>
            <div class="lbl">Renewable Gain</div>
          </div>
        </div>
        <div style="margin-top: auto; padding-top: 10px;">
          <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.applyOpt('${r.id}')" ${r.applied ? 'disabled style="opacity: 0.6; cursor: default;"' : ''}>
            ${r.applied ? '✓ Applied to Microgrid' : '⚡ Apply Optimization'}
          </button>
        </div>
      </div>
    `).join("");
  }

  window.applyOpt = (optId) => {
    const state = sim.calculateInstantPhysics(sim.selectedBuildingId, sim.timeOfDay, sim.weatherCondition);
    const recs = optimizer.getRecommendations(sim.selectedBuildingId, state);
    const rec = recs.find(r => r.id === optId);
    if (rec && rec.applyHandler) {
      rec.applyHandler();
      showToast(`Optimization Applied: ${rec.title}`, "success");
      renderOptimizationCards(state);
    }
  };

  function renderAnomaliesList(anomalies) {
    const container = document.getElementById("anomaliesListContainer");
    if (!container) return;
    container.innerHTML = anomalies.map(a => `
      <div class="anomaly-card ${a.severity}">
        <div>
          <span class="status-badge ${a.severity === 'critical' ? 'offline' : a.severity === 'high' ? 'warning' : 'online'}">${a.severity.toUpperCase()}</span>
        </div>
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${a.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${a.description}</div>
          <div style="font-size: 0.74rem; color: #fca5a5; margin-top: 4px;">
            <strong>Possible Causes:</strong> ${a.possibleCauses.join(", ")}
          </div>
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">
          <div>Observed: <strong style="color: #fff;">${a.detectedValue}</strong></div>
          <div style="color: var(--text-dim);">Expected: ${a.baselineValue} (${a.deviation})</div>
        </div>
        <div style="text-align: right;">
          <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.78rem;" onclick="window.showToast('Diagnostic telemetry logged to AICTE Audit Ledger', 'info')">Investigate</button>
        </div>
      </div>
    `).join("");
  }

  function renderSustainabilityMetrics(state) {
    const totalDailySolarMwh = ((sim.buildings[sim.selectedBuildingId].solarCapacityKw * 5.4) / 1000).toFixed(2);
    const co2DailyKg = (state.co2OffsetKgHourly * 14).toFixed(1);
    const trees = (co2DailyKg / 21).toFixed(0);
    const coalAvoidedKg = (co2DailyKg * 0.42).toFixed(1);

    const mwhEl = document.getElementById("ecoCleanMwh");
    if (mwhEl) mwhEl.textContent = `${totalDailySolarMwh} MWh`;

    const co2El = document.getElementById("ecoCo2Kg");
    if (co2El) co2El.textContent = `${co2DailyKg} kg`;

    const treeEl = document.getElementById("ecoTrees");
    if (treeEl) treeEl.textContent = `${trees} Trees`;

    const coalEl = document.getElementById("ecoCoal");
    if (coalEl) coalEl.textContent = `${coalAvoidedKg} kg`;
  }

  function updateBuildingCards() {
    document.querySelectorAll(".building-card").forEach(card => {
      if (card.dataset.building === sim.selectedBuildingId) card.classList.add("active-building");
      else card.classList.remove("active-building");
    });
  }

  document.querySelectorAll(".building-card").forEach(card => {
    card.addEventListener("click", () => {
      const bldgId = card.dataset.building;
      if (bldgId) {
        sim.selectBuilding(bldgId);
        if (buildingSelect) buildingSelect.value = bldgId;
        showToast(`Selected Building: ${sim.buildings[bldgId].name}`, "success");
        updateBuildingCards();
      }
    });
  });

  // 9. Interactive AI Copilot Modal & Chat
  const copilotModal = document.getElementById("aiCopilotModal");
  const openCopilotBtn = document.getElementById("openAiCopilotBtn");
  const closeCopilotBtn = document.getElementById("closeAiCopilotBtn");
  const chatInput = document.getElementById("copilotChatInput");
  const sendChatBtn = document.getElementById("sendCopilotChatBtn");
  const chatMessages = document.getElementById("copilotChatMessages");

  if (openCopilotBtn && copilotModal) {
    openCopilotBtn.addEventListener("click", () => {
      copilotModal.classList.add("active");
      renderChatMessages();
    });
  }

  if (closeCopilotBtn && copilotModal) {
    closeCopilotBtn.addEventListener("click", () => {
      copilotModal.classList.remove("active");
    });
  }

  function renderChatMessages() {
    if (!chatMessages) return;
    chatMessages.innerHTML = gemini.chatHistory.map(m => `
      <div style="margin-bottom: 12px; display: flex; flex-direction: column; align-items: ${m.role === 'user' ? 'flex-end' : 'flex-start'};">
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-dim); margin-bottom: 3px;">${m.role === 'user' ? 'YOU' : 'ECOGRID AI (GEMINI FLASH)'}</div>
        <div style="background: ${m.role === 'user' ? 'linear-gradient(135deg, var(--emerald-green), #059669)' : 'var(--bg-tertiary)'}; color: #fff; padding: 12px 16px; border-radius: var(--radius-md); max-width: 85%; font-size: 0.88rem; line-height: 1.5; border: 1px solid var(--border-glass);">
          ${markedParse(m.text)}
        </div>
      </div>
    `).join("");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    renderChatMessages();

    // Show typing state
    const typingIndicator = document.createElement("div");
    typingIndicator.id = "aiTypingIndicator";
    typingIndicator.style.cssText = "font-size: 0.78rem; color: var(--emerald-green); font-style: italic; margin-bottom: 8px;";
    typingIndicator.textContent = "⚡ Gemini Flash is analyzing microgrid telemetry...";
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const reply = await gemini.sendChatMessage(text);
    if (typingIndicator) typingIndicator.remove();
    renderChatMessages();
  }

  if (sendChatBtn) sendChatBtn.addEventListener("click", handleSendChat);
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendChat();
      }
    });
  }

  // Quick Prompt Chips in Chat Modal
  document.querySelectorAll(".quick-prompt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (chatInput) {
        chatInput.value = btn.textContent;
        handleSendChat();
      }
    });
  });

  // Settings & Gemini API Key modal
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const apiKeyInput = document.getElementById("geminiApiKeyInput");
  if (apiKeyInput) {
    apiKeyInput.value = gemini.apiKey;
  }
  if (saveApiKeyBtn && apiKeyInput) {
    saveApiKeyBtn.addEventListener("click", () => {
      gemini.setApiKey(apiKeyInput.value);
      showToast("Gemini Flash API configuration saved successfully", "success");
    });
  }

  // Export Buttons
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      reportsMgr.exportTelemetryCSV();
      showToast("Telemetry Audit CSV successfully generated", "success");
    });
  }

  const printReportBtn = document.getElementById("printReportBtn");
  if (printReportBtn) {
    printReportBtn.addEventListener("click", () => {
      reportsMgr.triggerPrintReport();
    });
  }

  // Theme Toggle
  const themeToggle = document.getElementById("themeToggleBtn");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      themeToggle.innerHTML = isLight ? "🌙" : "☀️";
      showToast(`Switched to ${isLight ? 'Light' : 'Dark'} Theme`, "info");
    });
  }

  // 10. SIH 2026 Judge Guided Demonstration Workflow (PRD Section 27)
  const tourSteps = [
    {
      title: "Step 1: Select Building Microgrid",
      desc: "Select Academic Block A to inspect real-time solar capacity (150 kW) & lithium BESS storage.",
      action: () => { switchTab("dashboard"); sim.selectBuilding("bldg-academic-a"); }
    },
    {
      title: "Step 2: Launch Virtual IoT Lab",
      desc: "Control solar irradiance, sun angle (1:00 PM peak), ambient temp, and observe structured sensor streams.",
      action: () => { switchTab("simulator"); sim.setTimeOfDay(13.0); sim.setWeather("sunny"); }
    },
    {
      title: "Step 3: Real-Time Flow Dynamics",
      desc: "Observe dynamic canvas particle streams: Solar generating 130 kW, charging battery, and exporting green surplus.",
      action: () => { switchTab("dashboard"); }
    },
    {
      title: "Step 4: AI Prediction Engine",
      desc: "Predict 24h solar curve, peak evening demand window (6 PM - 9:30 PM), and high renewable windows.",
      action: () => { switchTab("predictions"); }
    },
    {
      title: "Step 5: Actionable Optimizations",
      desc: "Review Problem ➔ Action ➔ Benefit recommendations. One-click shift of Central Water Pumps to solar peak.",
      action: () => { switchTab("optimization"); window.applyOpt("opt-pump-shift"); }
    },
    {
      title: "Step 6: Anomaly Diagnostics",
      desc: "AI scans baseline deviations, solar drops, and equipment faults with structured root-cause hypotheses.",
      action: () => { switchTab("anomalies"); }
    },
    {
      title: "Step 7: Sustainability & ESG",
      desc: "Inspect real-time clean MWh, kg CO₂ offset, equivalent trees, and export audit-ready CSV reports.",
      action: () => { switchTab("sustainability"); }
    }
  ];

  const startTourBtn = document.getElementById("startSihTourBtn");
  const tourBanner = document.getElementById("sihTourBanner");
  const nextTourStepBtn = document.getElementById("nextTourStepBtn");
  const tourStepDesc = document.getElementById("tourStepDesc");
  const tourStepTitle = document.getElementById("tourStepTitle");

  if (startTourBtn) {
    startTourBtn.addEventListener("click", () => {
      tourCurrentStep = 0;
      if (tourBanner) tourBanner.style.display = "flex";
      executeTourStep(tourCurrentStep);
    });
  }

  if (nextTourStepBtn) {
    nextTourStepBtn.addEventListener("click", () => {
      tourCurrentStep = (tourCurrentStep + 1) % tourSteps.length;
      executeTourStep(tourCurrentStep);
    });
  }

  function executeTourStep(index) {
    const step = tourSteps[index];
    if (!step) return;
    step.action();
    if (tourStepTitle) tourStepTitle.textContent = step.title;
    if (tourStepDesc) tourStepDesc.textContent = step.desc;

    document.querySelectorAll(".tour-step-pill").forEach((pill, i) => {
      pill.classList.remove("current", "completed");
      if (i < index) pill.classList.add("completed");
      else if (i === index) pill.classList.add("current");
    });

    showToast(`SIH Demonstration: ${step.title}`, "info");
  }

  // Helper Markdown Parser (simplified light formatter for bullet points, bold, headings)
  function markedParse(text) {
    if (!text) return "";
    return text
      .replace(/^### (.*$)/gim, '<h4 style="color: #fff; font-weight: 700; margin: 8px 0 4px;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="color: #fff; font-weight: 700; margin: 10px 0 6px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/^\- (.*$)/gim, '<div style="display: flex; gap: 6px; margin: 3px 0;"><span>•</span><span>$1</span></div>')
      .replace(/\n/gim, '<br>');
  }

  // Web Audio API Synthesizer for rich interactive feedback
  let audioEnabled = true;
  const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;

  function playSound(type = "click") {
    if (!audioEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "click") {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "opt") {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      } else if (type === "warning") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.setValueAtTime(260, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // Node Telemetry Modal Handler
  const nodeModal = document.getElementById("nodeTelemetryModal");
  const closeNodeModalBtn = document.getElementById("closeNodeTelemetryBtn");

  window.openNodeTelemetryModal = (nodeKey, nodeData, liveContext) => {
    if (!nodeModal) return;
    playSound("click");
    const state = liveContext ? liveContext.state : sim.calculateInstantPhysics(sim.selectedBuildingId, sim.timeOfDay, sim.weatherCondition);
    const bldg = sim.buildings[sim.selectedBuildingId];

    const titleEl = document.getElementById("nodeModalTitle");
    const descEl = document.getElementById("nodeModalDesc");
    const bodyEl = document.getElementById("nodeModalGrid");

    let gridHtml = "";

    if (nodeKey === "solar") {
      if (titleEl) titleEl.textContent = `☀️ ${nodeData.label} — Inverter Telemetry`;
      if (descEl) descEl.textContent = `Monitors rooftop string arrays, DC-AC efficiency, MPPT tracking, and irradiance for ${bldg.name}.`;
      gridHtml = `
        <div class="building-meta-item"><span class="lbl">Active Solar Output</span><span class="val" style="color: var(--solar-amber);">${state.solarGenKw} kW</span></div>
        <div class="building-meta-item"><span class="lbl">Rated PV Capacity</span><span class="val">${bldg.solarCapacityKw} kW</span></div>
        <div class="building-meta-item"><span class="lbl">Inverter MPPT Efficiency</span><span class="val" style="color: #34d399;">98.4%</span></div>
        <div class="building-meta-item"><span class="lbl">Solar Irradiance</span><span class="val">${state.irradianceWm2} W/m²</span></div>
        <div class="building-meta-item"><span class="lbl">DC Bus Voltage</span><span class="val">684.2 V</span></div>
        <div class="building-meta-item"><span class="lbl">Panel Surface Temp</span><span class="val">${(state.ambientTemp + 14).toFixed(1)} °C</span></div>
      `;
    } else if (nodeKey === "battery") {
      if (titleEl) titleEl.textContent = `🔋 ${nodeData.label} — BMS Storage Subsystem`;
      if (descEl) descEl.textContent = `Lithium Iron Phosphate (LiFePO4) Battery Energy Storage System for peak shaving & emergency backup.`;
      gridHtml = `
        <div class="building-meta-item"><span class="lbl">State of Charge (SoC)</span><span class="val" style="color: var(--battery-cyan);">${state.batterySoc}%</span></div>
        <div class="building-meta-item"><span class="lbl">Nominal Capacity</span><span class="val">${bldg.batteryCapacityKwh} kWh</span></div>
        <div class="building-meta-item"><span class="lbl">Active Power Flow</span><span class="val">${state.batteryPowerKw < 0 ? `Charging (${Math.abs(state.batteryPowerKw)} kW)` : state.batteryPowerKw > 0 ? `Discharging (${state.batteryPowerKw} kW)` : 'Idle'}</span></div>
        <div class="building-meta-item"><span class="lbl">Battery Health (SOH)</span><span class="val" style="color: #34d399;">${bldg.batteryHealth}%</span></div>
        <div class="building-meta-item"><span class="lbl">Cell Pack Temperature</span><span class="val">27.8 °C</span></div>
        <div class="building-meta-item"><span class="lbl">Completed Cycles</span><span class="val">342 / 5000</span></div>
      `;
    } else if (nodeKey === "ems") {
      if (titleEl) titleEl.textContent = `⚡ Smart Hybrid EMS & Microgrid Hub`;
      if (descEl) descEl.textContent = `Bidirectional energy routing, frequency stabilization, and power quality balancing center.`;
      gridHtml = `
        <div class="building-meta-item"><span class="lbl">Active Microgrid Load</span><span class="val">${state.consumptionKw} kW</span></div>
        <div class="building-meta-item"><span class="lbl">Renewable Share</span><span class="val" style="color: #34d399;">${state.renewableUtilPct}%</span></div>
        <div class="building-meta-item"><span class="lbl">Grid Frequency</span><span class="val">${sim.gridFrequency} Hz</span></div>
        <div class="building-meta-item"><span class="lbl">Total Harmonic Distortion</span><span class="val" style="color: #34d399;">1.8% (IEEE 519 Pass)</span></div>
        <div class="building-meta-item"><span class="lbl">Phase Voltage L1-N</span><span class="val">230.4 V</span></div>
        <div class="building-meta-item"><span class="lbl">Power Factor</span><span class="val">0.98 Inductive</span></div>
      `;
    } else if (nodeKey === "building") {
      if (titleEl) titleEl.textContent = `🏢 ${bldg.name} — Sub-metered Load Demand`;
      if (descEl) descEl.textContent = `Granular telemetry across HVAC chillers, water pumps, laboratories, lighting, and EV chargers.`;
      gridHtml = `
        <div class="building-meta-item"><span class="lbl">Current Demand</span><span class="val" style="color: #fb7185;">${state.consumptionKw} kW</span></div>
        <div class="building-meta-item"><span class="lbl">Occupancy Factor</span><span class="val">${bldg.occupancy}%</span></div>
        <div class="building-meta-item"><span class="lbl">Hydro Pump Load</span><span class="val">${bldg.flexibleLoads.waterPumps.active ? `${bldg.flexibleLoads.waterPumps.powerKw} kW (Active)` : '0 kW (Idle)'}</span></div>
        <div class="building-meta-item"><span class="lbl">HVAC Chiller Load</span><span class="val">${bldg.flexibleLoads.hvacChillers.active ? `${bldg.flexibleLoads.hvacChillers.ecoMode ? bldg.flexibleLoads.hvacChillers.powerKw * 0.7 : bldg.flexibleLoads.hvacChillers.powerKw} kW` : '0 kW'}</span></div>
        <div class="building-meta-item"><span class="lbl">EV Charger Station</span><span class="val">${bldg.flexibleLoads.evFleet.active ? `${bldg.flexibleLoads.evFleet.powerKw} kW (Charging)` : '0 kW (Idle)'}</span></div>
        <div class="building-meta-item"><span class="lbl">Continuous Base Load</span><span class="val">${bldg.baseLoadKw} kW</span></div>
      `;
    } else if (nodeKey === "grid") {
      if (titleEl) titleEl.textContent = `🌐 Utility Grid Interconnection Point`;
      if (descEl) descEl.textContent = `Bi-directional net metering point with state power distribution utility.`;
      gridHtml = `
        <div class="building-meta-item"><span class="lbl">Exchange Status</span><span class="val" style="color: ${state.gridImportKw > 0 ? 'var(--grid-purple)' : 'var(--emerald-green)'};">${state.gridImportKw > 0 ? `Importing ${state.gridImportKw} kW` : `Exporting ${state.gridExportKw} kW`}</span></div>
        <div class="building-meta-item"><span class="lbl">Import Peak Tariff</span><span class="val">₹ ${sim.organization.tariffImport} / kWh</span></div>
        <div class="building-meta-item"><span class="lbl">Net Metering Export Credit</span><span class="val">₹ ${sim.organization.tariffExport} / kWh</span></div>
        <div class="building-meta-item"><span class="lbl">Hourly Cost / Credit</span><span class="val">${state.costHourly > 0 ? `Cost: ₹ ${state.costHourly}` : `Credit: ₹ ${Math.abs(state.costHourly)}`}</span></div>
        <div class="building-meta-item"><span class="lbl">Grid Emission Factor</span><span class="val">0.82 kg CO₂/kWh</span></div>
        <div class="building-meta-item"><span class="lbl">Interconnection Sync</span><span class="val" style="color: #34d399;">LOCKED (50 Hz)</span></div>
      `;
    }

    if (bodyEl) bodyEl.innerHTML = gridHtml;
    nodeModal.classList.add("active");
  };

  if (closeNodeModalBtn && nodeModal) {
    closeNodeModalBtn.addEventListener("click", () => {
      nodeModal.classList.remove("active");
    });
  }

  // Appliance Load Toggle Switches in Simulator
  document.querySelectorAll(".appliance-switch").forEach(sw => {
    sw.addEventListener("change", (e) => {
      const loadKey = e.target.dataset.load;
      const isChecked = e.target.checked;
      sim.toggleFlexibleLoad(sim.selectedBuildingId, loadKey, isChecked);
      playSound("click");
      showToast(`${e.target.dataset.name}: ${isChecked ? 'Activated' : 'Deactivated'}`, "info");
    });
  });

  // 11. Solar ROI & Expansion Feasibility Calculator
  const roiSolarSlider = document.getElementById("roiSolarSlider");
  const roiBatterySlider = document.getElementById("roiBatterySlider");
  const roiCostSlider = document.getElementById("roiCostSlider");
  const roiSubsidyCheck = document.getElementById("roiSubsidyCheck");
  const recalcRoiBtn = document.getElementById("recalcRoiBtn");

  function calculateRoi() {
    if (!roiSolarSlider || !roiCostSlider) return;
    const solarKw = parseFloat(roiSolarSlider.value);
    const batteryKwh = roiBatterySlider ? parseFloat(roiBatterySlider.value) : 0;
    const costPerKw = parseFloat(roiCostSlider.value);
    const hasSubsidy = roiSubsidyCheck ? roiSubsidyCheck.checked : true;

    // Display labels
    const solarEl = document.getElementById("roiSolarVal");
    if (solarEl) solarEl.textContent = `${solarKw} kW`;
    const batteryEl = document.getElementById("roiBatteryVal");
    if (batteryEl) batteryEl.textContent = `${batteryKwh} kWh`;
    const costEl = document.getElementById("roiCostVal");
    if (costEl) costEl.textContent = `₹ ${costPerKw.toLocaleString('en-IN')}`;

    // CapEx Calculation
    const grossCapex = (solarKw * costPerKw) + (batteryKwh * 18000); // 18k/kWh for BESS
    const netCapex = hasSubsidy ? grossCapex * 0.8 : grossCapex; // 20% subsidy

    // Generation & Savings (Average 4.8 kWh/kWp/day in India)
    const annualGenerationKwh = solarKw * 4.8 * 365;
    const annualSavingInr = (annualGenerationKwh * 0.85 * sim.organization.tariffImport) + (annualGenerationKwh * 0.15 * sim.organization.tariffExport);
    const paybackYears = Number((netCapex / annualSavingInr).toFixed(1));
    const tenYearSavingsLakhs = Number(((annualSavingInr * 10 - netCapex) / 100000).toFixed(1));
    const lcoe = Number((netCapex / (annualGenerationKwh * 20)).toFixed(2)); // 20-year lifetime

    const paybackEl = document.getElementById("roiPaybackVal");
    if (paybackEl) paybackEl.textContent = `${paybackYears} Years`;
    const tenYearEl = document.getElementById("roi10YearVal");
    if (tenYearEl) tenYearEl.textContent = `₹ ${tenYearSavingsLakhs} Lakhs`;
    const capexEl = document.getElementById("roiCapexVal");
    if (capexEl) capexEl.textContent = `₹ ${(netCapex / 100000).toFixed(1)} Lakhs`;
    const lcoeEl = document.getElementById("roiLcoeVal");
    if (lcoeEl) lcoeEl.innerHTML = `₹ ${lcoe} <span style="font-size: 0.9rem; color: var(--text-dim);">vs ₹ ${sim.organization.tariffImport}</span>`;
  }

  [roiSolarSlider, roiBatterySlider, roiCostSlider, roiSubsidyCheck].forEach(el => {
    if (el) el.addEventListener("input", calculateRoi);
  });
  if (recalcRoiBtn) recalcRoiBtn.addEventListener("click", () => {
    calculateRoi();
    playSound("opt");
    showToast("Financial ROI model updated successfully", "success");
  });
  calculateRoi();

  // 12. Voice Assistant Command Recognition (Web Speech API)
  const voiceMicBtn = document.getElementById("voiceMicBtn");
  const voiceStatusPill = document.getElementById("voiceStatusPill");
  const voiceStatusText = document.getElementById("voiceStatusText");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && voiceMicBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isListening = false;

    voiceMicBtn.addEventListener("click", () => {
      if (!isListening) {
        try {
          recognition.start();
          isListening = true;
          voiceMicBtn.classList.add("listening");
          if (voiceStatusPill) voiceStatusPill.style.display = "flex";
          if (voiceStatusText) voiceStatusText.textContent = "Listening to voice command...";
          playSound("click");
        } catch (e) {
          showToast("Speech recognition initialized", "info");
        }
      } else {
        recognition.stop();
        isListening = false;
        voiceMicBtn.classList.remove("listening");
        if (voiceStatusPill) voiceStatusPill.style.display = "none";
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (voiceStatusText) voiceStatusText.textContent = `Recognized: "${transcript}"`;
      handleVoiceCommand(transcript);
    };

    recognition.onend = () => {
      isListening = false;
      voiceMicBtn.classList.remove("listening");
      setTimeout(() => {
        if (voiceStatusPill) voiceStatusPill.style.display = "none";
      }, 3000);
    };
  }

  function handleVoiceCommand(cmd) {
    if (cmd.includes("battery") || cmd.includes("soc")) {
      showToast(`Voice Command: Checking Battery (${sim.buildings[sim.selectedBuildingId].batterySoc}% SoC)`, "success");
      switchTab("dashboard");
      playSound("opt");
    } else if (cmd.includes("optimize") || cmd.includes("pump") || cmd.includes("water")) {
      window.applyOpt("opt-pump-shift");
      switchTab("optimization");
      showToast("Voice Command: Water Pump Optimization Applied", "success");
      playSound("opt");
    } else if (cmd.includes("forecast") || cmd.includes("predict")) {
      switchTab("predictions");
      showToast("Voice Command: Displaying 24h AI Prediction Curve", "info");
      playSound("click");
    } else if (cmd.includes("tour") || cmd.includes("judge") || cmd.includes("demo")) {
      if (startTourBtn) startTourBtn.click();
      playSound("opt");
    } else if (cmd.includes("campus") || cmd.includes("building")) {
      switchTab("campus");
      playSound("click");
    } else {
      showToast(`Command processed: "${cmd}"`, "info");
    }
  }

  // 13. SIH Presentation Pitch Overlay Controller
  const openPitchBtn = document.getElementById("openPitchBtn");
  const closePitchBtn = document.getElementById("closePitchBtn");
  const pitchOverlay = document.getElementById("pitchOverlay");
  const nextPitchSlideBtn = document.getElementById("nextPitchSlideBtn");
  const prevPitchSlideBtn = document.getElementById("prevPitchSlideBtn");
  const pitchSlideCounter = document.getElementById("pitchSlideCounter");
  const pitchSlides = document.querySelectorAll(".pitch-slide");
  let currentPitchSlide = 1;

  function showPitchSlide(num) {
    pitchSlides.forEach(s => {
      if (parseInt(s.dataset.slide) === num) s.classList.add("active");
      else s.classList.remove("active");
    });
    if (pitchSlideCounter) pitchSlideCounter.textContent = `Slide ${num} of ${pitchSlides.length}`;
  }

  if (openPitchBtn && pitchOverlay) {
    openPitchBtn.addEventListener("click", () => {
      currentPitchSlide = 1;
      showPitchSlide(currentPitchSlide);
      pitchOverlay.classList.add("active");
      playSound("click");
    });
  }

  document.querySelectorAll("#closePitchBtn, .close-pitch-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (pitchOverlay) pitchOverlay.classList.remove("active");
    });
  });

  if (nextPitchSlideBtn) {
    nextPitchSlideBtn.addEventListener("click", () => {
      currentPitchSlide = (currentPitchSlide % pitchSlides.length) + 1;
      showPitchSlide(currentPitchSlide);
      playSound("click");
    });
  }

  if (prevPitchSlideBtn) {
    prevPitchSlideBtn.addEventListener("click", () => {
      currentPitchSlide = currentPitchSlide > 1 ? currentPitchSlide - 1 : pitchSlides.length;
      showPitchSlide(currentPitchSlide);
      playSound("click");
    });
  }

  // Initial tab setup: public visitors stay on the landing page until they authenticate.
  if (currentUser) {
    loginUser(currentUser, true);
  } else {
    showPublicLanding();
  }
  updateRolePermissions();

  window.addEventListener("pageshow", () => {
    if (!currentUser) showPublicLanding();
  });

  window.addEventListener("popstate", () => {
    if (!currentUser) {
      history.replaceState({ publicLanding: true }, "", window.location.href);
      showPublicLanding();
    }
  });
});
