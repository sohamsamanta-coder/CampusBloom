/* Academic tools: editable timetable, attendance and MAKAUT SGPA calculator. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const byId = (id) => document.getElementById(id);
  const demoTimetable = [
    {
      day: "Mon",
      start: "09:00",
      end: "10:00",
      subject: "Database Management Systems",
      room: "Room 101",
      color: "#4f8ee8",
    },
    {
      day: "Mon",
      start: "10:00",
      end: "11:00",
      subject: "Computer Networks",
      room: "Room 202",
      color: "#16a34a",
    },
    {
      day: "Mon",
      start: "11:30",
      end: "12:30",
      subject: "Operating Systems",
      room: "Room 203",
      color: "#f59e0b",
    },
    {
      day: "Mon",
      start: "14:00",
      end: "15:00",
      subject: "Mathematics",
      room: "Room 101",
      color: "#e64775",
    },
    {
      day: "Mon",
      start: "15:00",
      end: "16:00",
      subject: "Elective (AI)",
      room: "Room 204",
      color: "#8b5cf6",
    },
    {
      day: "Tue",
      start: "09:30",
      end: "10:30",
      subject: "Database Management Systems",
      room: "Room 101",
      color: "#4f8ee8",
    },
    {
      day: "Tue",
      start: "11:00",
      end: "12:00",
      subject: "Mathematics",
      room: "Room 105",
      color: "#e64775",
    },
    {
      day: "Tue",
      start: "14:00",
      end: "15:00",
      subject: "Computer Networks",
      room: "Lab 2",
      color: "#16a34a",
    },
    {
      day: "Wed",
      start: "10:00",
      end: "11:00",
      subject: "Operating Systems",
      room: "Room 203",
      color: "#f59e0b",
    },
    {
      day: "Wed",
      start: "12:00",
      end: "13:00",
      subject: "Elective (AI)",
      room: "Room 204",
      color: "#8b5cf6",
    },
    {
      day: "Thu",
      start: "09:00",
      end: "10:00",
      subject: "Mathematics",
      room: "Room 105",
      color: "#e64775",
    },
    {
      day: "Thu",
      start: "11:00",
      end: "12:00",
      subject: "Database Management Systems",
      room: "Room 101",
      color: "#4f8ee8",
    },
    {
      day: "Fri",
      start: "10:00",
      end: "11:00",
      subject: "Computer Networks Lab",
      room: "Lab 2",
      color: "#16a34a",
    },
    {
      day: "Fri",
      start: "13:00",
      end: "14:00",
      subject: "Operating Systems",
      room: "Room 203",
      color: "#f59e0b",
    },
  ].map((item, index) => ({
    id: `demo-class-${index + 1}`,
    ...item,
  }));
  DR.makeDemoTimetable = () => demoTimetable.map((item) => ({ ...item }));
  // Sunday-first order matches the calendar and the browser Date API.
  const weekKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MAKAUT_GRADES = Object.freeze({
    O: {
      points: 10,
      label: "Outstanding",
    },
    E: {
      points: 9,
      label: "Excellent",
    },
    A: {
      points: 8,
      label: "Very Good",
    },
    B: {
      points: 7,
      label: "Good",
    },
    C: {
      points: 6,
      label: "Fair",
    },
    D: {
      points: 5,
      label: "Below Average",
    },
    F: {
      points: 2,
      label: "Failed",
    },
    I: {
      points: 2,
      label: "Incomplete",
    },
  });
  function gradeFromPoints(points) {
    const numeric = Number(points);
    if (!Number.isFinite(numeric)) return "A";
    return ["O", "E", "A", "B", "C", "D", "F"].reduce(
      (best, grade) =>
        Math.abs(MAKAUT_GRADES[grade].points - numeric) <
        Math.abs(MAKAUT_GRADES[best].points - numeric)
          ? grade
          : best,
      "O",
    );
  }
  function normalizeGradeSubject(subject = {}) {
    const rawGrade = String(subject.grade || "").toUpperCase();
    const grade = Object.prototype.hasOwnProperty.call(MAKAUT_GRADES, rawGrade)
      ? rawGrade
      : gradeFromPoints(subject.gradePoint);
    const numericCredits = Number(subject.credits);
    return {
      ...subject,
      id:
        subject.id ||
        `subject-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: String(subject.name || ""),
      credits:
        Number.isFinite(numericCredits) && numericCredits > 0
          ? numericCredits
          : 3,
      grade,
      gradePoint: MAKAUT_GRADES[grade].points,
    };
  }
  const letterForPoint = (point) => gradeFromPoints(point);
  let selectedSemester = "3";
  function toMinutes(value) {
    if (!value) return 0;
    const normalized = String(value).trim();
    const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (twelveHour) {
      let hour = Number(twelveHour[1]) % 12;
      if (twelveHour[3].toUpperCase() === "PM") hour += 12;
      return hour * 60 + Number(twelveHour[2]);
    }
    const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);
    return twentyFourHour
      ? Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2])
      : 0;
  }
  function formatTime(value) {
    const minutes = toMinutes(value);
    const hour24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${suffix}`;
  }
  const dayNames = {
    Sun: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
  };
  function sortedTimetable() {
    return [...(DR.state.timetable || [])].sort(
      (a, b) =>
        weekKeys.indexOf(a.day) - weekKeys.indexOf(b.day) ||
        toMinutes(a.start) - toMinutes(b.start),
    );
  }
  DR.renderTimetable = function () {
    const list = byId("timetableList");
    if (!list) return;
    const selected = byId("timetableDay").value;
    const day = selected === "today" ? weekKeys[new Date().getDay()] : selected;
    const entries = (DR.state.timetable || [])
      .filter((item) => item.day === day)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    list.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const title = document.createElement("h3");
      title.textContent =
        selected === "today"
          ? "No classes today"
          : `No classes on ${dayNames[day] || day}`;
      const p = document.createElement("p");
      p.textContent =
        "Enjoy the extra time or add classes with Edit Timetable.";
      const add = document.createElement("button");
      add.type = "button";
      add.className = "secondary-button";
      add.textContent = "＋ Add a class";
      add.addEventListener("click", () => openTimetableEditor());
      empty.append(title, p, add);
      list.append(empty);
      return;
    }
    entries.slice(0, 6).forEach((item) => {
      const row = document.createElement("div");
      row.className = "class-row";
      const bar = document.createElement("span");
      bar.className = "class-bar";
      bar.style.setProperty("--class-color", item.color || "#76b900");
      const time = document.createElement("span");
      time.className = "class-time";
      time.textContent = `${formatTime(item.start)}\n${formatTime(item.end)}`;
      time.style.whiteSpace = "pre-line";
      const info = document.createElement("div");
      info.className = "class-info";
      const subject = document.createElement("strong");
      subject.textContent = item.subject;
      const room = document.createElement("small");
      room.textContent = item.room;
      info.append(subject, room);
      const chip = document.createElement("span");
      chip.className = "day-chip";
      chip.textContent = item.day;
      row.append(bar, time, info, chip);
      list.append(row);
    });
    if (entries.length > 6) {
      const more = document.createElement("p");
      more.className = "timetable-more-note";
      more.textContent = `+ ${entries.length - 6} more ${entries.length - 6 === 1 ? "class" : "classes"} — use Edit to manage your full schedule.`;
      list.append(more);
    }
  };
  function createTimetableEditorRow(item) {
    const row = document.createElement("div");
    row.className = "timetable-editor-row";
    const color = document.createElement("span");
    color.className = "timetable-editor-color";
    color.style.background = item.color || "#76b900";
    const copy = document.createElement("div");
    copy.className = "timetable-editor-copy";
    const top = document.createElement("div");
    top.className = "timetable-editor-top";
    const subject = document.createElement("strong");
    subject.textContent = item.subject;
    const day = document.createElement("span");
    day.className = "timetable-editor-day";
    day.textContent = dayNames[item.day] || item.day;
    top.append(subject, day);
    const meta = document.createElement("small");
    meta.textContent = `${formatTime(item.start)}–${formatTime(item.end)} · ${item.room}`;
    copy.append(top, meta);
    const actions = document.createElement("div");
    actions.className = "timetable-editor-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "row-action";
    edit.textContent = "✎";
    edit.setAttribute("aria-label", `Edit ${item.subject}`);
    edit.title = "Edit class";
    edit.addEventListener("click", () => startEditTimetableEntry(item.id));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "row-action timetable-delete-action";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${item.subject}`);
    remove.title = "Delete class";
    remove.addEventListener("click", () => deleteTimetableEntry(item.id));
    actions.append(edit, remove);
    row.append(color, copy, actions);
    return row;
  }
  function renderTimetableEditorList() {
    const list = byId("timetableEditorList");
    if (!list) return;
    list.replaceChildren();
    const items = sortedTimetable();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "timetable-editor-empty";
      empty.textContent =
        "Your timetable is empty. Use the form below to add your first class.";
      list.append(empty);
      return;
    }
    const summary = document.createElement("p");
    summary.className = "timetable-editor-summary";
    summary.textContent = `${items.length} ${items.length === 1 ? "class" : "classes"} in your schedule`;
    list.append(summary);
    items.forEach((item) => list.append(createTimetableEditorRow(item)));
  }
  function resetTimetableEntryForm() {
    byId("timetableEntryForm").reset();
    byId("timetableEntryId").value = "";
    byId("timetableEntryDay").value = "Mon";
    byId("timetableStartInput").value = "09:00";
    byId("timetableEndInput").value = "10:00";
    byId("timetableColorInput").value = "#4f8ee8";
    byId("timetableEntryFormHeading").textContent = "Add a class";
    byId("saveTimetableEntryButton").textContent = "＋ Add class";
    byId("cancelTimetableEditButton").hidden = true;
    byId("timetableFormError").textContent = "";
  }
  function openTimetableEditor() {
    resetTimetableEntryForm();
    renderTimetableEditorList();
    DR.openDialog("timetableDialog");
  }
  function startEditTimetableEntry(id) {
    const item = (DR.state.timetable || []).find((entry) => entry.id === id);
    if (!item) return;
    byId("timetableEntryId").value = item.id;
    byId("timetableSubjectInput").value = item.subject;
    byId("timetableRoomInput").value = item.room;
    byId("timetableEntryDay").value = item.day;
    byId("timetableStartInput").value = toTimeInput(item.start);
    byId("timetableEndInput").value = toTimeInput(item.end);
    byId("timetableColorInput").value = /^#[0-9a-f]{6}$/i.test(item.color || "")
      ? item.color
      : "#76b900";
    byId("timetableEntryFormHeading").textContent = "Edit class";
    byId("saveTimetableEntryButton").textContent = "Save changes";
    byId("cancelTimetableEditButton").hidden = false;
    byId("timetableFormError").textContent = "";
    byId("timetableSubjectInput").focus();
  }
  function toTimeInput(value) {
    const minutes = toMinutes(value);
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }
  function deleteTimetableEntry(id) {
    const item = (DR.state.timetable || []).find((entry) => entry.id === id);
    if (!item) return;
    if (
      !window.confirm(`Delete the class “${item.subject}” from your timetable?`)
    )
      return;
    DR.state.timetable = DR.state.timetable.filter((entry) => entry.id !== id);
    DR.saveStorage(DR.keys.timetable, DR.state.timetable);
    if (byId("timetableEntryId").value === id) resetTimetableEntryForm();
    renderTimetableEditorList();
    DR.renderTimetable();
    DR.toast("Class removed from your timetable.");
  }
  function saveTimetableEntry(event) {
    event.preventDefault();
    const id = byId("timetableEntryId").value;
    const subject = byId("timetableSubjectInput").value.trim();
    const room = byId("timetableRoomInput").value.trim();
    const day = byId("timetableEntryDay").value;
    const start = byId("timetableStartInput").value;
    const end = byId("timetableEndInput").value;
    const color = byId("timetableColorInput").value || "#76b900";
    const error = byId("timetableFormError");
    if (!subject || !room || !start || !end) {
      error.textContent = "Enter a subject, room and both class times.";
      return;
    }
    if (toMinutes(end) <= toMinutes(start)) {
      error.textContent = "End time must be later than start time.";
      return;
    }
    const collision = (DR.state.timetable || []).some(
      (item) =>
        item.id !== id &&
        item.day === day &&
        toMinutes(start) < toMinutes(item.end) &&
        toMinutes(end) > toMinutes(item.start),
    );
    if (collision) {
      error.textContent =
        "This time overlaps another class on the selected day. Check your timetable and try again.";
      return;
    }
    const entry = {
      id:
        id ||
        `class-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      day,
      start,
      end,
      subject,
      room,
      color,
    };
    if (id)
      DR.state.timetable = DR.state.timetable.map((item) =>
        item.id === id ? entry : item,
      );
    else DR.state.timetable.push(entry);
    if (!DR.saveStorage(DR.keys.timetable, DR.state.timetable)) return;
    resetTimetableEntryForm();
    renderTimetableEditorList();
    DR.renderTimetable();
    DR.toast(id ? "Class updated." : "Class added to your timetable.");
  }
  DR.attendancePercent = function () {
    const { attended, total } = DR.state.attendance;
    return total > 0 ? (attended / total) * 100 : 0;
  };
  DR.classesNeeded = function () {
    const { attended, total, target } = DR.state.attendance;
    const percent = total > 0 ? (attended / total) * 100 : 0;
    if (total > 0 && percent >= target) return 0;
    if (target >= 100) return attended === total && total > 0 ? 0 : null;
    if (total === 0) return 1;
    return Math.max(
      0,
      Math.ceil((target * total - 100 * attended) / (100 - target)),
    );
  };
  DR.renderAttendance = function () {
    const { attended, total, target } = DR.state.attendance;
    const percent = DR.attendancePercent();
    byId("attendancePercent").textContent = `${percent.toFixed(1)}%`;
    byId("attendanceRing").style.setProperty(
      "--attendance",
      String(Math.min(100, Math.max(0, percent))),
    );
    byId("classesAttended").textContent = attended;
    byId("classesMissed").textContent = Math.max(0, total - attended);
    byId("classesTotal").textContent = total;
    byId("attendanceTargetLabel").textContent = `${target}%`;
    const message = byId("attendanceAdviceMessage");
    if (total > 0 && percent >= target) {
      message.textContent = "You are meeting your target. Keep it up!";
    } else if (target === 100 && attended < total) {
      message.textContent =
        "A 100% target cannot be recovered after missed classes.";
    } else {
      const needed = DR.classesNeeded();
      message.textContent = `Attend the next ${needed} class${needed === 1 ? "" : "es"} to reach your target.`;
    }
  };
  // MAKAUT SGPA is the credit-weighted average of a semester’s grade points.
  DR.calculateSGPA = function (subjects = DR.state.cgpaSubjects) {
    const valid = (Array.isArray(subjects) ? subjects : [])
      .map(normalizeGradeSubject)
      .filter(
        (subject) =>
          subject.name.trim() &&
          Number.isFinite(subject.credits) &&
          subject.credits > 0,
      );
    const totalCredits = valid.reduce(
      (sum, subject) => sum + subject.credits,
      0,
    );
    if (!totalCredits) return null;
    const creditPoints = valid.reduce(
      (sum, subject) =>
        sum + subject.credits * MAKAUT_GRADES[subject.grade].points,
      0,
    );
    return creditPoints / totalCredits;
  };
  DR.renderCGPA = function () {
    const subjects = (DR.state.cgpaSubjects || []).map(normalizeGradeSubject);
    DR.state.cgpaSubjects = subjects;
    const score = byId("cgpaValue");
    const list = byId("cgpaSubjectList");
    const sgpa = DR.calculateSGPA(subjects);
    score.textContent = sgpa === null ? "—" : sgpa.toFixed(2);
    list.replaceChildren();
    if (!subjects.length) {
      const empty = document.createElement("p");
      empty.className = "sgpa-empty";
      empty.textContent =
        "No grades entered for this semester yet. Select “Enter grades & calculate SGPA” to add subjects.";
      list.append(empty);
      return;
    }
    subjects.slice(0, 5).forEach((subject) => {
      const row = document.createElement("div");
      row.className = "cgpa-subject-row";
      const name = document.createElement("span");
      name.textContent = subject.name;
      const credits = document.createElement("span");
      credits.className = "credit-value";
      credits.textContent = subject.credits;
      const grade = document.createElement("span");
      grade.className = "grade-letter";
      grade.textContent = subject.grade;
      grade.title = `${MAKAUT_GRADES[subject.grade].label} — ${MAKAUT_GRADES[subject.grade].points} grade points`;
      row.append(name, credits, grade);
      list.append(row);
    });
    if (subjects.length > 5) {
      const note = document.createElement("p");
      note.className = "sgpa-more-note";
      note.textContent = `Showing 5 of ${subjects.length} subjects. Use the editor to view all grades.`;
      list.append(note);
    }
  };
  DR.renderAcademicDashboard = function () {
    DR.renderAttendance();
    DR.renderCGPA();
    DR.renderTimetable();
  };
  function editorRow(
    subject = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name: "",
      credits: 3,
      grade: "A",
      gradePoint: 8,
    },
  ) {
    const normalized = normalizeGradeSubject(subject);
    const row = document.createElement("div");
    row.className = "cgpa-editor-row";
    row.dataset.subjectId = normalized.id;
    const name = document.createElement("input");
    name.type = "text";
    name.required = true;
    name.maxLength = 70;
    name.placeholder = "Subject name";
    name.value = normalized.name;
    name.setAttribute("aria-label", "Subject name");
    const credits = document.createElement("input");
    credits.type = "number";
    credits.required = true;
    credits.min = "0.1";
    credits.max = "30";
    credits.step = "0.1";
    credits.value = normalized.credits;
    credits.setAttribute("aria-label", "Credits");
    const grade = document.createElement("select");
    grade.required = true;
    grade.setAttribute("aria-label", "MAKAUT letter grade");
    Object.entries(MAKAUT_GRADES).forEach(([letter, detail]) => {
      const option = document.createElement("option");
      option.value = letter;
      option.textContent = `${letter} (${detail.points})`;
      option.title = detail.label;
      grade.append(option);
    });
    grade.value = normalized.grade;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-subject";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${normalized.name || "subject"}`);
    remove.addEventListener("click", () => row.remove());
    row.append(name, credits, grade, remove);
    return row;
  }
  function openCGPAEditor() {
    byId("cgpaFormError").textContent = "";
    const rows = byId("cgpaEditorRows");
    rows.replaceChildren();
    const subjects = DR.state.cgpaSubjects || [];
    if (subjects.length)
      subjects.forEach((subject) => rows.append(editorRow(subject)));
    else rows.append(editorRow());
    DR.openDialog("cgpaDialog");
  }
  function saveCGPAForSemester(subjects, semester) {
    DR.saveStorage(`${DR.keys.cgpaSubjects}_S${semester}`, subjects);
    DR.saveStorage(DR.keys.cgpaSubjects, subjects);
    DR.saveStorage(DR.keys.semester, semester);
  }
  DR.reloadAcademicData = function () {
    selectedSemester = String(DR.readStorage(DR.keys.semester, "3"));
    if (!["1", "2", "3", "4", "5", "6"].includes(selectedSemester))
      selectedSemester = "3";
    const stored = DR.readStorage(
      `${DR.keys.cgpaSubjects}_S${selectedSemester}`,
      null,
    );
    if (Array.isArray(stored)) {
      DR.state.cgpaSubjects = stored.map(normalizeGradeSubject);
    } else if (selectedSemester === "3") {
      const baseSubjects =
        Array.isArray(DR.state.cgpaSubjects) && DR.state.cgpaSubjects.length
          ? DR.state.cgpaSubjects
          : DR.makeDemoSubjects();
      DR.state.cgpaSubjects = baseSubjects.map(normalizeGradeSubject);
    } else {
      DR.state.cgpaSubjects = [];
    }
    byId("semesterSelect").value = selectedSemester;
    saveCGPAForSemester(DR.state.cgpaSubjects, selectedSemester);
  };
  function switchSemester(next) {
    saveCGPAForSemester(DR.state.cgpaSubjects, selectedSemester);
    selectedSemester = next;
    const stored = DR.readStorage(`${DR.keys.cgpaSubjects}_S${next}`, null);
    if (Array.isArray(stored)) {
      DR.state.cgpaSubjects = stored.map(normalizeGradeSubject);
    } else if (next === "3") {
      const base = DR.readStorage(DR.keys.cgpaSubjects, null);
      const fallback =
        Array.isArray(base) && base.length ? base : DR.makeDemoSubjects();
      DR.state.cgpaSubjects = fallback.map(normalizeGradeSubject);
    } else {
      DR.state.cgpaSubjects = [];
    }
    byId("semesterSelect").value = next;
    saveCGPAForSemester(DR.state.cgpaSubjects, next);
    DR.renderCGPA();
  }
  DR.initAcademic = function () {
    byId("timetableDay").value = "today";
    byId("timetableDay").addEventListener("change", DR.renderTimetable);
    byId("editTimetableButton").addEventListener("click", openTimetableEditor);
    byId("timetableEntryForm").addEventListener("submit", saveTimetableEntry);
    byId("cancelTimetableEditButton").addEventListener(
      "click",
      resetTimetableEntryForm,
    );
    // The dashboard attendance edit control opens the subject-wise tracker.
    byId("editAttendanceButton").addEventListener("click", () => {
      DR.navigate("attendance-page");
    });
    byId("attendanceForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const attended = Number(byId("attendanceAttendedInput").value);
      const total = Number(byId("attendanceTotalInput").value);
      const target = Number(byId("attendanceTargetInput").value);
      const error = byId("attendanceFormError");
      if (
        !Number.isInteger(total) ||
        total < 0 ||
        !Number.isInteger(attended) ||
        attended < 0 ||
        attended > total ||
        !Number.isFinite(target) ||
        target < 1 ||
        target > 100
      ) {
        error.textContent =
          "Enter whole, non-negative class counts (attended cannot exceed total) and a target from 1% to 100%.";
        return;
      }
      DR.state.attendance = {
        attended,
        total,
        target: Math.round(target * 10) / 10,
      };
      DR.saveStorage(DR.keys.attendance, DR.state.attendance);
      DR.renderAttendance();
      DR.closeDialog("attendanceDialog");
      DR.toast("Attendance updated.");
    });
    DR.reloadAcademicData();
    byId("semesterSelect").addEventListener("change", (event) =>
      switchSemester(event.target.value),
    );
    byId("editCgpaButton").addEventListener("click", openCGPAEditor);
    byId("addCgpaSubject").addEventListener("click", () =>
      byId("cgpaEditorRows").append(editorRow()),
    );
    byId("cgpaForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const error = byId("cgpaFormError");
      error.textContent = "";
      const rows = [
        ...byId("cgpaEditorRows").querySelectorAll(".cgpa-editor-row"),
      ];
      if (!rows.length) {
        error.textContent = "Add at least one subject to calculate SGPA.";
        return;
      }
      const subjects = [];
      for (const row of rows) {
        const inputs = [...row.querySelectorAll("input, select")];
        const name = inputs[0].value.trim();
        const credits = Number(inputs[1].value);
        const grade = inputs[2].value;
        const gradePoint = MAKAUT_GRADES[grade]?.points;
        if (
          !name ||
          !Number.isFinite(credits) ||
          credits <= 0 ||
          credits > 30 ||
          !Number.isFinite(gradePoint)
        ) {
          error.textContent =
            "Enter a subject name, positive credits (up to 30), and a valid MAKAUT letter grade.";
          return;
        }
        subjects.push({
          id:
            row.dataset.subjectId ||
            `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          credits,
          grade,
          gradePoint,
        });
      }
      DR.state.cgpaSubjects = subjects;
      saveCGPAForSemester(subjects, selectedSemester);
      DR.renderCGPA();
      DR.closeDialog("cgpaDialog");
      DR.toast(`Semester ${selectedSemester} SGPA calculated.`);
    });
  };
})();
