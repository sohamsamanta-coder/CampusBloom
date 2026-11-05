/* CampusBloom shared state: persistence, navigation and dashboard summaries. */
/* The old storage-key prefix is retained to preserve saved data from earlier versions. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  // Centralise storage keys here so each account can have its own planner data.
  DR.baseKeys = {
    assignments: "deadlineRadar_assignments",
    focusSessions: "deadlineRadar_focusSessions",
    plantProgress: "deadlineRadar_plantProgress",
    // Last completed focus date and current plant health.
    plantHealth: "deadlineRadar_plantHealth",
    attendance: "deadlineRadar_attendance",
    cgpaSubjects: "deadlineRadar_sgpaSubjects",
    theme: "deadlineRadar_theme",
    semester: "deadlineRadar_semester",
    timerDurations: "deadlineRadar_timerDurations",
    timetable: "deadlineRadar_timetable",
    subjectAttendance: "deadlineRadar_subjectAttendance",
    notes: "deadlineRadar_notes",
    focusDailyGoal: "deadlineRadar_focusDailyGoal",
    focusSoundEnabled: "deadlineRadar_focusSoundEnabled",
    notificationsEnabled: "deadlineRadar_notificationsEnabled",
    notificationLedger: "deadlineRadar_notificationLedger",
  };
  DR.keys = { ...DR.baseKeys };
  DR.userScopePrefix = "";
  DR.setUserScope = function (userId) {
    const safeId = String(userId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    DR.userScopePrefix = `deadlineRadar_user_${safeId}_`;
    DR.keys = Object.fromEntries(
      Object.entries(DR.baseKeys).map(([name, key]) => [
        name,
        `${DR.userScopePrefix}${key.replace(/^deadlineRadar_/, "")}`,
      ]),
    );
  };
  // Shared in-memory state keeps the dashboard, calendar and lists in sync.
  DR.state = {
    assignments: [],
    focusSessions: [],
    plantProgress: 0,
    attendance: null,
    cgpaSubjects: [],
    timetable: [],
    theme: "light",
    assignmentFilter: "all",
    searchQuery: "",
  };
  DR.todayISO = function (offset = 0) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  DR.parseDate = function (iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  DR.formatDate = function (
    iso,
    options = {
      month: "short",
      day: "numeric",
    },
  ) {
    const d = DR.parseDate(iso);
    return d ? d.toLocaleDateString(undefined, options) : "No date";
  };
  DR.readStorage = function (key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn(
        `Could not read saved data for ${key}; using a safe default.`,
        error,
      );
      return fallback;
    }
  };
  DR.saveStorage = function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Could not save ${key}.`, error);
      DR.toast(
        "Your browser could not save this change. Check available storage.",
        "error",
      );
      return false;
    }
  };
  DR.makeDemoAssignments = function () {
    const now = new Date();
    const today = DR.todayISO();
    return [
      {
        id: "demo-dbms",
        title: "DBMS Assignment",
        subject: "Database Management Systems",
        description:
          "Prepare notes and examples on database normalization up to 3NF.",
        dueDate: today,
        priority: "high",
        completed: false,
        createdAt: today,
      },
      {
        id: "demo-cn",
        title: "CN Lab Report",
        subject: "Computer Networks",
        description:
          "Finish the experiment write-up and add the result screenshots.",
        dueDate: DR.todayISO(-1),
        priority: "high",
        completed: false,
        createdAt: today,
      },
      {
        id: "demo-maths",
        title: "Maths Quiz",
        subject: "Mathematics",
        description: "Revise chapters 3 and 4 before the quiz.",
        dueDate: DR.todayISO(3),
        priority: "medium",
        completed: false,
        createdAt: today,
      },
      {
        id: "demo-os",
        title: "OS Project",
        subject: "Operating Systems",
        description: "Complete the process scheduling section of the report.",
        dueDate: DR.todayISO(6),
        priority: "low",
        completed: false,
        createdAt: today,
      },
      {
        id: "demo-presentation",
        title: "Presentation",
        subject: "Seminar on AI",
        description: "Prepare slides and rehearse the introduction.",
        dueDate: DR.todayISO(9),
        priority: "medium",
        completed: true,
        createdAt: today,
      },
    ];
  };
  DR.makeDemoAttendance = () => ({
    attended: 78,
    total: 100,
    target: 85,
  });
  // Sample Semester 3 marks match the uploaded MAKAUT grade-card example (SGPA 8.14).
  DR.makeDemoSubjects = () => [
    {
      id: "sub-python",
      name: "Python Programming",
      credits: 3,
      grade: "B",
      gradePoint: 7,
    },
    {
      id: "sub-ds-c",
      name: "Data Structure through C",
      credits: 3,
      grade: "O",
      gradePoint: 10,
    },
    {
      id: "sub-marketing",
      name: "Principles of Marketing",
      credits: 4,
      grade: "C",
      gradePoint: 6,
    },
    {
      id: "sub-ethics",
      name: "Values & Ethics",
      credits: 3,
      grade: "A",
      gradePoint: 8,
    },
    {
      id: "sub-constitution",
      name: "The Constitution, Human Rights and Law",
      credits: 2,
      grade: "C",
      gradePoint: 6,
    },
    {
      id: "sub-cybersecurity",
      name: "Understanding Basics of Cyber Security",
      credits: 2,
      grade: "O",
      gradePoint: 10,
    },
    {
      id: "sub-python-lab",
      name: "Python Programming Lab",
      credits: 2,
      grade: "O",
      gradePoint: 10,
    },
    {
      id: "sub-ds-lab",
      name: "Data Structure Lab",
      credits: 2,
      grade: "O",
      gradePoint: 10,
    },
  ];
  DR.loadData = function () {
    const assignRaw = DR.readStorage(DR.keys.assignments, null);
    DR.state.assignments = Array.isArray(assignRaw)
      ? assignRaw.filter((a) => a && a.id && a.title && a.subject && a.dueDate)
      : DR.makeDemoAssignments();
    if (assignRaw === null || !Array.isArray(assignRaw))
      DR.saveStorage(DR.keys.assignments, DR.state.assignments);
    const sessionRaw = DR.readStorage(DR.keys.focusSessions, []);
    DR.state.focusSessions = Array.isArray(sessionRaw)
      ? sessionRaw.filter((s) => s && s.completedAt)
      : [];
    const plantRaw = DR.readStorage(DR.keys.plantProgress, 0);
    DR.state.plantProgress = Number.isFinite(Number(plantRaw))
      ? Math.max(0, Number(plantRaw))
      : DR.state.focusSessions.filter((s) => s.type === "pomodoro").length;
    const attRaw = DR.readStorage(DR.keys.attendance, null);
    DR.state.attendance =
      attRaw &&
      Number.isFinite(Number(attRaw.attended)) &&
      Number.isFinite(Number(attRaw.total))
        ? attRaw
        : DR.makeDemoAttendance();
    if (attRaw === null || !attRaw)
      DR.saveStorage(DR.keys.attendance, DR.state.attendance);
    const subjRaw = DR.readStorage(DR.keys.cgpaSubjects, null);
    DR.state.cgpaSubjects =
      Array.isArray(subjRaw) && subjRaw.length
        ? subjRaw
        : DR.makeDemoSubjects();
    if (subjRaw === null || !Array.isArray(subjRaw) || !subjRaw.length)
      DR.saveStorage(DR.keys.cgpaSubjects, DR.state.cgpaSubjects);
    const timetableRaw = DR.readStorage(DR.keys.timetable, null);
    const validDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    DR.state.timetable = Array.isArray(timetableRaw)
      ? timetableRaw.filter(
          (item) =>
            item &&
            item.id &&
            validDays.includes(item.day) &&
            item.start &&
            item.end &&
            item.subject &&
            item.room,
        )
      : DR.makeDemoTimetable();
    if (timetableRaw === null || !Array.isArray(timetableRaw))
      DR.saveStorage(DR.keys.timetable, DR.state.timetable);
    DR.state.theme =
      localStorage.getItem(DR.keys.theme) === "dark" ? "dark" : "light";
  };
  DR.updateIdentity = function (user) {
    const name = String(user?.name || "Student").trim() || "Student";
    const first = name.charAt(0).toLocaleUpperCase();
    const avatar = document.querySelector(".profile-button .avatar");
    if (avatar) avatar.textContent = first;
    const profileName = document.querySelector(".profile-copy strong");
    if (profileName) profileName.textContent = `Hello, ${name}`;
    const welcome = document.getElementById("welcomeTitle");
    if (welcome) {
      const hour = new Date().getHours();
      const greeting =
        hour < 12
          ? "Good morning"
          : hour < 18
            ? "Good afternoon"
            : "Good evening";
      const wave = document.createElement("span");
      wave.setAttribute("aria-hidden", "true");
      wave.textContent = " 👋";
      welcome.replaceChildren(
        document.createTextNode(`${greeting}, ${name}`),
        wave,
      );
    }
    const accountName = document.getElementById("accountSettingsName");
    const accountEmail = document.getElementById("accountSettingsEmail");
    const accountDescription = document.getElementById(
      "accountSettingsDescription",
    );
    if (accountName) accountName.textContent = name;
    if (accountEmail) accountEmail.textContent = user?.email || "";
    if (accountDescription)
      accountDescription.textContent = `You are signed in as ${name}. Your planner is saved separately from other accounts in this browser.`;
    const profileButton = document.getElementById("profileButton");
    if (profileButton)
      profileButton.setAttribute(
        "aria-label",
        `Account for ${name}. Open settings`,
      );
  };
  DR.toast = function (message, type = "") {
    const region = document.getElementById("toastRegion");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = `toast${type ? ` ${type}` : ""}`;
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  };
  DR.dayDiff = function (fromISO, toISO) {
    const a = DR.parseDate(fromISO),
      b = DR.parseDate(toISO);
    if (!a || !b) return 0;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  };
  DR.isOverdue = (assignment) =>
    !assignment.completed && assignment.dueDate < DR.todayISO();
  DR.isDueThisWeek = (assignment) => {
    if (assignment.completed) return false;
    const today = DR.parseDate(DR.todayISO());
    const due = DR.parseDate(assignment.dueDate);
    if (!today || !due) return false;
    const sundayOffset = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - sundayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return due >= start && due < end && due >= today;
  };
  DR.streakFromSessions = function () {
    const dates = new Set(
      DR.state.focusSessions
        .filter((session) => session.type === "pomodoro")
        .map((session) => session.completedAt.slice(0, 10)),
    );
    if (!dates.size) return 0;
    let cursor = DR.parseDate(DR.todayISO());
    if (!dates.has(DR.todayISO())) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (
      dates.has(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`,
      )
    ) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };
  DR.completedSessionsToday = function () {
    const today = DR.todayISO();
    return DR.state.focusSessions.filter(
      (session) =>
        session.type === "pomodoro" &&
        session.completedAt.slice(0, 10) === today,
    ).length;
  };
  DR.focusMinutesTotal = function () {
    return DR.state.focusSessions
      .filter((session) => session.type === "pomodoro")
      .reduce(
        (sum, session) => sum + (Number(session.durationMinutes) || 25),
        0,
      );
  };
  DR.applyTheme = function (theme) {
    DR.state.theme = theme === "dark" ? "dark" : "light";
    document.body.dataset.theme = DR.state.theme;
    localStorage.setItem(DR.keys.theme, DR.state.theme);
    const themeIcon = document.getElementById("themeIcon");
    const toggle = document.getElementById("themeToggle");
    const settingsToggle = document.getElementById("settingsThemeToggle");
    if (themeIcon)
      themeIcon.textContent = DR.state.theme === "dark" ? "☾" : "☼";
    if (toggle) {
      toggle.setAttribute(
        "aria-label",
        DR.state.theme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme",
      );
      toggle.title =
        DR.state.theme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme";
    }
    if (settingsToggle)
      settingsToggle.setAttribute(
        "aria-checked",
        String(DR.state.theme === "dark"),
      );
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta)
      themeMeta.content = DR.state.theme === "dark" ? "#151a17" : "#f7f8f4";
  };
  DR.updateSummary = function () {
    const assignments = DR.state.assignments;
    const due = assignments.filter(DR.isDueThisWeek).length;
    const overdue = assignments.filter(DR.isOverdue).length;
    const completed = assignments.filter((a) => a.completed).length;
    const weeklyTasks = assignments.filter((a) => {
      const start = DR.parseDate(DR.todayISO());
      const end = DR.parseDate(DR.todayISO(7));
      const d = DR.parseDate(a.dueDate);
      return d && start && end && d >= start && d < end;
    });
    const weeklyCompleted = weeklyTasks.filter((a) => a.completed).length;
    const progress = weeklyTasks.length
      ? Math.round((weeklyCompleted / weeklyTasks.length) * 100)
      : 100;
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    };
    setText("dueThisWeekCount", due);
    setText("overdueCount", overdue);
    setText("completedCount", completed);
    setText("dayStreakCount", DR.streakFromSessions());
    setText(
      "weeklyMessage",
      due
        ? `You have ${due} assignment${due === 1 ? "" : "s"} due this week.`
        : "No pending deadlines this week. Keep your momentum going!",
    );
    setText(
      "currentDate",
      new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
    setText(
      "weeklyProgressLabel",
      weeklyTasks.length ? "Your weekly progress" : "No deadlines this week",
    );
    setText(
      "weeklyProgressText",
      weeklyTasks.length ? `${progress}% complete` : "All clear",
    );
    const bar = document.getElementById("weeklyProgressBar");
    if (bar) bar.style.width = `${progress}%`;
    const dot = document.getElementById("notificationDot");
    if (dot) dot.hidden = overdue === 0;
    setText("allAssignmentsBadge", assignments.length);
  };
  DR.renderTodayTasks = function () {
    const list = document.getElementById("todayTaskList");
    if (!list) return;
    const today = DR.todayISO();
    const tasks = DR.state.assignments
      .filter((a) => a.dueDate === today)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
    list.replaceChildren();
    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state compact-empty";
      const title = document.createElement("h3");
      title.textContent = "Nothing due today";
      const p = document.createElement("p");
      p.textContent = "Add a task or enjoy a little breathing room.";
      empty.append(title, p);
      list.append(empty);
      return;
    }
    tasks.forEach((task) => {
      const row = document.createElement("label");
      row.className = `today-task-row${task.completed ? " done" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.className = "task-checkbox";
      checkbox.type = "checkbox";
      checkbox.checked = !!task.completed;
      checkbox.setAttribute(
        "aria-label",
        `Mark ${task.title} ${task.completed ? "pending" : "complete"}`,
      );
      checkbox.addEventListener("change", () =>
        DR.toggleAssignmentComplete(task.id),
      );
      const title = document.createElement("span");
      title.className = "today-task-title";
      title.textContent = task.title;
      const due = document.createElement("span");
      due.className = `task-due${task.completed ? " tomorrow" : ""}`;
      due.innerHTML = `<span class="clock-dot" aria-hidden="true">◷</span> ${task.completed ? "Done" : "Today"}`;
      row.append(checkbox, title, due);
      list.append(row);
    });
  };
  DR.refreshAll = function () {
    DR.updateSummary();
    if (typeof DR.renderCalendar === "function") DR.renderCalendar();
    if (typeof DR.renderAssignmentManager === "function")
      DR.renderAssignmentManager();
    DR.renderTodayTasks();
    if (typeof DR.renderFocusStats === "function") DR.renderFocusStats();
    if (typeof DR.renderAcademicDashboard === "function")
      DR.renderAcademicDashboard();
    if (typeof DR.renderSubjectAttendance === "function")
      DR.renderSubjectAttendance();
    if (typeof DR.renderNotes === "function") DR.renderNotes();
    if (typeof DR.renderAnalytics === "function") DR.renderAnalytics();
    if (typeof DR.renderReminders === "function") DR.renderReminders();
  };
  // Pages show one full view; section targets remain within the dashboard.
  DR.navigate = function (target) {
    const pageViews = [
      "dashboard",
      "assignments-page",
      "settings-page",
      "attendance-page",
      "notes-page",
      "analytics-page",
    ];
    const view = pageViews.includes(target) ? target : "dashboard";
    pageViews.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.classList.toggle("active-view", element.id === view);
    });
    document.querySelectorAll(".nav-item[data-nav]").forEach((button) => {
      button.classList.toggle("active", button.dataset.nav === target);
    });
    if (view === "dashboard" && target !== "dashboard") {
      window.setTimeout(
        () =>
          document.getElementById(target)?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          }),
        30,
      );
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    DR.closeMobileNav();
  };
  DR.closeMobileNav = function () {
    document.getElementById("sidebar")?.classList.remove("mobile-open");
    document.getElementById("mobileScrim").hidden = true;
    document
      .getElementById("mobileMenu")
      ?.setAttribute("aria-expanded", "false");
  };
  DR.openDialog = function (id) {
    const dialog = document.getElementById(id);
    if (dialog && !dialog.open) dialog.showModal();
  };
  DR.closeDialog = function (id) {
    const dialog = document.getElementById(id);
    if (dialog?.open) dialog.close();
  };
  DR.init = function () {
    const user = window.DRAuth?.currentUser;
    if (!user) {
      window.DRAuth?.showAuth("login");
      return;
    }
    DR.setUserScope(user.id);
    DR.loadData();
    DR.updateIdentity(user);
    // Login/register can call init again when another local account signs in.
    // Reuse the existing event handlers and only swap the current user's data.
    if (DR.wired) {
      DR.state.assignmentFilter = "all";
      DR.state.searchQuery = "";
      const search = document.getElementById("globalSearch");
      if (search) search.value = "";
      document.getElementById("clearSearch").hidden = true;
      if (document.getElementById("notesSearch"))
        document.getElementById("notesSearch").value = "";
      // A returning account always starts at the dashboard; hide all other views.
      document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("active-view", view.id === "dashboard");
      });
      if (typeof DR.reloadAcademicData === "function") DR.reloadAcademicData();
      if (typeof DR.resetFocusTimerForUser === "function")
        DR.resetFocusTimerForUser();
      DR.applyTheme(DR.state.theme);
      window.DRAuth?.showApp();
      DR.navigate("dashboard");
      DR.refreshAll();
      if (typeof DR.checkDueNotifications === "function")
        DR.checkDueNotifications();
      return;
    }
    DR.applyTheme(DR.state.theme);
    document.getElementById("footerYear").textContent =
      `© ${new Date().getFullYear()}`;
    document.querySelectorAll("[data-nav]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.preventDefault();
        DR.navigate(button.dataset.nav);
      }),
    );
    document.getElementById("mobileMenu").addEventListener("click", () => {
      const opened = document
        .getElementById("sidebar")
        .classList.toggle("mobile-open");
      document.getElementById("mobileScrim").hidden = !opened;
      document
        .getElementById("mobileMenu")
        .setAttribute("aria-expanded", String(opened));
    });
    document
      .getElementById("mobileScrim")
      .addEventListener("click", DR.closeMobileNav);
    document
      .getElementById("themeToggle")
      .addEventListener("click", () =>
        DR.applyTheme(DR.state.theme === "light" ? "dark" : "light"),
      );
    document
      .getElementById("settingsThemeToggle")
      .addEventListener("click", () =>
        DR.applyTheme(DR.state.theme === "light" ? "dark" : "light"),
      );
    document
      .getElementById("profileButton")
      .addEventListener("click", () => DR.navigate("settings-page"));
    document.getElementById("logoutButton").addEventListener("click", () => {
      if (
        window.confirm(
          "Log out of CampusBloom? Your saved planner data will remain in this browser.",
        )
      )
        window.DRAuth?.logout();
    });
    document
      .getElementById("notificationButton")
      .addEventListener("click", () => {
        if (typeof DR.openReminders === "function") DR.openReminders();
      });
    document
      .getElementById("globalSearch")
      .addEventListener("input", (event) => {
        DR.state.searchQuery = event.target.value.trim().toLowerCase();
        document.getElementById("clearSearch").hidden = !event.target.value;
        if (typeof DR.renderAssignmentManager === "function")
          DR.renderAssignmentManager();
        if (
          typeof DR.searchNotes === "function" &&
          typeof DR.renderNotes === "function"
        ) {
          const noteMatches = DR.searchNotes(DR.state.searchQuery);
          if (noteMatches.length && DR.getVisibleAssignments().length === 0) {
            document.getElementById("notesSearch").value = DR.state.searchQuery;
            DR.renderNotes();
            DR.navigate("notes-page");
            return;
          }
        }
        if (DR.state.searchQuery) DR.navigate("assignments-page");
      });
    document.getElementById("clearSearch").addEventListener("click", () => {
      document.getElementById("globalSearch").value = "";
      DR.state.searchQuery = "";
      document.getElementById("clearSearch").hidden = true;
      if (document.getElementById("notesSearch"))
        document.getElementById("notesSearch").value = "";
      if (typeof DR.renderNotes === "function") DR.renderNotes();
      if (typeof DR.renderAssignmentManager === "function")
        DR.renderAssignmentManager();
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("globalSearch").focus();
      }
      if (event.key === "Escape") DR.closeMobileNav();
    });
    document
      .querySelectorAll("[data-close-dialog]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          DR.closeDialog(button.dataset.closeDialog),
        ),
      );
    document
      .getElementById("quickAddForm")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("quickTaskInput");
        const title = input.value.trim();
        if (!title) {
          input.focus();
          DR.toast("Enter a task title first.", "error");
          return;
        }
        if (typeof DR.createAssignment === "function") {
          DR.createAssignment({
            title,
            subject: "Personal",
            description: "Added from Today’s Tasks.",
            dueDate: DR.todayISO(),
            priority: "medium",
          });
          input.value = "";
          DR.toast("Task added to today’s list.");
        }
      });
    document.getElementById("resetDemoButton").addEventListener("click", () => {
      if (
        !window.confirm(
          "Restore demo data for this account only? Your other accounts will not be affected.",
        )
      )
        return;
      Object.keys(localStorage)
        .filter(
          (key) => DR.userScopePrefix && key.startsWith(DR.userScopePrefix),
        )
        .forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    });
    if (typeof DR.initAssignments === "function") DR.initAssignments();
    if (typeof DR.initCalendar === "function") DR.initCalendar();
    if (typeof DR.initFocusTimer === "function") DR.initFocusTimer();
    if (typeof DR.initAcademic === "function") DR.initAcademic();
    if (typeof DR.initAttendanceTracker === "function")
      DR.initAttendanceTracker();
    if (typeof DR.initNotes === "function") DR.initNotes();
    if (typeof DR.initReminders === "function") DR.initReminders();
    if (typeof DR.initAnalytics === "function") DR.initAnalytics();
    DR.wired = true;
    window.DRAuth?.showApp();

    // First login and registration should open at the top of a fully rendered dashboard.
    DR.navigate("dashboard");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    DR.refreshAll();
    if (typeof DR.checkDueNotifications === "function") {
      DR.checkDueNotifications();
    }
  };
  document.addEventListener("DOMContentLoaded", DR.init);
})();
