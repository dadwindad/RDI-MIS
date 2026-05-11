import express from 'express';
import cors from 'cors';
import fs from 'fs';
import db from './src/db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: 104857600 })); // 100MB
app.use(express.urlencoded({ limit: 104857600, extended: true }));
app.use('/uploads', express.static('uploads'));

// Auth Middleware (จำลองรับ JWT จาก Core App)
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing JWT Token' });

  try {
    // ในโปรดักชันต้องใช้ jwt.verify(...) 
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    req.coreUser = payload; // แนบ context สำหรับเช็คสิทธิ (RBAC) ต่อไป
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

// Helper to send Audit Log to Core App
const logAudit = async (user_name, action, details) => {
  try {
    await fetch('http://localhost:3001/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name, action, details })
    });
  } catch (e) {
    console.error('Failed to send audit log to core:', e.message);
  }
};

// ==========================================
// API Routes สำหรับ PMS
// ==========================================

// 1. Create Project (FR-PRJ-01)
app.post('/api/pms/projects', requireAuth, (req, res) => {
  const { fiscal_year_id, fund_type, title_th, title_en, budget_amount } = req.body;
  const id = 'PRJ-' + Date.now();

  db.run(
    "INSERT INTO projects (id, fiscal_year_id, fund_type, title_th, title_en, budget_amount, budget_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT')",
    [id, fiscal_year_id, fund_type, title_th, title_en, budget_amount || 0, budget_amount || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(req.coreUser?.name || 'System', 'CREATE_PROJECT', `Created project: ${title_th} (${id})`);
      res.status(201).json({ success: true, id, status: 'DRAFT' });
    }
  );
});

// 1.5 Update Project
app.put('/api/pms/projects/:id', requireAuth, (req, res) => {
  const { fiscal_year_id, fund_type, title_th, title_en, budget_amount } = req.body;
  const { id } = req.params;

  db.get("SELECT SUM(amount) as total_spent FROM budget_transactions WHERE project_id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalSpent = row ? row.total_spent || 0 : 0;
    const newBalance = (budget_amount || 0) - totalSpent;

    db.run(
      "UPDATE projects SET fiscal_year_id=?, fund_type=?, title_th=?, title_en=?, budget_amount=?, budget_balance=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='DRAFT' AND is_deleted=0",
      [fiscal_year_id, fund_type, title_th, title_en, budget_amount || 0, newBalance, id],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        if (this.changes === 0) return res.status(400).json({ error: 'Cannot update. Only DRAFT projects can be edited.' });
        logAudit(req.coreUser?.name || 'System', 'UPDATE_PROJECT', `Updated project: ${title_th} (${id})`);
        res.json({ success: true, updated: this.changes });
      }
    );
  });
});

