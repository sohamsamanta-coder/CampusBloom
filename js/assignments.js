/* Assignment CRUD. Dashboard, calendar and Today’s Tasks share one data array. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const byId = (id) => document.getElementById(id);
  const priorityWeight = {
    high: 0,
    medium: 1,
    low: 2,
  };
  DR.persistAssignments = () =>
    DR.saveStorage(DR.keys.assignments, DR.state.assignments);
  DR.createAssignment = function (input) {
    const title = String(input.title || "").trim();
    const subject = String(input.subject || "").trim();
    const dueDate = String(input.dueDate || "");
    if (!title || !subject || !DR.parseDate(dueDate)) {
      DR.toast("Title, subject and a valid due date are required.", "error");
      return null;
    }
    const assignment = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      subject,
      description: String(input.description || "").trim(),
      dueDate,
      priority: ["high", "medium", "low"].includes(input.priority)
        ? input.priority
        : "medium",
      completed: false,
      createdAt: DR.todayISO(),
    };
    DR.state.assignments.push(assignment);
    DR.persistAssignments();
    DR.refreshAll();
    return assignment;
  };
  DR.toggleAssignmentComplete = function (id) {
    const assignment = DR.state.assignments.find((item) => item.id === id);
    if (!assignment) return;
    assignment.completed = !assignment.completed;
    assignment.completedAt = assignment.completed
      ? new Date().toISOString()
      : null;
    DR.persistAssignments();
    DR.refreshAll();
    DR.toast(
      assignment.completed
        ? "Assignment marked complete."
        : "Assignment reopened.",
    );
  };
  DR.openAssignmentDialog = function (id = null) {
    const form = byId("assignmentForm");
    form.reset();
    byId("assignmentFormError").textContent = "";
    byId("assignmentId").value = "";
    byId("assignmentDueDate").value = DR.todayISO();
    byId("assignmentPriority").value = "medium";
    if (id) {
      const item = DR.state.assignments.find((a) => a.id === id);
      if (!item) return;
      byId("assignmentDialogTitle").textContent = "Edit assignment";
      byId("assignmentId").value = item.id;
      byId("assignmentTitle").value = item.title;
      byId("assignmentSubject").value = item.subject;
      byId("assignmentDescription").value = item.description || "";
      byId("assignmentDueDate").value = item.dueDate;
      byId("assignmentPriority").value = item.priority || "medium";
    } else {
      byId("assignmentDialogTitle").textContent = "Add assignment";
    }
    DR.openDialog("assignmentDialog");
    window.setTimeout(() => byId("assignmentTitle").focus(), 50);
  };
  DR.deleteAssignment = function (id) {
    const item = DR.state.assignments.find((a) => a.id === id);
    if (!item) return;
    if (!window.confirm(`Delete “${item.title}” permanently?`)) return;
    DR.state.assignments = DR.state.assignments.filter((a) => a.id !== id);
    DR.persistAssignments();
    DR.refreshAll();
    DR.toast("Assignment deleted.");
  };
  DR.getVisibleAssignments = function () {
    const query = DR.state.searchQuery || "";
    let items = DR.state.assignments.filter((item) => {
      const matchesQuery =
        !query ||
        [item.title, item.subject, item.description].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      const filter = DR.state.assignmentFilter || "all";
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && !item.completed) ||
        (filter === "completed" && item.completed) ||
        (filter === "overdue" && DR.isOverdue(item));
      return matchesQuery && matchesFilter;
    });
    const sort = byId("assignmentSort")?.value || "date-asc";
    items = [...items].sort((a, b) => {
      if (sort === "date-desc") return b.dueDate.localeCompare(a.dueDate);
      if (sort === "priority")
        return (
          (priorityWeight[a.priority] ?? 1) -
            (priorityWeight[b.priority] ?? 1) ||
          a.dueDate.localeCompare(b.dueDate)
        );
      if (sort === "title") return a.title.localeCompare(b.title);
      return (
        a.dueDate.localeCompare(b.dueDate) ||
        Number(a.completed) - Number(b.completed)
      );
    });
    return items;
  };
  DR.renderAssignmentManager = function () {
    const list = byId("assignmentList");
    if (!list) return;
    list.replaceChildren();
    const items = DR.getVisibleAssignments();
    document
      .querySelectorAll("[data-assignment-filter]")
      .forEach((button) =>
        button.classList.toggle(
          "active",
          button.dataset.assignmentFilter ===
            (DR.state.assignmentFilter || "all"),
        ),
      );
    byId("allAssignmentsBadge").textContent = DR.state.assignments.length;
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const icon = document.createElement("div");
      icon.className = "empty-icon";
      icon.textContent = DR.state.searchQuery ? "⌕" : "✓";
      const title = document.createElement("h3");
      title.textContent = DR.state.searchQuery
        ? "No matching assignments"
        : DR.state.assignmentFilter === "overdue"
          ? "No overdue assignments"
          : "No assignments here";
      const copy = document.createElement("p");
      copy.textContent = DR.state.searchQuery
        ? "Try another keyword or clear your search."
        : "Create an assignment to keep your next deadline in view.";
      empty.append(icon, title, copy);
      if (!DR.state.searchQuery) {
        const add = document.createElement("button");
        add.className = "primary-button";
        add.type = "button";
        add.textContent = "＋ Add assignment";
        add.addEventListener("click", () => DR.openAssignmentDialog());
        empty.append(add);
      }
      list.append(empty);
      return;
    }
    items.forEach((item) => {
      const row = document.createElement("article");
      row.className = `assignment-row${item.completed ? " is-completed" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox assignment-check";
      checkbox.checked = !!item.completed;
      checkbox.setAttribute(
        "aria-label",
        `${item.completed ? "Reopen" : "Complete"} ${item.title}`,
      );
      checkbox.addEventListener("change", () =>
        DR.toggleAssignmentComplete(item.id),
      );
      const main = document.createElement("div");
      main.className = "assignment-main";
      const titleLine = document.createElement("div");
      titleLine.className = "assignment-title-line";
      const title = document.createElement("h3");
      title.textContent = item.title;
      titleLine.append(title);
      const priority = document.createElement("span");
      priority.className = `priority-badge ${item.priority || "medium"}`;
      priority.textContent = `${(item.priority || "medium")[0].toUpperCase()}${(item.priority || "medium").slice(1)} priority`;
      titleLine.append(priority);
      if (item.completed) {
        const badge = document.createElement("span");
        badge.className = "status-badge completed";
        badge.textContent = "Completed";
        titleLine.append(badge);
      } else if (DR.isOverdue(item)) {
        const badge = document.createElement("span");
        badge.className = "status-badge overdue";
        badge.textContent = "Overdue";
        titleLine.append(badge);
      }
      const description = document.createElement("p");
      description.className = "assignment-description";
      description.textContent = item.description || "No extra notes added.";
      const meta = document.createElement("div");
      meta.className = "assignment-meta";
      const subject = document.createElement("span");
      subject.textContent = item.subject;
      const due = document.createElement("span");
      due.textContent = `Due ${DR.formatDate(item.dueDate, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
      const remaining = document.createElement("span");
      if (item.completed) remaining.textContent = "Done";
      else if (DR.isOverdue(item))
        remaining.textContent = `${Math.abs(DR.dayDiff(item.dueDate, DR.todayISO()))} day(s) overdue`;
      else if (item.dueDate === DR.todayISO())
        remaining.textContent = "Due today";
      else
        remaining.textContent = `${DR.dayDiff(DR.todayISO(), item.dueDate)} day(s) left`;
      meta.append(
        subject,
        document.createTextNode("·"),
        due,
        document.createTextNode("·"),
        remaining,
      );
      main.append(titleLine, description, meta);
      const actions = document.createElement("div");
      actions.className = "assignment-actions";
      const edit = document.createElement("button");
      edit.className = "row-action";
      edit.type = "button";
      edit.textContent = "✎";
      edit.setAttribute("aria-label", `Edit ${item.title}`);
      edit.title = "Edit";
      edit.addEventListener("click", () => DR.openAssignmentDialog(item.id));
      const del = document.createElement("button");
      del.className = "row-action";
      del.type = "button";
      del.textContent = "×";
      del.setAttribute("aria-label", `Delete ${item.title}`);
      del.title = "Delete";
      del.addEventListener("click", () => DR.deleteAssignment(item.id));
      actions.append(edit, del);
      row.append(checkbox, main, actions);
      list.append(row);
    });
  };
  DR.initAssignments = function () {
    byId("addAssignmentButton").addEventListener("click", () =>
      DR.openAssignmentDialog(),
    );
    byId("assignmentForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const id = byId("assignmentId").value;
      const input = {
        title: byId("assignmentTitle").value.trim(),
        subject: byId("assignmentSubject").value.trim(),
        description: byId("assignmentDescription").value.trim(),
        dueDate: byId("assignmentDueDate").value,
        priority: byId("assignmentPriority").value,
      };
      const error = byId("assignmentFormError");
      if (
        !input.title ||
        !input.subject ||
        !input.dueDate ||
        !DR.parseDate(input.dueDate)
      ) {
        error.textContent = "Please enter a title, subject and valid due date.";
        return;
      }
      if (id) {
        const item = DR.state.assignments.find((a) => a.id === id);
        if (!item) {
          error.textContent =
            "This assignment could not be found. Close the form and try again.";
          return;
        }
        Object.assign(item, input);
        DR.persistAssignments();
        DR.refreshAll();
        DR.closeDialog("assignmentDialog");
        DR.toast("Assignment updated.");
      } else {
        const created = DR.createAssignment(input);
        if (created) {
          DR.closeDialog("assignmentDialog");
          DR.toast("Assignment created.");
        }
      }
    });
    document.querySelectorAll("[data-assignment-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        DR.state.assignmentFilter = button.dataset.assignmentFilter;
        DR.renderAssignmentManager();
      }),
    );
    byId("assignmentSort").addEventListener(
      "change",
      DR.renderAssignmentManager,
    );
  };
})();
