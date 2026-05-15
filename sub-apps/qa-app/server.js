import express from 'express';
import cors from 'cors';
import db from './src/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });


const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware (Mock)
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing JWT Token' });
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    req.coreUser = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

// --- KPI Management ---

app.get('/api/qa/frameworks', (req, res) => {
  db.all("SELECT * FROM kpi_frameworks", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/qa/kpis', (req, res) => {
  db.all("SELECT * FROM kpis", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/qa/frameworks', requireAuth, (req, res) => {
  const { name, fiscal_year, category, description } = req.body;
  const id = 'FW-' + Date.now();
  db.run(
    "INSERT INTO kpi_frameworks (id, name, fiscal_year, category, description) VALUES (?, ?, ?, ?, ?)",
    [id, name, fiscal_year, category, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, id });
    }
  );
});

app.put('/api/qa/frameworks/:id', requireAuth, (req, res) => {
  const { name, fiscal_year, category, description } = req.body;
  db.run(
    "UPDATE kpi_frameworks SET name=?, fiscal_year=?, category=?, description=? WHERE id=?",
    [name, fiscal_year, category, description, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/qa/frameworks/:id', requireAuth, (req, res) => {
  db.run("DELETE FROM kpi_frameworks WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Category Management
app.get('/api/qa/categories', (req, res) => {
  db.all("SELECT * FROM kpi_categories", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/qa/categories', requireAuth, (req, res) => {
  db.run("INSERT INTO kpi_categories (name) VALUES (?)", [req.body.name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

app.put('/api/qa/categories/:id', requireAuth, (req, res) => {
  db.run("UPDATE kpi_categories SET name = ? WHERE id = ?", [req.body.name, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/qa/categories/:id', requireAuth, (req, res) => {
  db.run("DELETE FROM kpi_categories WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/qa/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ 
    path: `/uploads/${req.file.filename}`, 
    name: req.file.originalname 
  });
});

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

app.post('/api/qa/kpis', requireAuth, (req, res) => {
  const { framework_id, code, name, target_value, unit, weight, description, evidence, evidence_path, evidence_name, targets } = req.body;
  const id = 'KPI-' + Date.now();
  db.serialize(() => {
    db.run(
      "INSERT INTO kpis (id, framework_id, code, name, target_value, unit, weight, description, evidence, evidence_path, evidence_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, framework_id, code, name, target_value, unit, weight, description, evidence, evidence_path, evidence_name]
    );

    if (targets && Array.isArray(targets)) {
      const stmt = db.prepare("INSERT INTO kpi_targets (kpi_id, label, value, unit, attachment_path, attachment_name) VALUES (?, ?, ?, ?, ?, ?)");
      targets.forEach(t => {
        stmt.run([id, t.label, t.value, t.unit, t.attachment_path, t.attachment_name]);
      });
      stmt.finalize();
    }
    
    res.status(201).json({ success: true, id });
  });
});

app.put('/api/qa/kpis/:id', requireAuth, (req, res) => {
  const { code, name, target_value, unit, weight, description, evidence, evidence_path, evidence_name, targets } = req.body;
  const kpiId = req.params.id;

  db.serialize(() => {
    db.run(
      "UPDATE kpis SET code=?, name=?, target_value=?, unit=?, weight=?, description=?, evidence=?, evidence_path=?, evidence_name=? WHERE id=?",
      [code, name, target_value, unit, weight, description, evidence, evidence_path, evidence_name, kpiId]
    );

    db.run("DELETE FROM kpi_targets WHERE kpi_id = ?", [kpiId]);

    if (targets && Array.isArray(targets)) {
      const stmt = db.prepare("INSERT INTO kpi_targets (kpi_id, label, value, unit, attachment_path, attachment_name) VALUES (?, ?, ?, ?, ?, ?)");
      targets.forEach(t => {
        stmt.run([kpiId, t.label, t.value, t.unit, t.attachment_path, t.attachment_name]);
      });
      stmt.finalize();
    }

    res.json({ success: true });
  });
});

app.delete('/api/qa/kpis/:id', requireAuth, (req, res) => {
  db.run("DELETE FROM kpis WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Also cleanup mappings
    db.run("DELETE FROM kpi_evidence_mappings WHERE kpi_id = ?", [req.params.id]);
    res.json({ success: true });
  });
});

// --- Data Aggregation & Inbox ---

// FR-AGG-01 & FR-AGG-02: The Inbox
app.get('/api/qa/inbox', requireAuth, async (req, res) => {
  try {
    // 1. Fetch Aggregated Data from PMS
    let pmsAggregatedData = [];
    try {
      const pmsRes = await fetch('http://localhost:3002/api/pms/aggregated-data', {
        headers: { 'Authorization': req.headers['authorization'] }
      });
      if (pmsRes.ok) {
        pmsAggregatedData = await pmsRes.json();
      }
    } catch (e) { 
      console.error('QA: PMS Aggregator fetch failed', e.message); 
    }

    // 2. Get all existing mappings with KPI info
    db.all(`
      SELECT m.id as mapping_id, m.source_app, m.source_ref_id, m.kpi_id, k.code as kpi_code, f.name as framework_name
      FROM kpi_evidence_mappings m
      JOIN kpis k ON m.kpi_id = k.id
      JOIN kpi_frameworks f ON k.framework_id = f.id
    `, [], (err, mappings) => {
      if (err) return res.status(500).json({ error: err.message });

      // Group mappings by item: { "PMS:1": [ { framework, code, kpi_id }, ... ] }
      const itemMappings = {};
      mappings.forEach(m => {
        const key = `${m.source_app}:${m.source_ref_id}`;
        if (!itemMappings[key]) itemMappings[key] = [];
        itemMappings[key].push(m);
      });

      // 3. Combine Aggregated Data with Mapping Info
      const inbox = pmsAggregatedData.map(item => {
        const key = `${item.source}:${item.id}`;
        const itemMaps = itemMappings[key] || [];
        
        // Group by framework for display: "Framework (Code, Code)"
        const displayMappings = {};
        itemMaps.forEach(m => {
          if (!displayMappings[m.framework_name]) displayMappings[m.framework_name] = [];
          displayMappings[m.framework_name].push(m.kpi_code);
        });

        const assignedKpis = Object.entries(displayMappings).map(([fw, codes]) => {
          return `${fw} (${codes.join(', ')})`;
        });

        return {
          ...item,
          is_tagged: itemMaps.length > 0,
          assigned_kpis: assignedKpis,
          assigned_kpi_ids: itemMaps.map(m => m.kpi_id),
          assigned_mappings: itemMaps.map(m => ({ id: m.mapping_id, kpi_id: m.kpi_id, kpi_code: m.kpi_code, framework_name: m.framework_name }))
        };
      });

      res.json(inbox);
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// FR-AGG-03: Mapping
app.post('/api/qa/mappings', requireAuth, (req, res) => {
  const { kpi_id, source_app, source_ref_id, source_title } = req.body;
  const user_id = req.coreUser.id;

  db.run(
    "INSERT INTO kpi_evidence_mappings (kpi_id, source_app, source_ref_id, source_title, mapped_by_core_user_id) VALUES (?, ?, ?, ?, ?)",
    [kpi_id, source_app, source_ref_id, source_title, user_id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'This item is already mapped to this KPI' });
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete('/api/qa/mappings/:id', requireAuth, (req, res) => {
  db.run("DELETE FROM kpi_evidence_mappings WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Reporting ---

app.get('/api/qa/dashboard', (req, res) => {
  db.all(`
    SELECT k.*, f.fiscal_year, f.category, COUNT(m.id) as actual_count
    FROM kpis k
    JOIN kpi_frameworks f ON k.framework_id = f.id
    LEFT JOIN kpi_evidence_mappings m ON k.id = m.kpi_id
    GROUP BY k.id
  `, (err, kpis) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all("SELECT * FROM kpi_targets", [], (tErr, targets) => {
      if (tErr) return res.status(500).json({ error: tErr.message });
      
      const kpisWithTargets = kpis.map(kpi => ({
        ...kpi,
        targets: targets.filter(t => t.kpi_id === kpi.id)
      }));
      
      res.json(kpisWithTargets);
    });
  });
});

app.get('/api/qa/kpis/:id/evidence', (req, res) => {
  db.all("SELECT * FROM kpi_evidence_mappings WHERE kpi_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.patch('/api/qa/targets/:id', requireAuth, (req, res) => {
  const { attachment_path, attachment_name } = req.body;
  const targetId = req.params.id;
  db.run(
    "UPDATE kpi_targets SET attachment_path = ?, attachment_name = ? WHERE id = ?",
    [attachment_path, attachment_name, targetId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

const PORT = 3005;
app.listen(PORT, () => console.log(`🚀 QA Sub-App running on http://localhost:${PORT}`));
