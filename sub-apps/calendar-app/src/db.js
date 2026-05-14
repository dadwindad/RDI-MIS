import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

// 1. แยก Database เด็ดขาด (ใช้ smart_office_db.sqlite แยกร่างจาก core)
const dbDir = path.join(process.cwd(), 'databases');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'smart_office_db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Staff Activities Table
  db.run(`CREATE TABLE IF NOT EXISTS staff_activities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT,
    start_date DATETIME,
    end_date DATETIME,
    deadline DATETIME,
    location TEXT,
    visibility TEXT DEFAULT 'INTERNAL',
    storage_path TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run("ALTER TABLE staff_activities ADD COLUMN storage_path TEXT", () => {});
  db.run("ALTER TABLE staff_activities ADD COLUMN deadline DATETIME", () => {});
  db.run("ALTER TABLE staff_activities ADD COLUMN created_by TEXT", () => {});

  // Activity Participants Table
  db.run(`CREATE TABLE IF NOT EXISTS activity_participants (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    core_user_id TEXT NOT NULL,
    display_name TEXT,
    FOREIGN KEY(activity_id) REFERENCES staff_activities(id)
  )`);

  // Documents Table
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    doc_no TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT,
    fiscal_year TEXT NOT NULL,
    due_date DATETIME,
    storage_path TEXT,
    confidential_level TEXT DEFAULT 'ปกติ',
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run("ALTER TABLE documents ADD COLUMN status TEXT DEFAULT 'PENDING'", () => {});
  db.run("ALTER TABLE documents ADD COLUMN assignee_core_user_id TEXT", () => {});
  db.run("ALTER TABLE documents ADD COLUMN created_by_core_user_id TEXT", () => {});
  db.run("ALTER TABLE documents ADD COLUMN received_at DATETIME", () => {});
  db.run("ALTER TABLE documents ADD COLUMN assignee_core_user_ids TEXT", () => {});

  // Document Status Logs Table
  db.run(`CREATE TABLE IF NOT EXISTS document_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    changed_by_core_user_id TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  )`);

  // Document Audit Logs Table
  db.run(`CREATE TABLE IF NOT EXISTS document_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  )`);

  // Activity Types Table
  db.run(`CREATE TABLE IF NOT EXISTS activity_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color_bg TEXT NOT NULL,
    color_text TEXT NOT NULL,
    color_border TEXT NOT NULL
  )`);

  // Settings Table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Insert default types if empty
  db.get("SELECT COUNT(*) as count FROM activity_types", (err, row) => {
    if (!err && row && row.count === 0) {
      const defaults = [
        ['ประชุมภายใน', 'rgba(59, 130, 246, 0.1)', '#2563eb', '#3b82f6'],
        ['ประชุมภายนอก', 'rgba(139, 92, 246, 0.1)', '#7c3aed', '#8b5cf6'],
        ['ไปราชการ', 'rgba(20, 184, 166, 0.1)', '#0d9488', '#14b8a6'],
        ['ลงพื้นที่', 'rgba(236, 72, 153, 0.1)', '#db2777', '#ec4899']
      ];
      const stmt = db.prepare("INSERT INTO activity_types (name, color_bg, color_text, color_border) VALUES (?, ?, ?, ?)");
      defaults.forEach(def => stmt.run(def));
      stmt.finalize();
    }
  });
});

export default db;
