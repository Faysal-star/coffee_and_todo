const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Connect to SQLite database
const db = new Database("./studytracker.db", { verbose: console.log });

// Create table if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  topic TEXT,
  hours TEXT
)`);

// Prepare statements
const insertEntry = db.prepare(
  "INSERT INTO entries (date, topic, hours) VALUES (?, ?, ?)"
);
const getAllEntries = db.prepare("SELECT * FROM entries");
const updateEntry = db.prepare("UPDATE entries SET hours = ? WHERE id = ?");
const getEntryById = db.prepare("SELECT * FROM entries WHERE id = ?");
const deleteEntry = db.prepare("DELETE FROM entries WHERE id = ?");

app.post("/api/entries", (req, res) => {
  const { date, topic, hours } = req.body;
  try {
    const result = insertEntry.run(date, topic, JSON.stringify(hours));
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/entries", (req, res) => {
  try {
    const entries = getAllEntries.all().map((row) => ({
      ...row,
      hours: JSON.parse(row.hours),
    }));
    res.json(entries);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/entries/:id", (req, res) => {
  const { id } = req.params;
  const { hours } = req.body;

  try {
    // Check if the entry exists
    const entry = getEntryById.get(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Update the entry
    const result = updateEntry.run(JSON.stringify(hours), id);

    if (result.changes > 0) {
      // Fetch the updated entry
      const updatedEntry = getEntryById.get(id);
      res.json({
        ...updatedEntry,
        hours: JSON.parse(updatedEntry.hours),
      });
    } else {
      res.status(400).json({ error: "Failed to update entry" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/entries/:id", (req, res) => {
  const { id } = req.params;

  try {
    // Check if the entry exists
    const entry = getEntryById.get(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Delete the entry
    const result = deleteEntry.run(id);

    if (result.changes > 0) {
      res.json({ id: parseInt(id) });
    } else {
      res.status(400).json({ error: "Failed to delete entry" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Close the database connection when the app is shutting down
process.on("exit", () => db.close());
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));