// 2. Get Projects (ดึงมาเฉพาะรายการที่ไม่ได้ถูกลบ is_deleted=0)
app.get('/api/pms/projects', requireAuth, (req, res) => {
  db.all(`
    SELECT p.*, 
    (p.budget_amount - COALESCE((SELECT SUM(amount) FROM budget_transactions WHERE project_id = p.id), 0)) as budget_balance 
    FROM projects p 
    WHERE p.is_deleted = 0 
    ORDER BY p.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. Update Status (FR-WFL-01, NFR-REL-01: Idempotent API)
app.put('/api/pms/projects/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  // เช็ค Role ก่อนอนุญาต (Mock logic: เช็คจาก req.coreUser.role)
  // if (req.coreUser.role !== 'admin' && status === 'APPROVED') return res.status(403).send('Forbidden');

  db.run("UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_deleted = 0", [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // FR-INT-01 (Event-Driven): ถ้าสถานะถูกอนุมัติ ให้พ่น Webhook แจ้ง App: Finance 
    if (status === 'APPROVED') {
      console.log(`[Event Triggered] Webhook dispatched to Finance App for Project ID: ${id}`);
      // fetch('https://api-finance.research.ac.th/webhook/pms-approved', { method: 'POST', ... })
    }

    logAudit(req.coreUser?.name || 'System', 'UPDATE_PROJECT_STATUS', `Updated project status to ${status} (${id})`);
    res.json({ success: true, updated: this.changes, status });
  });
});

// 4. Soft Delete Project (FR-PRJ-02)
app.delete('/api/pms/projects/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  // ลบแบบ Soft Delete และอนุญาตเฉพาะสถานะ DRAFT เท่านั้น
  db.run("UPDATE projects SET is_deleted = 1 WHERE id = ? AND status = 'DRAFT'", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Cannot delete. Only DRAFT projects can be deleted or project not found.' });

    logAudit(req.coreUser?.name || 'System', 'DELETE_PROJECT', `Soft-deleted project (${id})`);
    res.json({ success: true, message: 'Project soft-deleted successfully' });
  });
});

// 5. EC Status Webhook (FR-INT-02)
app.post('/api/pms/webhook/ec-status', requireAuth, (req, res) => {
  const { project_id, is_ec_approved } = req.body;
  db.run("UPDATE projects SET is_ec_approved = ? WHERE id = ?", [is_ec_approved ? 1 : 0, project_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

const handleBase64Upload = (document_base64, document_name, uploader_name, activity_name) => {
  if (document_base64 && document_name) {
    const storagePath = '../storage';
    if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);

    // อนุญาตให้ใช้ตัวอักษรภาษาไทยได้ในชื่อไฟล์
    const safeName = document_name.replace(/[^\wก-๙.-]/g, '_');
    const uploader = uploader_name || 'System';
    const activity = activity_name || 'General';
    const finalName = `[PMS]_[${activity}]_[${uploader}]_${Date.now()}-${safeName}`;

    const path = storagePath + '/' + finalName;
    const base64Data = document_base64.replace(/^data:.*,/, '');
    fs.writeFileSync(path, base64Data, 'base64');
    return 'http://localhost:3001/storage/' + finalName;
  }
  return null;
};

// 6. Attach Proposal Document (แนบโครงการ)
app.post('/api/pms/projects/:id/attach', requireAuth, (req, res) => {
  const { document_url, document_base64, document_name } = req.body;
  const { id } = req.params;
  const created_by = req.coreUser?.name || 'Unknown Officer';
  try {
    const newDocUrl = handleBase64Upload(document_base64, document_name, created_by, 'แนบเอกสารโครงการ') || document_url || '';
    if (!newDocUrl) return res.status(400).json({ error: 'No document provided' });

    db.get("SELECT proposal_doc_url FROM projects WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      let existingDocs = [];
      if (row && row.proposal_doc_url) {
        try { existingDocs = JSON.parse(row.proposal_doc_url); }
        catch (e) { existingDocs = [row.proposal_doc_url]; }
      }
      existingDocs.push(newDocUrl);

      db.run("UPDATE projects SET proposal_doc_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(existingDocs), id], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        logAudit(req.coreUser?.name || 'System', 'ATTACH_DOCUMENT', `Attached document to project (${id})`);
        res.json({ success: true, updated: this.changes });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Deduct Budget (ตัดยอด)
app.post('/api/pms/projects/:id/deduct', requireAuth, (req, res) => {
  const { amount, description, action_date, document_base64, document_name, document_url } = req.body;
  const { id } = req.params;
  const created_by = req.coreUser?.name || 'Unknown Officer';
  const txId = 'TX-' + Date.now();

  try {
    const finalDocUrl = handleBase64Upload(document_base64, document_name, created_by, 'ตัดยอดงบประมาณ') || document_url || '';

    // Deduct from balance
    db.run("UPDATE projects SET budget_balance = budget_balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [amount, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Insert transaction
      db.run(
        "INSERT INTO budget_transactions (id, project_id, amount, description, document_url, created_by, action_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [txId, id, amount, description, finalDocUrl, created_by, action_date || new Date().toISOString().split('T')[0]],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          logAudit(req.coreUser?.name || 'System', 'DEDUCT_BUDGET', `Deducted budget: ${amount} THB from project (${id})`);
          res.json({ success: true, txId });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Get Transactions
app.get('/api/pms/projects/:id/transactions', requireAuth, (req, res) => {
  db.all("SELECT * FROM budget_transactions WHERE project_id = ? ORDER BY created_at DESC", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 9. Close Project (ปิดโครงการ)
app.post('/api/pms/projects/:id/close', requireAuth, (req, res) => {
  const { document_url, document_base64, document_name } = req.body;
  const { id } = req.params;
  const created_by = req.coreUser?.name || 'Unknown Officer';
  try {
    const newDocUrl = handleBase64Upload(document_base64, document_name, created_by, 'ปิดโครงการ') || document_url || '';
    if (!newDocUrl) return res.status(400).json({ error: 'No document provided' });

    db.get("SELECT closure_doc_url FROM projects WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      let existingDocs = [];
      if (row && row.closure_doc_url) {
        try { existingDocs = JSON.parse(row.closure_doc_url); }
        catch (e) { existingDocs = [row.closure_doc_url]; }
      }
      existingDocs.push(newDocUrl);

      db.run("UPDATE projects SET status = 'CLOSED', closure_doc_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(existingDocs), id], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, updated: this.changes });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Remove Document (ลบเอกสารแนบ)
app.post('/api/pms/projects/:id/remove-document', requireAuth, (req, res) => {
  const { id } = req.params;
  const { doc_type, url } = req.body;

  if (doc_type !== 'proposal' && doc_type !== 'closure') {
    return res.status(400).json({ error: 'Invalid document type' });
  }

  const column = doc_type === 'proposal' ? 'proposal_doc_url' : 'closure_doc_url';

  db.get(`SELECT ${column} FROM projects WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    let existingDocs = [];
    if (row && row[column]) {
      try { existingDocs = JSON.parse(row[column]); }
      catch (e) { existingDocs = [row[column]]; }
    }

    existingDocs = existingDocs.filter(docUrl => docUrl !== url);
    const newValue = existingDocs.length > 0 ? JSON.stringify(existingDocs) : null;

    db.run(`UPDATE projects SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newValue, id], async function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });

      // Soft delete from central storage gateway
      try {
        const filename = decodeURIComponent(url.split('/').pop());
        await fetch(`http://localhost:3001/api/storage/files/${filename}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to soft delete from core storage:', e);
      }

      res.json({ success: true, updated: this.changes });
    });
  });
});

// --- FUND TYPES API ---
app.get('/api/pms/fund-types', requireAuth, (req, res) => {
  db.all("SELECT * FROM fund_types ORDER BY id", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/pms/fund-types', requireAuth, (req, res) => {
  const { name } = req.body;
  const id = 'FUND-' + Date.now();
  db.run("INSERT INTO fund_types (id, name) VALUES (?, ?)", [id, name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.delete('/api/pms/fund-types/:id', requireAuth, (req, res) => {
  db.run("DELETE FROM fund_types WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = 3002;
app.listen(PORT, () => console.log(`🚀 PMS Backend Server running on http://localhost:${PORT}`));
