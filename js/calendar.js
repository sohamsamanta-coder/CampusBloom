/* Date-safe calendar generation and assignment filtering by selected date. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const byId = (id) => document.getElementById(id);
  const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: DR.todayISO(),
    dateFilterActive: false,
  };
  DR.calendarState = calendarState;
  const dateISO = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const priorityColorClass = (priority) =>
    ({
      high: "dot-high",
      medium: "dot-medium",
      low: "dot-low",
    })[priority] || "dot-medium";
  DR.renderCalendar = function () {
    const grid = byId("calendarGrid");
    if (!grid) return;
    const first = new Date(calendarState.year, calendarState.month, 1, 12);
    byId("calendarMonth").textContent = first.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    grid.replaceChildren();
    const offset = first.getDay();
    const totalDays = new Date(
      calendarState.year,
      calendarState.month + 1,
      0,
    ).getDate();
    const prevDays = new Date(
      calendarState.year,
      calendarState.month,
      0,
    ).getDate();
    const requiredCells = Math.ceil((offset + totalDays) / 7) * 7;
    const assignmentsByDate = new Map();
    DR.state.assignments.forEach((item) => {
      if (!assignmentsByDate.has(item.dueDate))
        assignmentsByDate.set(item.dueDate, []);
      assignmentsByDate.get(item.dueDate).push(item);
    });
    for (let index = 0; index < requiredCells; index++) {
      let day,
        date,
        otherMonth = false;
      if (index < offset) {
        day = prevDays - offset + index + 1;
        date = new Date(calendarState.year, calendarState.month - 1, day, 12);
        otherMonth = true;
      } else if (index >= offset + totalDays) {
        day = index - offset - totalDays + 1;
        date = new Date(calendarState.year, calendarState.month + 1, day, 12);
        otherMonth = true;
      } else {
        day = index - offset + 1;
        date = new Date(calendarState.year, calendarState.month, day, 12);
      }
      const iso = dateISO(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `calendar-day${otherMonth ? " other-month" : ""}${iso === DR.todayISO() ? " is-today" : ""}${iso === calendarState.selectedDate ? " is-selected" : ""}`;
      button.setAttribute("role", "gridcell");
      button.setAttribute(
        "aria-label",
        `${date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}${(assignmentsByDate.get(iso) || []).length ? `, ${(assignmentsByDate.get(iso) || []).length} assignment(s)` : ""}`,
      );
      button.setAttribute(
        "aria-pressed",
        String(iso === calendarState.selectedDate),
      );
      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = day;
      const markerWrap = document.createElement("span");
      markerWrap.className = "day-markers";
      markerWrap.setAttribute("aria-hidden", "true");
      const dayAssignments = (assignmentsByDate.get(iso) || []).slice(0, 4);
      dayAssignments.forEach((item) => {
        const marker = document.createElement("i");
        marker.className = priorityColorClass(item.priority);
        if (item.completed) marker.style.opacity = ".42";
        markerWrap.append(marker);
      });
      button.append(number, markerWrap);
      button.addEventListener("click", () => {
        calendarState.selectedDate = iso;
        calendarState.dateFilterActive = true;
        calendarState.year = date.getFullYear();
        calendarState.month = date.getMonth();
        DR.renderCalendar();
        DR.renderWorkload();
      });
      grid.append(button);
    }
    DR.renderWorkload();
  };
  DR.renderWorkload = function () {
    const list = byId("workloadList");
    if (!list) return;
    const title = byId("workloadTitle");
    let items = [...DR.state.assignments];
    const filter = byId("workloadFilter")?.value || "all";
    if (calendarState.dateFilterActive) {
      items = items.filter(
        (item) => item.dueDate === calendarState.selectedDate,
      );
      title.textContent = `Due ${DR.formatDate(calendarState.selectedDate, {
        month: "short",
        day: "numeric",
      })}`;
    } else {
      title.textContent = "Upcoming assignments";
      if (filter === "pending") items = items.filter((item) => !item.completed);
      else if (filter === "high")
        items = items.filter((item) => item.priority === "high");
      else if (filter === "completed")
        items = items.filter((item) => item.completed);
      else
        items = items.filter(
          (item) => !item.completed || item.dueDate >= DR.todayISO(),
        );
    }
    items.sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        Number(a.completed) - Number(b.completed),
    );
    const visible = items.slice(0, 5);
    byId("workloadCount").textContent =
      `${items.length} task${items.length === 1 ? "" : "s"}`;
    list.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const titleText = document.createElement("h3");
      titleText.textContent = calendarState.dateFilterActive
        ? "Nothing due on this date"
        : "No assignments to show";
      const copy = document.createElement("p");
      copy.textContent = calendarState.dateFilterActive
        ? "Pick another date or add a new assignment."
        : "Add a task to build your workload view.";
      empty.append(titleText, copy);
      list.append(empty);
      return;
    }
    visible.forEach((item) => {
      const row = document.createElement("div");
      row.className = `workload-item${item.completed ? " completed-task" : ""}`;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Edit ${item.title}`);
      const mark = document.createElement("span");
      mark.className = "workload-priority";
      mark.style.background =
        {
          high: "var(--red)",
          medium: "var(--orange)",
          low: "var(--green)",
        }[item.priority] || "var(--orange)";
      const main = document.createElement("div");
      main.className = "workload-item-main";
      const top = document.createElement("div");
      top.className = "workload-item-top";
      const titleNode = document.createElement("strong");
      titleNode.textContent = item.title;
      const due = document.createElement("span");
      due.className = `due-mini${DR.isOverdue(item) ? " overdue" : ""}`;
      if (item.completed) due.textContent = "✓ Done";
      else if (DR.isOverdue(item)) due.textContent = "◷ Overdue";
      else if (item.dueDate === DR.todayISO()) due.textContent = "◷ Today";
      else if (DR.dayDiff(DR.todayISO(), item.dueDate) === 1)
        due.textContent = "◷ Tomorrow";
      else
        due.textContent = DR.formatDate(item.dueDate, {
          month: "short",
          day: "numeric",
        });
      top.append(titleNode, due);
      const subject = document.createElement("small");
      subject.textContent = item.subject;
      const chip = document.createElement("span");
      chip.className = "subject-chip";
      chip.textContent = item.priority
        ? `${item.priority[0].toUpperCase()}${item.priority.slice(1)} priority`
        : "Assignment";
      main.append(top, subject, chip);
      row.append(mark, main);
      row.addEventListener("click", () => DR.openAssignmentDialog(item.id));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          DR.openAssignmentDialog(item.id);
        }
      });
      list.append(row);
    });
  };
  DR.initCalendar = function () {
    byId("prevMonth").addEventListener("click", () => {
      calendarState.month--;
      if (calendarState.month < 0) {
        calendarState.month = 11;
        calendarState.year--;
      }
      calendarState.dateFilterActive = false;
      DR.renderCalendar();
    });
    byId("nextMonth").addEventListener("click", () => {
      calendarState.month++;
      if (calendarState.month > 11) {
        calendarState.month = 0;
        calendarState.year++;
      }
      calendarState.dateFilterActive = false;
      DR.renderCalendar();
    });
    byId("todayButton").addEventListener("click", () => {
      const today = DR.parseDate(DR.todayISO());
      calendarState.year = today.getFullYear();
      calendarState.month = today.getMonth();
      calendarState.selectedDate = DR.todayISO();
      calendarState.dateFilterActive = true;
      DR.renderCalendar();
    });
    byId("workloadFilter").addEventListener("change", () => {
      if (!calendarState.dateFilterActive) DR.renderWorkload();
    });
  };
})();
