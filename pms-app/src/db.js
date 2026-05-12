import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

// 1. แยก Database เด็ดขาด (ใช้ pms_db.sqlite แยกร่างจาก core)
const dbDir = path.join(process.cwd(), 'databases');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'pms_db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Projects Table
  // กฎ: Soft Delete ONLY, ต้องมี fiscal_year_id เสมอ
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    fiscal_year_id TEXT NOT NULL,
    fund_type TEXT NOT NULL,
    title_th TEXT NOT NULL,
    title_en TEXT,
    status TEXT DEFAULT 'DRAFT',
    is_ec_approved INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    manager_name TEXT,
    staff_name TEXT
  )`);

  db.run(`ALTER TABLE projects ADD COLUMN budget_amount REAL DEFAULT 0`, (err) => { });
  db.run(`ALTER TABLE projects ADD COLUMN budget_balance REAL DEFAULT 0`, (err) => { });
  db.run(`ALTER TABLE projects ADD COLUMN proposal_doc_url TEXT`, (err) => { });
  db.run(`ALTER TABLE projects ADD COLUMN closure_doc_url TEXT`, (err) => { });
  db.run(`ALTER TABLE projects ADD COLUMN manager_name TEXT`, (err) => { });
  db.run(`ALTER TABLE projects ADD COLUMN staff_name TEXT`, (err) => { });

  // Budget Transactions Table
  db.run(`CREATE TABLE IF NOT EXISTS budget_transactions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    document_url TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`ALTER TABLE budget_transactions ADD COLUMN action_date DATE`, (err) => { });

  // Project Members Table
  // กฎ: Denormalization - ดึงชื่อและสังกัดมาเก็บสำเนาไว้เลย ไม่ต้อง JOIN ข้าม DB
  db.run(`CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    core_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dept TEXT NOT NULL,
    role TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0
  )`);

  // Project Documents Table
  // กฎ: เก็บแค่ Storage Path จาก Object Storage
  db.run(`CREATE TABLE IF NOT EXISTS project_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Fund Types Table
  db.run(`CREATE TABLE IF NOT EXISTS fund_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`, () => {
    // Seed initial fund types if empty using INSERT OR IGNORE
    db.run("INSERT OR IGNORE INTO fund_types VALUES ('FUND-1', 'ทุนสนับสนุนงานมูลฐาน (Fundamental Fund)')");
    db.run("INSERT OR IGNORE INTO fund_types VALUES ('FUND-2', 'ทุนวิจัยภายใน (RDI)')");
    db.run("INSERT OR IGNORE INTO fund_types VALUES ('FUND-3', 'ทุนวิจัยภายนอก (External)')");
  });
});

export default db;
