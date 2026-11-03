/* Notes manager: notes are private to the signed-in browser account. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const $ = (id) => document.getElementById(id);
  function getNotes() {
    const notes = DR.readStorage(DR.keys.notes, []);
    return Array.isArray(notes) ? notes : [];
  }
  function saveNotes(notes) {
    return DR.saveStorage(DR.keys.notes, notes);
  }
  function escDate(value) {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime())
      ? "Recently updated"
      : date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }
  function makeNoteCard(note) {
    const card = document.createElement("article");
    card.className = "note-card";
    const top = document.createElement("div");
    top.className = "note-card-top";
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = note.title;
    const subject = document.createElement("span");
    subject.className = "note-subject";
    subject.textContent = note.subject || "General";
    heading.append(title, subject);
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "row-action";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openNoteForm(note.id));
    top.append(heading, edit);
    const content = document.createElement("p");
    content.className = "note-preview";
    content.textContent = note.content;
    const footer = document.createElement("div");
    footer.className = "note-card-footer";
    const tags = document.createElement("span");
    tags.className = "note-tags";
    tags.textContent = (note.tags || []).map((tag) => `#${tag}`).join("  ");
    const updated = document.createElement("small");
    updated.textContent = `Updated ${escDate(note.updatedAt)}`;
    footer.append(tags, updated);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "note-delete-button";
    remove.textContent = "Delete note";
    remove.addEventListener("click", () => deleteNote(note.id));
    card.append(top, content, footer, remove);
    return card;
  }
  function render() {
    const list = $("notesList");
    if (!list) return;
    const query = ($("notesSearch")?.value || "").trim().toLowerCase();
    const notes = getNotes()
      .filter(
        (note) =>
          !query ||
          [note.title, note.subject, note.content, ...(note.tags || [])]
            .join(" ")
            .toLowerCase()
            .includes(query),
      )
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    list.replaceChildren();
    $("notesCount").textContent =
      `${notes.length} note${notes.length === 1 ? "" : "s"}`;
    if (!notes.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const title = document.createElement("h3");
      title.textContent = query
        ? "No notes match your search"
        : "Your notebook is empty";
      const copy = document.createElement("p");
      copy.textContent = query
        ? "Try another word or clear the search."
        : "Create your first subject note to keep useful concepts in one place.";
      const add = document.createElement("button");
      add.type = "button";
      add.className = "primary-button";
      add.textContent = "+ Create note";
      add.addEventListener("click", () => openNoteForm());
      empty.append(title, copy, add);
      list.append(empty);
      return;
    }
    notes.forEach((note) => list.append(makeNoteCard(note)));
  }
  function openNoteForm(id = "") {
    $("noteForm").reset();
    $("noteId").value = "";
    $("noteFormError").textContent = "";
    $("noteDialogTitle").textContent = "Create a note";
    if (id) {
      const note = getNotes().find((item) => item.id === id);
      if (!note) return;
      $("noteId").value = note.id;
      $("noteTitle").value = note.title;
      $("noteSubject").value = note.subject || "";
      $("noteTags").value = (note.tags || []).join(", ");
      $("noteContent").value = note.content;
      $("noteDialogTitle").textContent = "Edit note";
    }
    DR.openDialog("noteDialog");
    window.setTimeout(() => $("noteTitle").focus(), 30);
  }
  function deleteNote(id) {
    const note = getNotes().find((item) => item.id === id);
    if (!note || !window.confirm(`Delete the note “${note.title}”?`)) return;
    saveNotes(getNotes().filter((item) => item.id !== id));
    render();
    DR.toast("Note deleted.");
  }
  function submitNote(event) {
    event.preventDefault();
    const id = $("noteId").value;
    const title = $("noteTitle").value.trim();
    const subject = $("noteSubject").value.trim();
    const content = $("noteContent").value.trim();
    const tags = $("noteTags")
      .value.split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10);
    if (!title || !content) {
      $("noteFormError").textContent =
        "A note title and note content are required.";
      return;
    }
    const notes = getNotes();
    const existing = notes.find((note) => note.id === id);
    const note = {
      id: id || `note-${Date.now().toString(36)}`,
      title,
      subject: subject || "General",
      content,
      tags,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = id
      ? notes.map((item) => (item.id === id ? note : item))
      : [note, ...notes];
    if (!saveNotes(updated)) return;
    DR.closeDialog("noteDialog");
    render();
    DR.toast(id ? "Note updated." : "Note saved.");
  }
  DR.searchNotes = (query) =>
    getNotes().filter((note) =>
      [note.title, note.subject, note.content, ...(note.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(String(query || "").toLowerCase()),
    );
  DR.renderNotes = render;
  DR.initNotes = function () {
    $("addNoteButton").addEventListener("click", () => openNoteForm());
    $("notesSearch").addEventListener("input", render);
    $("noteForm").addEventListener("submit", submitNote);
    render();
  };
})();
