const form = document.getElementById("note-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const notesEl = document.getElementById("notes");
const emptyEl = document.getElementById("empty");
const countEl = document.getElementById("count");
const messageEl = document.getElementById("message");

function showMessage(text) {
  messageEl.textContent = text;
  if (text) setTimeout(() => (messageEl.textContent = ""), 4000);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function renderNotes(notes) {
  notesEl.innerHTML = "";
  countEl.textContent = notes.length;
  emptyEl.hidden = notes.length > 0;
  clearBtn.hidden = notes.length === 0;

  notes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "card note";

    const title = document.createElement("h3");
    title.textContent = note.title; // textContent prevents XSS

    const content = document.createElement("p");
    content.textContent = note.content;

    const meta = document.createElement("div");
    meta.className = "meta";

    const date = document.createElement("span");
    date.textContent = new Date(note.createdAt).toLocaleString();

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteNote(note.id));

    meta.append(date, del);
    card.append(title, content, meta);
    notesEl.appendChild(card);
  });
}

async function loadNotes() {
  try {
    const notes = await api("/notes");
    renderNotes(notes);
  } catch (err) {
    showMessage(err.message);
  }
}

async function addNote(e) {
  e.preventDefault();
  addBtn.disabled = true;
  try {
    await api("/notes", {
      method: "POST",
      body: JSON.stringify({
        title: titleInput.value,
        content: contentInput.value,
      }),
    });
    form.reset();
    titleInput.focus();
    await loadNotes();
  } catch (err) {
    showMessage(err.message);
  } finally {
    addBtn.disabled = false;
  }
}

async function deleteNote(id) {
  try {
    await api(`/notes/${id}`, { method: "DELETE" });
    await loadNotes();
  } catch (err) {
    showMessage(err.message);
  }
}

async function clearAll() {
  if (!confirm("Delete all notes? This cannot be undone.")) return;
  try {
    await api("/notes", { method: "DELETE" });
    await loadNotes();
  } catch (err) {
    showMessage(err.message);
  }
}

form.addEventListener("submit", addNote);
clearBtn.addEventListener("click", clearAll);
loadNotes();