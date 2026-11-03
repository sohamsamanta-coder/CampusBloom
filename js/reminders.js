(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const $ = (id) => document.getElementById(id);
  function getReminderItems() {
    const today = DR.todayISO();
    const upcoming = DR.state.assignments
      .filter(
        (item) =>
          !item.completed &&
          item.dueDate >= today &&
          DR.dayDiff(today, item.dueDate) <= 7,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const overdue = DR.state.assignments
      .filter(DR.isOverdue)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const classes = (DR.state.timetable || [])
      .filter(
        (item) =>
          item.day ===
          ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
            new Date().getDay()
          ],
      )
      .sort((a, b) => a.start.localeCompare(b.start));
    return { upcoming, overdue, classes };
  }
  function appendGroup(container, titleText, entries, formatter, emptyText) {
    const group = document.createElement("section");
    group.className = "reminder-group";
    const title = document.createElement("h3");
    title.textContent = titleText;
    group.append(title);
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "reminder-empty";
      empty.textContent = emptyText;
      group.append(empty);
    } else {
      entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "reminder-row";
        const strong = document.createElement("strong");
        strong.textContent = entry.title || entry.subject;
        const small = document.createElement("small");
        small.textContent = formatter(entry);
        row.append(strong, small);
        group.append(row);
      });
    }
    container.append(group);
  }
  function render() {
    const list = $("reminderList");
    if (!list) return;
    list.replaceChildren();
    const { upcoming, overdue, classes } = getReminderItems();
    appendGroup(
      list,
      `Overdue assignments (${overdue.length})`,
      overdue,
      (item) => `Was due ${DR.formatDate(item.dueDate)}`,
      "No overdue assignments.",
    );
    appendGroup(
      list,
      "Coming up in 7 days",
      upcoming,
      (item) => `Due ${DR.formatDate(item.dueDate)} · ${item.subject}`,
      "No upcoming assignment deadlines.",
    );
    appendGroup(
      list,
      "Today's classes",
      classes,
      (item) => `${item.start}–${item.end} · ${item.room}`,
      "No classes on your timetable today.",
    );
    const enabled =
      DR.readStorage(DR.keys.notificationsEnabled, false) === true;
    const button = $("enableBrowserNotifications");
    if (button)
      button.textContent = enabled
        ? "Disable browser alerts"
        : "Enable browser alerts";
    notifyForDueWork();
  }
  function notifyForDueWork() {
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;
    if (!DR.readStorage(DR.keys.notificationsEnabled, false)) return;
    const today = DR.todayISO();
    const soon = DR.state.assignments.filter((item) => {
      if (item.completed) return false;
      const days = DR.dayDiff(today, item.dueDate);
      return days <= 1;
    });
    const key = DR.keys.notificationLedger;
    const ledger = DR.readStorage(key, {});
    soon.forEach((item) => {
      if (ledger[item.id] === today) return;
      const days = DR.dayDiff(today, item.dueDate);
      const message =
        days < 0
          ? "is overdue"
          : days === 0
            ? "is due today"
            : "is due tomorrow";
      new Notification("CampusBloom deadline reminder", {
        body: `${item.title} ${message}. Due date: ${DR.formatDate(item.dueDate)}.`,
      });
      ledger[item.id] = today;
    });
    DR.saveStorage(key, ledger);
  }
  DR.openReminders = function () {
    render();
    DR.openDialog("reminderDialog");
  };
  DR.renderReminders = render;
  DR.checkDueNotifications = notifyForDueWork;
  DR.initReminders = function () {
    $("enableBrowserNotifications").addEventListener("click", async () => {
      const enabled =
        DR.readStorage(DR.keys.notificationsEnabled, false) === true;
      if (enabled) {
        DR.saveStorage(DR.keys.notificationsEnabled, false);
        DR.toast("Browser reminders disabled.");
        render();
        return;
      }
      if (!("Notification" in window)) {
        DR.toast("This browser does not support notifications.", "error");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        DR.saveStorage(DR.keys.notificationsEnabled, true);
        DR.toast("Browser reminders enabled while CampusBloom is open.");
        notifyForDueWork();
      } else {
        DR.saveStorage(DR.keys.notificationsEnabled, false);
        DR.toast("Notification permission was not granted.", "error");
      }
      render();
    });
    render();
    notifyForDueWork();
  };
})();
