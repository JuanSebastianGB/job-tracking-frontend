/**
 * DEPRECATED: This Express.js server is deprecated in favor of the new FastAPI backend.
 * 
 * This file will be removed in a future version.
 * 
 * To run the new FastAPI backend instead:
 *   cd backend
 *   pip install -r requirements.txt
 *   uvicorn app.main:app --reload --port 3000
 * 
 * The FastAPI backend provides the same API endpoints:
 *   - GET    /api/jobs
 *   - POST   /api/jobs
 *   - PUT    /api/jobs/:id
 *   - DELETE /api/jobs/:id
 *   - POST   /api/upload
 * 
 * File location: job-tracker/server.ts
 */

import express from "express";
import "dotenv/config";
import initSqlJs, { Database } from "sql.js";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Set up file uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

// Note: Frontend is now served separately by Vite on port 5173
// This server only handles the API

// Database setup
const dbPath = path.join(__dirname, "jobs.db");
let db: Database;

async function initDb() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      url TEXT,
      date_applied TEXT NOT NULL,
      status TEXT NOT NULL,
      work_model TEXT,
      salary_range TEXT,
      salary_frequency TEXT DEFAULT 'Yearly',
      tech_stack TEXT,
      notes TEXT,
      screenshot_url TEXT,
      resume_url TEXT,
      cover_letter_url TEXT,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add salary_frequency column if not exists (for existing DBs)
  try {
    db.run("ALTER TABLE jobs ADD COLUMN salary_frequency TEXT DEFAULT 'Yearly'");
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: Add attachments column if not exists
  try {
    db.run("ALTER TABLE jobs ADD COLUMN attachments TEXT");
  } catch (e) {
    // Column already exists, ignore
  }

  saveDb();
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// API Routes
app.get("/api/jobs", (req, res) => {
  try {
    const results = db.exec("SELECT * FROM jobs ORDER BY date_applied DESC");
    if (results.length === 0) {
      return res.json([]);
    }
    
    const columns = results[0].columns;
    const jobs = results[0].values.map((row: any[]) => {
      const job: any = {};
      columns.forEach((col, i) => {
        job[col] = row[i];
      });
      job.tech_stack = job.tech_stack ? JSON.parse(job.tech_stack) : [];
      job.attachments = job.attachments ? JSON.parse(job.attachments) : [];
      return job;
    });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.post("/api/jobs", (req, res) => {
  try {
    console.log("Creating job with data:", req.body);
    const {
      title,
      company,
      url,
      date_applied,
      status,
      work_model,
      salary_range,
      salary_frequency,
      tech_stack,
      notes,
      screenshot_url,
      resume_url,
      cover_letter_url,
      attachments,
    } = req.body;

    db.run(`
      INSERT INTO jobs (
        title, company, url, date_applied, status, work_model, 
        salary_range, salary_frequency, tech_stack, notes, screenshot_url, resume_url, cover_letter_url, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      company,
      url,
      date_applied,
      status,
      work_model,
      salary_range,
      salary_frequency || 'Yearly',
      JSON.stringify(tech_stack || []),
      notes,
      screenshot_url,
      resume_url,
      cover_letter_url,
      JSON.stringify(attachments || [])
    ]);

    const result = db.exec("SELECT last_insert_rowid() as id");
    const id = result[0].values[0][0];
    
    saveDb();
    res.json({ id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.put("/api/jobs/:id", (req, res) => {
  try {
    console.log(`Updating job ${req.params.id} with data:`, req.body);
    const {
      title,
      company,
      url,
      date_applied,
      status,
      work_model,
      salary_range,
      salary_frequency,
      tech_stack,
      notes,
      screenshot_url,
      resume_url,
      cover_letter_url,
      attachments,
    } = req.body;

    db.run(`
      UPDATE jobs SET 
        title = ?, company = ?, url = ?, date_applied = ?, status = ?, 
        work_model = ?, salary_range = ?, salary_frequency = ?, tech_stack = ?, notes = ?, 
        screenshot_url = ?, resume_url = ?, cover_letter_url = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title,
      company,
      url,
      date_applied,
      status,
      work_model,
      salary_range,
      salary_frequency || 'Yearly',
      JSON.stringify(tech_stack || []),
      notes,
      screenshot_url,
      resume_url,
      cover_letter_url,
      JSON.stringify(attachments || []),
      req.params.id
    ]);

    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

app.delete("/api/jobs/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`Attempting to delete job with ID: ${id} (raw: ${req.params.id})`);
    
    db.run("DELETE FROM jobs WHERE id = ?", [id]);
    
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

async function startServer() {
  await initDb();
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API Server running on http://localhost:${PORT}`);
  });
}

startServer();
