const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Vercel's filesystem is read-only except /tmp, so use /tmp there.
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "notes.json");

async function readNotes() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeNotes(notes) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2));
}

// GET /notes - list all notes (newest first)
app.get("/notes", async (req, res) => {
  try {
    const notes = await readNotes();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to read notes" });
  }
});

// POST /notes - create a note
app.post("/notes", async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    const content = (req.body.content || "").trim();

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const note = {
      id: crypto.randomUUID(),
      title: title.slice(0, 100),
      content: content.slice(0, 2000),
      createdAt: new Date().toISOString(),
    };

    const notes = await readNotes();
    notes.unshift(note);
    await writeNotes(notes);

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to save note" });
  }
});

// DELETE /notes/:id - delete one note
app.delete("/notes/:id", async (req, res) => {
  try {
    const notes = await readNotes();
    const remaining = notes.filter((n) => n.id !== req.params.id);

    if (remaining.length === notes.length) {
      return res.status(404).json({ error: "Note not found" });
    }

    await writeNotes(remaining);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// DELETE /notes - delete all notes
app.delete("/notes", async (req, res) => {
  try {
    await writeNotes([]);
    res.json({ message: "All notes deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notes" });
  }
});

// Run locally; on Vercel the exported app is used instead.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;