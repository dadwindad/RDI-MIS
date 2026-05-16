import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', 'databases');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'qa_metrics.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // KPI Frameworks (e.g. EdPEx 2024)
  db.run(`CREATE TABLE IF NOT EXISTS kpi_frameworks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fiscal_year TEXT NOT NULL,
    category TEXT NOT NULL, -- เช่น สมศ, มหาวิทยาลัย, วิสัยทัศน์สำนักงาน, EdPEx
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // KPI Topics (Grouping level between Framework and KPI)
  db.run(`CREATE TABLE IF NOT EXISTS kpi_topics (
    id TEXT PRIMARY KEY,
    framework_id TEXT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    evidence_path TEXT,
    evidence_name TEXT,
    FOREIGN KEY(framework_id) REFERENCES kpi_frameworks(id)
  )`);

  // KPIs
  db.run(`CREATE TABLE IF NOT EXISTS kpis (
    id TEXT PRIMARY KEY,
    framework_id TEXT,
    topic_id TEXT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    target_value REAL,
    unit TEXT, -- e.g. counts, bath, people
    weight REAL,
    description TEXT,
    FOREIGN KEY(framework_id) REFERENCES kpi_frameworks(id),
    FOREIGN KEY(topic_id) REFERENCES kpi_topics(id)
  )`);

  // KPI Targets (Multiple targets per KPI)
  db.run(`CREATE TABLE IF NOT EXISTS kpi_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_id TEXT NOT NULL,
    label TEXT, -- e.g. "เป้าหมายพื้นฐาน", "เป้าหมายท้าทาย"
    value REAL,
    unit TEXT,
    attachment_path TEXT,
    attachment_name TEXT,
    FOREIGN KEY(kpi_id) REFERENCES kpis(id)
  )`);
  
  // Migration: Add attachment columns to kpi_targets if they don't exist
  db.run("ALTER TABLE kpi_targets ADD COLUMN attachment_path TEXT", (err) => {});
  db.run("ALTER TABLE kpi_targets ADD COLUMN attachment_name TEXT", (err) => {});
  
  // Migration: Move existing single targets to kpi_targets table if they haven't been moved
  db.all("SELECT id, target_value, unit FROM kpis WHERE target_value IS NOT NULL", [], (err, rows) => {
    if (!err && rows) {
      rows.forEach(row => {
        db.get("SELECT COUNT(*) as count FROM kpi_targets WHERE kpi_id = ?", [row.id], (tErr, tRow) => {
          if (!tErr && tRow.count === 0) {
            db.run("INSERT INTO kpi_targets (kpi_id, label, value, unit) VALUES (?, ?, ?, ?)",
              [row.id, 'เป้าหมายหลัก', row.target_value, row.unit]);
          }
        });
      });
    }
  });
  
  // Migration: Add evidence columns if they don't exist
  db.run("ALTER TABLE kpis ADD COLUMN evidence TEXT", (err) => {});
  db.run("ALTER TABLE kpis ADD COLUMN evidence_path TEXT", (err) => {});
  db.run("ALTER TABLE kpis ADD COLUMN evidence_name TEXT", (err) => {});

  // Data Mapping (The Inbox results)
  db.run(`CREATE TABLE IF NOT EXISTS kpi_evidence_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_id TEXT NOT NULL,
    source_app TEXT NOT NULL, -- PMS, SMART_OFFICE
    source_ref_id TEXT NOT NULL, -- ID of Project or Activity
    source_title TEXT, -- Denormalized for easy listing
    mapped_by_core_user_id TEXT,
    mapped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(kpi_id) REFERENCES kpis(id),
    UNIQUE(kpi_id, source_app, source_ref_id)
  )`);

  // KPI Categories Table
  db.run(`CREATE TABLE IF NOT EXISTS kpi_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`, () => {
    // Seed default categories
    const defaults = ['สมศ', 'มหาวิทยาลัย', 'วิสัยทัศน์สำนักงาน', 'EdPEx'];
    defaults.forEach(cat => {
      db.run("INSERT OR IGNORE INTO kpi_categories (name) VALUES (?)", [cat]);
    });
  });

  // Migration: Add category column if it doesn't exist
  db.run("ALTER TABLE kpi_frameworks ADD COLUMN category TEXT DEFAULT 'ทั่วไป'", (err) => {});
  
  // Migration: Add topic_id to kpis if it doesn't exist
  db.run("ALTER TABLE kpis ADD COLUMN topic_id TEXT", (err) => {});

  // Seed initial frameworks if empty
  db.get("SELECT COUNT(*) as count FROM kpi_frameworks", (err, row) => {
    if (row && row.count === 0) {
      const frameworks = [
        { id: 'FW-EDPEX-2567', name: 'ตัวชี้วัด EdPEx', year: '2567', cat: 'EdPEx' },
        { id: 'FW-SMS-2567', name: 'ตัวชี้วัด สมศ. รอบห้า', year: '2567', cat: 'สมศ' },
        { id: 'FW-VISION-2567', name: 'ตัวชี้วัดตามวิสัยทัศน์สำนักงาน', year: '2567', cat: 'วิสัยทัศน์สำนักงาน' }
      ];

      frameworks.forEach(f => {
        db.run("INSERT INTO kpi_frameworks (id, name, fiscal_year, category) VALUES (?, ?, ?, ?)",
          [f.id, f.name, f.year, f.cat]);
      });
      
      // Seed some KPIs for Strategy
      db.run("INSERT INTO kpis (id, framework_id, code, name, target_value, unit) VALUES (?, ?, ?, ?, ?, ?)",
        ['KPI-01', 'FW-STRAT-2567', '1.1', 'จำนวนบทความวิจัยที่ได้รับการตีพิมพ์', 50, 'บทความ']);
      db.run("INSERT INTO kpis (id, framework_id, code, name, target_value, unit) VALUES (?, ?, ?, ?, ?, ?)",
        ['KPI-02', 'FW-STRAT-2567', '1.2', 'จำนวนโครงการวิจัยที่ได้รับทุนภายนอก', 20, 'โครงการ']);
      
      // Seed some KPIs for EdPEx
      db.run("INSERT INTO kpis (id, framework_id, code, name, target_value, unit) VALUES (?, ?, ?, ?, ?, ?)",
        ['KPI-03', 'FW-EDPEX-2567', '4.1', 'ระดับความพึงพอใจของผู้ใช้บริการ', 4.5, 'คะแนน']);
    }
  });
});

export default db;
