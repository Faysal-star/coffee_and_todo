const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = new Database("./studytracker.db", { verbose: console.log });

db.exec(`CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  topic TEXT,
  hours TEXT
)`);

// db.exec(`DROP TABLE todos`);
db.exec(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    completed TEXT
)`);


const insertEntry = db.prepare(
  "INSERT INTO entries (date, topic, hours) VALUES (?, ?, ?)"
);
const getAllEntries = db.prepare("SELECT * FROM entries");
const updateEntry = db.prepare("UPDATE entries SET hours = ? WHERE id = ?");
const getEntryById = db.prepare("SELECT * FROM entries WHERE id = ?");
const deleteEntry = db.prepare("DELETE FROM entries WHERE id = ?");
const getTodoById = db.prepare("SELECT * FROM todos WHERE id = ?");
const getAllTodos = db.prepare("SELECT * FROM todos");
const insertTodo = db.prepare(
  "INSERT INTO todos (text, completed) VALUES (?, ?)"
);
const updateTodo = db.prepare("UPDATE todos SET completed = ? WHERE id = ?");
const deleteTodo = db.prepare("DELETE FROM todos WHERE id = ?");

// Study Tracker Routes
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
    const entry = getEntryById.get(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    const result = updateEntry.run(JSON.stringify(hours), id);

    if (result.changes > 0) {
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
    const entry = getEntryById.get(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
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


// Todo Routes
app.post("/api/todos", (req, res) => {
    const { text, completed } = req.body;
    try {
        const completedT = completed ? "true" : "false";
        console.log(text, completed);
        const result = insertTodo.run(text, completedT);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
    }
);

app.get("/api/todos", (req, res) => {
    try {
        const todos = getAllTodos.all();
        todos.forEach((todo) => {
            todo.completed = todo.completed === "true";
        });
        res.json(todos);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/todos/:id", (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    // console.log(id , completed);
    try {
        const todo = getTodoById.get(id);
        const completedT = completed ? "true" : "false";
        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }
        const result = updateTodo.run(completedT, id);

        if (result.changes > 0) {
            const updatedTodo = getTodoById.get(id);
            res.json(updatedTodo);
        } else {
            res.status(400).json({ error: "Failed to update todo" });
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/todos/:id", (req, res) => {
    const { id } = req.params;

    try {
        const todo = getTodoById.get(id);
        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }
        const result = deleteTodo.run(id);

        if (result.changes > 0) {
            res.json({ id: parseInt(id) });
        } else {
            res.status(400).json({ error: "Failed to delete todo" });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Close the database connection on process exit
process.on("exit", () => db.close());
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));
