/* Subject-wise attendance: each class tap updates the student's own local record. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const $ = (id) => document.getElementById(id);
  const demo = [
    {
      id: "att-dbms",
      name: "Database Management Systems",
      attended: 32,
      total: 40,
      target: 75,
    },
    {
      id: "att-cn",
      name: "Computer Networks",
      attended: 28,
      total: 35,
      target: 75,
    },
    {
      id: "att-os",
      name: "Operating Systems",
      attended: 30,
      total: 38,
      target: 75,
    },
    {
      id: "att-maths",
      name: "Mathematics",
      attended: 29,
      total: 40,
      target: 75,
    },
    {
      id: "att-ai",
      name: "Elective (AI)",
      attended: 18,
      total: 20,
      target: 75,
    },
  ];

  function loadSubjects() {
    const saved = DR.readStorage(DR.keys.subjectAttendance, null);
    if (Array.isArray(saved)) return saved;
    DR.saveStorage(
      DR.keys.subjectAttendance,
      demo.map((item) => ({ ...item })),
    );
    return demo.map((item) => ({ ...item }));
  }
  function saveSubjects(items) {
    return DR.saveStorage(DR.keys.subjectAttendance, items);
  }
  function percent(item) {
    return item.total ? (item.attended / item.total) * 100 : 0;
  }
  function needed(item) {
    if (item.total === 0) return 1;
    if (percent(item) >= item.target) return 0;
    if (item.target >= 100) return null;
    return Math.max(
      0,
      Math.ceil(
        (item.target * item.total - 100 * item.attended) / (100 - item.target),
      ),
    );
  }
  function makeButton(label, className, action, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    if (title) button.title = title;
    button.addEventListener("click", action);
    return button;
  }
  function makeSubjectCard(item) {
    const card = document.createElement("article");
    card.className = "subject-attendance-card";
    const head = document.createElement("div");
    head.className = "subject-attendance-head";
    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const meta = document.createElement("p");
    meta.textContent = `${item.attended} attended · ${item.total - item.attended} missed · ${item.total} total`;
    titleWrap.append(title, meta);
    const score = document.createElement("strong");
    score.className =
      percent(item) < item.target
        ? "attendance-score is-low"
        : "attendance-score";
    score.textContent = `${percent(item).toFixed(1)}%`;
    head.append(titleWrap, score);

    const track = document.createElement("div");
    track.className = "subject-attendance-track";
    const fill = document.createElement("span");
    fill.style.width = `${Math.min(100, percent(item))}%`;
    track.append(fill);

    const note = document.createElement("p");
    note.className = "subject-attendance-advice";
    const count = needed(item);
    note.textContent =
      count === 0
        ? `Target ${item.target}% achieved. Keep it up.`
        : count === null
          ? `A ${item.target}% target cannot be recovered after missed classes.`
          : `Attend the next ${count} class${count === 1 ? "" : "es"} to reach ${item.target}%.`;

    const actions = document.createElement("div");
    actions.className = "subject-attendance-actions";
    actions.append(
      makeButton(
        "+ Present",
        "small-positive",
        () => recordClass(item.id, true),
        "Record one attended class",
      ),
      makeButton(
        "+ Absent",
        "small-negative",
        () => recordClass(item.id, false),
        "Record one missed class",
      ),
      makeButton(
        "Edit",
        "row-action",
        () => editSubject(item.id),
        "Edit subject",
      ),
      makeButton(
        "Delete",
        "row-action danger-text",
        () => deleteSubject(item.id),
        "Delete subject",
      ),
    );
    card.append(head, track, note, actions);
    return card;
  }
  function render() {
    const list = $("subjectAttendanceList");
    if (!list) return;
    const items = loadSubjects();
    list.replaceChildren();
    const totalAttended = items.reduce(
      (sum, item) => sum + Number(item.attended || 0),
      0,
    );
    const totalHeld = items.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );
    const overall = totalHeld ? (totalAttended / totalHeld) * 100 : 0;
    // Show the mean of subject targets as a dashboard reference value.
    const dashboardTarget = items.length
      ? items.reduce((sum, item) => sum + Number(item.target || 75), 0) /
        items.length
      : 75;
    $("subjectAttendanceOverall").textContent = `${overall.toFixed(1)}%`;
    $("subjectAttendanceAttended").textContent = String(totalAttended);
    $("subjectAttendanceMissed").textContent = String(
      totalHeld - totalAttended,
    );
    $("subjectAttendanceTotal").textContent = String(totalHeld);
    $("subjectAttendanceRing").style.setProperty(
      "--attendance",
      String(overall),
    );
    $("subjectAttendanceCount").textContent =
      `${items.length} subject${items.length === 1 ? "" : "s"} tracked`;

    // Keep the small dashboard attendance card connected to the subject records.
    // Each subject can have a different target, so the dashboard does
    // not present an average of targets as if it were a real overall target.
    if ($("attendancePercent"))
      $("attendancePercent").textContent = `${overall.toFixed(1)}%`;
    if ($("attendanceRing"))
      $("attendanceRing").style.setProperty("--attendance", String(overall));
    if ($("classesAttended"))
      $("classesAttended").textContent = String(totalAttended);
    if ($("classesMissed"))
      $("classesMissed").textContent = String(totalHeld - totalAttended);
    if ($("classesTotal")) $("classesTotal").textContent = String(totalHeld);
    if ($("attendanceTargetLabel"))
      $("attendanceTargetLabel").textContent = `${dashboardTarget.toFixed(0)}%`;
    if ($("attendanceAdviceMessage")) {
      $("attendanceAdviceMessage").textContent = items.length
        ? `Combined attendance across ${items.length} subjects. Open Manage subjects for individual targets.`
        : "Add subjects to begin tracking attendance.";
    }
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const title = document.createElement("h3");
      title.textContent = "No subjects tracked yet";
      const text = document.createElement("p");
      text.textContent = "Add a subject to start recording attendance.";
      empty.append(title, text);
      list.append(empty);
      return;
    }
    items.forEach((item) => list.append(makeSubjectCard(item)));
  }
  function recordClass(id, present) {
    const items = loadSubjects();
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    item.total += 1;
    if (present) item.attended += 1;
    if (!saveSubjects(items)) return;
    render();
    DR.toast(
      present
        ? `Present recorded for ${item.name}.`
        : `Absent recorded for ${item.name}.`,
    );
  }
  function resetForm() {
    $("subjectAttendanceForm").reset();
    $("subjectAttendanceId").value = "";
    $("subjectAttendanceTarget").value = "75";
    $("subjectAttendanceFormTitle").textContent = "Add subject";
    $("subjectAttendanceFormError").textContent = "";
  }
  function openForm(id = "") {
    resetForm();
    if (id) {
      const item = loadSubjects().find((entry) => entry.id === id);
      if (!item) return;
      $("subjectAttendanceId").value = item.id;
      $("subjectAttendanceName").value = item.name;
      $("subjectAttendanceAttendedInput").value = item.attended;
      $("subjectAttendanceTotalInput").value = item.total;
      $("subjectAttendanceTarget").value = item.target;
      $("subjectAttendanceFormTitle").textContent = "Edit subject attendance";
    }
    DR.openDialog("subjectAttendanceDialog");
  }
  function editSubject(id) {
    openForm(id);
  }
  function deleteSubject(id) {
    const items = loadSubjects();
    const item = items.find((entry) => entry.id === id);
    if (!item || !window.confirm(`Remove attendance records for ${item.name}?`))
      return;
    if (!saveSubjects(items.filter((entry) => entry.id !== id))) return;
    render();
    DR.toast("Subject attendance removed.");
  }
  function submitForm(event) {
    event.preventDefault();
    const id = $("subjectAttendanceId").value;
    const name = $("subjectAttendanceName").value.trim();
    const attended = Number($("subjectAttendanceAttendedInput").value);
    const total = Number($("subjectAttendanceTotalInput").value);
    const target = Number($("subjectAttendanceTarget").value);
    const error = $("subjectAttendanceFormError");
    error.textContent = "";
    if (
      !name ||
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      attended < 0 ||
      total < 0 ||
      attended > total ||
      !Number.isFinite(target) ||
      target < 1 ||
      target > 100
    ) {
      error.textContent =
        "Enter a subject name, valid class counts (attended cannot exceed total) and a target from 1% to 100%.";
      return;
    }
    const items = loadSubjects();
    if (
      items.some(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() && item.id !== id,
      )
    ) {
      error.textContent = "That subject is already being tracked.";
      return;
    }
    const record = {
      id: id || `att-${Date.now().toString(36)}`,
      name,
      attended,
      total,
      target,
    };
    const updated = id
      ? items.map((item) => (item.id === id ? record : item))
      : [...items, record];
    if (!saveSubjects(updated)) return;
    DR.closeDialog("subjectAttendanceDialog");
    render();
    DR.toast(
      id
        ? "Attendance details updated."
        : "Subject added to attendance tracker.",
    );
  }
  DR.renderSubjectAttendance = render;
  DR.initAttendanceTracker = function () {
    loadSubjects();
    $("addAttendanceSubjectButton").addEventListener("click", () => openForm());
    $("manageSubjectAttendanceButton").addEventListener("click", () =>
      DR.navigate("attendance-page"),
    );
    $("subjectAttendanceForm").addEventListener("submit", submitForm);
    render();
  };
})();
