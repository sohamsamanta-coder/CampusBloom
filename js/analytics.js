/* Academic and focus analytics use the SGPA records and focus-session history already saved by CampusBloom. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const $ = (id) => document.getElementById(id);
  function semesterRecord(number) {
    const subjects = DR.readStorage(`${DR.keys.cgpaSubjects}_S${number}`, null);
    if (!Array.isArray(subjects) || !subjects.length) return null;
    const valid = subjects.filter(
      (item) =>
        item &&
        String(item.name || "").trim() &&
        Number(item.credits) > 0 &&
        Number.isFinite(Number(item.gradePoint)),
    );
    const credits = valid.reduce((sum, item) => sum + Number(item.credits), 0);
    if (!credits) return null;
    const points = valid.reduce(
      (sum, item) => sum + Number(item.credits) * Number(item.gradePoint),
      0,
    );
    return {
      semester: number,
      sgpa: points / credits,
      credits,
      subjects: valid.length,
      points,
    };
  }
  function annualRecord(first, second) {
    if (!first || !second) return null;
    const credits = first.credits + second.credits;
    return credits
      ? (first.sgpa * first.credits + second.sgpa * second.credits) / credits
      : null;
  }
  function renderSemesters() {
    const grid = $("semesterAnalyticsGrid");
    if (!grid) return;
    grid.replaceChildren();
    const semesters = Array.from({ length: 6 }, (_, index) =>
      semesterRecord(index + 1),
    );
    semesters.forEach((record, index) => {
      const card = document.createElement("article");
      card.className = "semester-analytics-card";
      const title = document.createElement("span");
      title.textContent = `Semester ${index + 1}`;
      const value = document.createElement("strong");
      value.textContent = record ? record.sgpa.toFixed(2) : "—";
      const detail = document.createElement("small");
      detail.textContent = record
        ? `${record.credits} credits · ${record.subjects} subjects`
        : "No result saved";
      card.append(title, value, detail);
      grid.append(card);
    });
    const years = [
      annualRecord(semesters[0], semesters[1]),
      annualRecord(semesters[2], semesters[3]),
      annualRecord(semesters[4], semesters[5]),
    ];
    $("yearlyGpaSummary").textContent = years
      .map(
        (value, index) =>
          `Year ${index + 1}: ${value === null ? "pending" : value.toFixed(2)}`,
      )
      .join(" · ");
    const complete = years.every((value) => value !== null);
    // The supplied MAKAUT grade card gives DGPA for a 3-year degree as the mean of YGPA 1–3.
    $("dgpaValue").textContent = complete
      ? (years.reduce((sum, value) => sum + value, 0) / 3).toFixed(2)
      : "—";
    $("dgpaExplanation").textContent = complete
      ? "Calculated using the three-year DGPA formula shown on your MAKAUT grade card."
      : `Enter results for all six semesters to calculate the three-year DGPA. ${semesters.filter(Boolean).length}/6 semesters saved.`;
  }
  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function renderFocusAnalytics() {
    const sessions = DR.state.focusSessions.filter(
      (item) => item.type === "pomodoro",
    );
    const goal = Number(DR.readStorage(DR.keys.focusDailyGoal, 60)) || 60;
    $("focusGoalInput").value = String(goal);
    const today = DR.todayISO();
    const todayMinutes = sessions
      .filter((item) => item.completedAt.slice(0, 10) === today)
      .reduce((sum, item) => sum + Number(item.durationMinutes || 25), 0);
    $("focusGoalText").textContent = `${todayMinutes} / ${goal} minutes today`;
    $("focusGoalBar").style.width =
      `${Math.min(100, (todayMinutes / goal) * 100)}%`;
    const bars = $("weeklyFocusBars");
    bars.replaceChildren();
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (6 - index),
        12,
      );
      const dateKey = isoDate(date);
      const minutes = sessions
        .filter((item) => item.completedAt.slice(0, 10) === dateKey)
        .reduce((sum, item) => sum + Number(item.durationMinutes || 25), 0);
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        minutes,
      };
    });
    const max = Math.max(25, ...days.map((day) => day.minutes));
    days.forEach((day) => {
      const column = document.createElement("div");
      column.className = "focus-day-column";
      const value = document.createElement("small");
      value.textContent = day.minutes ? `${day.minutes}m` : "—";
      const track = document.createElement("div");
      track.className = "focus-day-track";
      const fill = document.createElement("span");
      fill.style.height = `${Math.max(day.minutes ? 5 : 0, (day.minutes / max) * 100)}%`;
      track.append(fill);
      const label = document.createElement("small");
      label.textContent = day.label;
      column.append(value, track, label);
      bars.append(column);
    });
    const recent = $("recentFocusSessions");
    recent.replaceChildren();
    const latest = [...sessions]
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 8);
    if (!latest.length) {
      const empty = document.createElement("p");
      empty.className = "muted-copy";
      empty.textContent = "Completed Pomodoro sessions will appear here.";
      recent.append(empty);
    } else {
      latest.forEach((item) => {
        const row = document.createElement("div");
        row.className = "recent-focus-row";
        const time = document.createElement("span");
        time.textContent = new Date(item.completedAt).toLocaleString(
          undefined,
          {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          },
        );
        const minutes = document.createElement("strong");
        minutes.textContent = `${Number(item.durationMinutes || 25)} min`;
        row.append(time, minutes);
        recent.append(row);
      });
    }
  }
  DR.renderAnalytics = function () {
    renderSemesters();
    renderFocusAnalytics();
  };
  DR.initAnalytics = function () {
    $("focusGoalForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const goal = Number($("focusGoalInput").value);
      if (!Number.isInteger(goal) || goal < 15 || goal > 600) {
        DR.toast("Set a daily focus goal from 15 to 600 minutes.", "error");
        return;
      }
      DR.saveStorage(DR.keys.focusDailyGoal, goal);
      renderFocusAnalytics();
      DR.toast("Daily focus goal saved.");
    });
    DR.renderAnalytics();
  };
})();
