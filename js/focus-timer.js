/* Focus Garden timer uses an end timestamp so delayed browser tabs do not drift. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const byId = (id) => document.getElementById(id);
  const DEFAULT_DURATIONS = {
    pomodoro: 25,
    short: 5,
    long: 15,
  };
  let durations = { ...DEFAULT_DURATIONS };
  let mode = "pomodoro";
  let remainingMs = durations[mode] * 60000;
  let initialDurationMs = remainingMs;
  let endTimestamp = null;
  let intervalId = null;
  let running = false;
  let lastCompleteMessage = "";
  const labels = {
    pomodoro: "Focus Time",
    short: "Short Break",
    long: "Long Break",
  };
  let soundEnabled = true;

  const completionAudio = new Audio("assets/sounds/focus-complete.mp3");
  completionAudio.preload = "auto";
  completionAudio.volume = 0.32;

  function playFocusCompletionSound() {
    if (!soundEnabled) return;
    completionAudio.pause();
    completionAudio.currentTime = 0;
    completionAudio.play().catch((error) => {
      console.warn("Focus completion sound could not play:", error);
    });
  }

  function showFocusCompletion() {
    const minutes = byId("focusCompletionMinutes");
    if (minutes)
      minutes.textContent = `${durations.pomodoro} minutes well spent.`;

    playFocusCompletionSound();

    const completionPlant = byId("focusCompletionPlant");
    const dashboardPlant = byId("focusPlant");
    if (completionPlant && dashboardPlant) {
      completionPlant.src = dashboardPlant.getAttribute("src");
    }

    if (byId("focusCompleteDialog")) {
      DR.openDialog("focusCompleteDialog");
    } else {
      DR.toast("Great work! Your focus session is complete.");
    }

    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      DR.readStorage(DR.keys.notificationsEnabled, false) === true
    ) {
      new Notification("CampusBloom — Focus completed", {
        body: `Great work! ${durations.pomodoro} minutes well spent. Your plant has grown.`,
        icon: "assets/logo.svg",
      });
    }
  }

  // Plant care uses local calendar days, not elapsed 24-hour periods.
  // This keeps the rules predictable even when the browser is closed.
  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function daysBetween(fromISO, toISO) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fromISO || "") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(toISO || "")
    )
      return 0;
    const [fy, fm, fd] = fromISO.split("-").map(Number);
    const [ty, tm, td] = toISO.split("-").map(Number);
    const from = Date.UTC(fy, fm - 1, fd);
    const to = Date.UTC(ty, tm - 1, td);
    return Math.max(0, Math.floor((to - from) / 86400000));
  }
  function getPlantHealth() {
    const saved = DR.readStorage(DR.keys.plantHealth, null);
    const validDate =
      typeof saved?.lastCareDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(saved.lastCareDate);
    if (
      saved &&
      typeof saved === "object" &&
      typeof saved.rotten === "boolean" &&
      validDate
    )
      return saved;

    // Migrate older accounts: use their latest finished Pomodoro date.
    const pastSessions = DR.state.focusSessions
      .filter((session) => session.type === "pomodoro" && session.completedAt)
      .map((session) => new Date(session.completedAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b - a);

    let lastCareDate = pastSessions.length
      ? localDateKey(pastSessions[0])
      : null;

    // If an older account has growth but no session history, grant a
    // one-time grace date rather than destroying its existing plant.
    if (!lastCareDate && Number(DR.state.plantProgress) > 0)
      lastCareDate = localDateKey();

    // A brand-new account starts with a healthy seedling today.
    if (!lastCareDate) lastCareDate = localDateKey();

    const health = { lastCareDate, rotten: false };
    DR.saveStorage(DR.keys.plantHealth, health);
    return health;
  }
  function savePlantHealth(health) {
    DR.saveStorage(DR.keys.plantHealth, health);
  }
  function checkPlantHealth() {
    const health = getPlantHealth();
    const inactiveDays = daysBetween(health.lastCareDate, localDateKey());

    // Seven inactive calendar days reset plant growth once. Focus history stays.
    if (inactiveDays >= 7 && !health.rotten) {
      DR.state.plantProgress = 0;
      health.rotten = true;
      DR.saveStorage(DR.keys.plantProgress, 0);
      savePlantHealth(health);
    }

    return { ...health, inactiveDays };
  }
  function careForPlant() {
    const health = checkPlantHealth();

    // The first Pomodoro after the plant dies starts a new seedling.
    if (health.rotten) DR.state.plantProgress = 0;

    DR.state.plantProgress += 1;
    savePlantHealth({ lastCareDate: localDateKey(), rotten: false });
  }
  function clearTick() {
    if (intervalId !== null) window.clearInterval(intervalId);
    intervalId = null;
  }
  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }
  function renderTimer() {
    byId("timerDisplay").textContent = formatTime(remainingMs);
    byId("timerModeLabel").textContent = labels[mode];
    const elapsed = Math.min(
      initialDurationMs,
      Math.max(0, initialDurationMs - remainingMs),
    );
    const progress = initialDurationMs ? elapsed / initialDurationMs : 0;
    const degrees = Math.round(progress * 360);
    byId("timerRing").style.background =
      `conic-gradient(var(--lime) 0deg, var(--green) ${degrees}deg, var(--border) ${degrees}deg 360deg)`;
    byId("timerRing").setAttribute(
      "aria-label",
      `${labels[mode]}, ${formatTime(remainingMs)} remaining`,
    );
    byId("timerStartPause").textContent = running ? "Ⅱ" : "▶";
    byId("timerStartPause").style.paddingLeft = running ? "0" : "3px";
    byId("timerStartPause").setAttribute(
      "aria-label",
      running
        ? "Pause timer"
        : remainingMs < initialDurationMs
          ? "Resume timer"
          : "Start timer",
    );
    document.querySelectorAll("[data-session]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.session === mode);
      const small = button.querySelector("small");
      if (small) small.textContent = `${durations[button.dataset.session]} min`;
    });
    byId("timerStatus").textContent = running
      ? "You’re in the zone"
      : lastCompleteMessage ||
        (remainingMs < initialDurationMs
          ? "Paused · take your time"
          : "Ready when you are");
  }
  function loadDurationsForCurrentUser() {
    durations = { ...DEFAULT_DURATIONS };
    soundEnabled = DR.readStorage(DR.keys.focusSoundEnabled, true) !== false;
    const soundToggle = byId("focusSoundToggle");
    if (soundToggle)
      soundToggle.setAttribute("aria-checked", String(soundEnabled));
    const savedDurations = DR.readStorage(DR.keys.timerDurations, null);
    if (
      savedDurations &&
      Number.isInteger(savedDurations.pomodoro) &&
      savedDurations.pomodoro >= 1 &&
      savedDurations.pomodoro <= 90
    )
      durations.pomodoro = savedDurations.pomodoro;
    if (
      savedDurations &&
      Number.isInteger(savedDurations.short) &&
      savedDurations.short >= 1 &&
      savedDurations.short <= 30
    )
      durations.short = savedDurations.short;
    if (
      savedDurations &&
      Number.isInteger(savedDurations.long) &&
      savedDurations.long >= 1 &&
      savedDurations.long <= 60
    )
      durations.long = savedDurations.long;
  }
  function persistSessions() {
    DR.saveStorage(DR.keys.focusSessions, DR.state.focusSessions);
    DR.saveStorage(DR.keys.plantProgress, DR.state.plantProgress);
  }
  function completeSession() {
    clearTick();
    running = false;
    remainingMs = 0;
    endTimestamp = null;

    // Only a completed Pomodoro session cares for and grows the plant.
    // Short/long breaks are recorded but never reset the inactivity clock.
    if (mode === "pomodoro") careForPlant();

    const record = {
      id: `session-${Date.now().toString(36)}`,
      type: mode,
      durationMinutes: durations[mode],
      completedAt: new Date().toISOString(),
    };

    DR.state.focusSessions.push(record);
    persistSessions();

    lastCompleteMessage =
      mode === "pomodoro"
        ? "Focus session complete! Your plant received care."
        : "Break complete — nice reset!";

    renderTimer();
    DR.renderFocusStats();
    DR.updateSummary();

    if (typeof DR.renderAnalytics === "function") DR.renderAnalytics();

    if (mode === "pomodoro") {
      // The plant is cared for above before the celebration is displayed.
      showFocusCompletion();
    } else {
      DR.toast("Break complete. Ready for the next focus session?");
    }
  }
  function tick() {
    if (!running || endTimestamp === null) return;
    remainingMs = Math.max(0, endTimestamp - Date.now());
    if (remainingMs <= 0) {
      completeSession();
      return;
    }
    renderTimer();
  }
  function startTimer() {
    if (running) return;
    if (remainingMs <= 0) {
      remainingMs = durations[mode] * 60000;
      initialDurationMs = remainingMs;
    }
    running = true;
    lastCompleteMessage = "";
    endTimestamp = Date.now() + remainingMs;
    clearTick();
    intervalId = window.setInterval(tick, 250);
    renderTimer();
  }
  function pauseTimer() {
    if (!running) return;
    remainingMs = Math.max(0, endTimestamp - Date.now());
    running = false;
    endTimestamp = null;
    clearTick();
    renderTimer();
  }
  function resetTimer(announce = false) {
    clearTick();
    running = false;
    endTimestamp = null;
    remainingMs = durations[mode] * 60000;
    initialDurationMs = remainingMs;
    lastCompleteMessage = "";
    renderTimer();
    if (announce) DR.toast("Timer reset. No focus progress was added.");
  }
  function switchMode(nextMode) {
    if (!Object.hasOwn(durations, nextMode)) return;
    clearTick();
    running = false;
    endTimestamp = null;
    mode = nextMode;
    remainingMs = durations[mode] * 60000;
    initialDurationMs = remainingMs;
    lastCompleteMessage = "";
    renderTimer();
  }
  function formatMinutes(minutes) {
    const value = Math.max(0, Math.round(minutes));
    if (value < 60) return `${value}m`;
    const hours = Math.floor(value / 60),
      mins = value % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }
  DR.renderFocusStats = function () {
    const today = DR.todayISO();
    const focusSessions = DR.state.focusSessions.filter(
      (session) => session.type === "pomodoro",
    );
    const todayCount = focusSessions.filter(
      (session) => session.completedAt.slice(0, 10) === today,
    ).length;
    const totalMinutes = focusSessions.reduce(
      (sum, session) => sum + (Number(session.durationMinutes) || 25),
      0,
    );

    // Eight cumulative growth levels, with independent health deterioration.
    const plantStages = [
      {
        name: "Seedling",
        asset: "assets/plant-stage-1.png",
        alt: "A tiny seedling in a terracotta pot",
      },
      {
        name: "Sprout",
        asset: "assets/plant-stage-2.png",
        alt: "A young sprout in a terracotta pot",
      },
      {
        name: "Young Plant",
        asset: "assets/plant-stage-3.png",
        alt: "A small leafy plant in a terracotta pot",
      },
      {
        name: "Growing",
        asset: "assets/plant-stage-4.png",
        alt: "A taller branching plant in a terracotta pot",
      },
      {
        name: "Budding",
        asset: "assets/plant-stage-5.png",
        alt: "A mature plant with flower buds in a terracotta pot",
      },
      {
        name: "Blooming",
        asset: "assets/plant-stage-6.png",
        alt: "A flowering plant in a terracotta pot",
      },
      {
        name: "Flourishing",
        asset: "assets/plant-stage-7.png",
        alt: "A lush flowering plant in a terracotta pot",
      },
      {
        name: "Evergreen",
        asset: "assets/plant-stage-8.png",
        alt: "A fully grown flowering plant in a terracotta pot",
      },
    ];

    const health = checkPlantHealth();
    const completed = Math.max(
      0,
      Math.floor(Number(DR.state.plantProgress) || 0),
    );
    const stageIndex = Math.min(
      plantStages.length - 1,
      Math.floor(completed / 3),
    );
    const stage = plantStages[stageIndex];
    const stageStart = stageIndex * 3;
    const percent =
      stageIndex === plantStages.length - 1
        ? 100
        : Math.min(100, ((completed - stageStart) / 3) * 100);
    const level = stageIndex + 1;

    let image = stage.asset;
    let imageAlt = stage.alt;
    let stageLabel = `Level ${level} · ${stage.name}`;
    let progressLabel =
      level === plantStages.length
        ? `${completed} focus sessions · Maximum growth reached`
        : `${completed} focus sessions · ${3 - (completed - stageStart)} to next level`;
    let progressWidth = percent;
    let healthState = "healthy";

    // Display a different local SVG as inactivity increases.
    if (health.rotten) {
      image = "assets/plant-rotten.png";
      imageAlt = "A completely rotten plant with dry leaves";
      stageLabel = "Garden lost · Start again";
      progressLabel =
        "Your plant has rotted. Complete a Pomodoro to grow a new seedling.";
      progressWidth = 0;
      healthState = "rotten";
    } else if (health.inactiveDays >= 5) {
      image = "assets/plant-severely-wilted.png";
      imageAlt = "A severely wilted plant with brown drooping leaves";
      stageLabel = `Level ${level} · Severely wilted`;
      progressLabel = `${health.inactiveDays} inactive days · Complete a focus session to revive it`;
      healthState = "critical";
    } else if (health.inactiveDays >= 3) {
      image = "assets/plant-withered.png";
      imageAlt = "A withering plant with yellowing leaves";
      stageLabel = `Level ${level} · Withering`;
      progressLabel = `${health.inactiveDays} inactive days · Your plant needs care`;
      healthState = "withered";
    }

    byId("sessionsToday").textContent = todayCount;
    byId("focusTotalTime").textContent = formatMinutes(totalMinutes);
    byId("focusDayStreak").textContent = DR.streakFromSessions();
    byId("plantStageLabel").textContent = stageLabel;
    byId("plantXpLabel").textContent = progressLabel;
    byId("plantProgressBar").style.width = `${progressWidth}%`;

    const plant = byId("focusPlant");
    if (plant.getAttribute("src") !== image) plant.setAttribute("src", image);
    plant.alt = imageAlt;
    plant.dataset.level = health.rotten ? "0" : String(level);
    plant.dataset.health = healthState;
  };
  DR.resetFocusTimerForUser = function () {
    clearTick();
    running = false;
    endTimestamp = null;
    mode = "pomodoro";
    lastCompleteMessage = "";
    loadDurationsForCurrentUser();
    remainingMs = durations[mode] * 60000;
    initialDurationMs = remainingMs;
    if (byId("timerDisplay")) renderTimer();
    if (typeof DR.renderFocusStats === "function") DR.renderFocusStats();
  };
  DR.stopFocusTimerForLogout = function () {
    clearTick();
    running = false;
    endTimestamp = null;
    mode = "pomodoro";
    lastCompleteMessage = "";
    durations = { ...DEFAULT_DURATIONS };
    remainingMs = durations[mode] * 60000;
    initialDurationMs = remainingMs;
  };
  DR.initFocusTimer = function () {
    loadDurationsForCurrentUser();
    remainingMs = durations[mode] * 60000;
    initialDurationMs = remainingMs;
    document
      .querySelectorAll("[data-session]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          switchMode(button.dataset.session),
        ),
      );
    byId("timerStartPause").addEventListener("click", () =>
      running ? pauseTimer() : startTimer(),
    );
    byId("timerReset").addEventListener("click", () => resetTimer(true));
    byId("timerSkip").addEventListener("click", () => {
      resetTimer(false);
      DR.toast(
        "Session skipped. Your focus plant only grows after a completed Pomodoro.",
      );
    });

    // The user can mute the local completion chime from Settings.
    const soundToggle = byId("focusSoundToggle");
    if (soundToggle) {
      soundToggle.setAttribute("aria-checked", String(soundEnabled));
      soundToggle.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundToggle.setAttribute("aria-checked", String(soundEnabled));
        DR.saveStorage(DR.keys.focusSoundEnabled, soundEnabled);
        DR.toast(
          soundEnabled
            ? "Focus completion sound enabled."
            : "Focus completion sound muted.",
        );
      });
    }

    // Completing a Pomodoro can move directly into a short break.
    byId("focusCompletionStartBreak")?.addEventListener("click", () => {
      DR.closeDialog("focusCompleteDialog");
      switchMode("short");
      startTimer();
    });

    byId("focusSettingsButton").addEventListener("click", () => {
      // Prompt for all three session lengths so breaks can be personalised too.
      const focus = window.prompt(
        "Pomodoro focus length in minutes (1–90):",
        String(durations.pomodoro),
      );
      if (focus === null) return;
      const shortBreak = window.prompt(
        "Short break length in minutes (1–30):",
        String(durations.short),
      );
      if (shortBreak === null) return;
      const longBreak = window.prompt(
        "Long break length in minutes (1–60):",
        String(durations.long),
      );
      if (longBreak === null) return;
      const next = {
        pomodoro: Number(focus),
        short: Number(shortBreak),
        long: Number(longBreak),
      };
      if (
        !Number.isInteger(next.pomodoro) ||
        next.pomodoro < 1 ||
        next.pomodoro > 90 ||
        !Number.isInteger(next.short) ||
        next.short < 1 ||
        next.short > 30 ||
        !Number.isInteger(next.long) ||
        next.long < 1 ||
        next.long > 60
      ) {
        DR.toast(
          "Check the allowed ranges: focus 1–90, short break 1–30, long break 1–60 minutes.",
          "error",
        );
        return;
      }
      durations = next;
      DR.saveStorage(DR.keys.timerDurations, durations);
      resetTimer(false);
      DR.toast("Your focus and break durations were saved.");
    });
    renderTimer();
    DR.renderFocusStats();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && running) tick();
    });
  };
})();
