import express from 'express';
import cors from 'cors';
import db from './src/db.js';
import http from 'http';

const app = express();
app.use(cors());
app.use(express.json());

// Helper to log to Global Audit Trail
const logToGlobalAudit = (userName, action, details) => {
  const data = JSON.stringify({ user_name: userName, action, details });
  const req = http.request({
    hostname: 'localhost',
    port: 3801,
    path: '/api/audit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    res.on('data', () => {}); // Consume response
  });

  req.on('error', (e) => {
    console.error('Failed to log to global audit:', e.message);
  });

  req.write(data);
  req.end();
};

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Calendar Sub-App is running' });
});

// Mock remoteEntry.js for Module Federation
app.get('/remoteEntry.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send('console.log("Mock remoteEntry.js loaded");');
});


// Auth Middleware (Mock receiving JWT from Core App)
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing JWT Token' });

  try {
    // In production use jwt.verify(...)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    req.coreUser = payload; // Contains user ID, roles, etc.
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

// ==========================================
// API Routes for Activity Types
// ==========================================

// GET /api/activity-types
app.get('/api/activity-types', (req, res) => {
  db.all("SELECT * FROM activity_types", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/activity-types
app.post('/api/activity-types', requireAuth, (req, res) => {
  const { name, color_bg, color_text, color_border } = req.body;
  if (!name || !color_bg || !color_text || !color_border) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  db.run("INSERT INTO activity_types (name, color_bg, color_text, color_border) VALUES (?, ?, ?, ?)", 
    [name, color_bg, color_text, color_border], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

// PUT /api/activity-types/:id
app.put('/api/activity-types/:id', requireAuth, (req, res) => {
  const { name, color_bg, color_text, color_border } = req.body;
  db.run("UPDATE activity_types SET name = ?, color_bg = ?, color_text = ?, color_border = ? WHERE id = ?", 
    [name, color_bg, color_text, color_border, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE /api/activity-types/:id
app.delete('/api/activity-types/:id', requireAuth, (req, res) => {
  db.run("DELETE FROM activity_types WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ==========================================
// API Routes for Smart Office & Calendar
// ==========================================

// 2.3 Unified Calendar View (FR-CAL-01)
// GET /api/calendar/events
app.get('/api/calendar/events', requireAuth, (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  // Query Activities
  const activityQuery = `
    SELECT id, title, type, start_date, end_date, deadline, location, 'activity' as event_type, storage_path 
    FROM staff_activities 
    WHERE is_deleted = 0 
      AND ((start_date >= ? AND start_date <= ?) OR (end_date >= ? AND end_date <= ?) OR (deadline >= ? AND deadline <= ?))
  `;

  // Query Documents
  const documentQuery = `
    SELECT id, title, type, due_date as start_date, due_date as end_date, 'document' as event_type, storage_path, confidential_level
    FROM documents 
    WHERE is_deleted = 0 
      AND due_date >= ? AND due_date <= ?
  `;

  db.all(activityQuery, [start_date, end_date, start_date, end_date, start_date, end_date], (err, activities) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(documentQuery, [start_date, end_date], (err2, documents) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const activityIds = activities.map(a => `'${a.id}'`).join(',');
      const participantQuery = activityIds ? `SELECT activity_id, core_user_id, display_name FROM activity_participants WHERE activity_id IN (${activityIds})` : `SELECT 1 WHERE 0`;

      db.all(participantQuery, [], (err3, participants) => {
        if (err3 && activityIds) return res.status(500).json({ error: err3.message });
        
        const activitiesWithParticipants = activities.map(act => ({
          ...act,
          participants: (participants || []).filter(p => p.activity_id === act.id)
        }));

        // Combine events
        const events = [...activitiesWithParticipants, ...documents];
        res.json(events);
      });
    });
  });
});

// 2.4 Public Access (FR-PUB-02)
// GET /api/public/events
app.get('/api/public/events', (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }

  const activityQuery = `
    SELECT id, title, type, start_date, end_date, deadline, location, 'activity' as event_type, storage_path 
    FROM staff_activities 
    WHERE is_deleted = 0 
      AND ((start_date >= ? AND start_date <= ?) OR (end_date >= ? AND end_date <= ?))
  `;

  const documentQuery = `
    SELECT id, title, type, due_date as start_date, due_date as end_date, 'document' as event_type, storage_path, confidential_level
    FROM documents 
    WHERE is_deleted = 0 
      AND due_date >= ? AND due_date <= ?
  `;

  db.all(activityQuery, [start_date, end_date, start_date, end_date], (err, activities) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(documentQuery, [start_date, end_date], (err2, documents) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const activityIds = activities.map(a => `'${a.id}'`).join(',');
      const participantQuery = activityIds ? `SELECT activity_id, core_user_id, display_name FROM activity_participants WHERE activity_id IN (${activityIds})` : `SELECT 1 WHERE 0`;

      db.all(participantQuery, [], (err3, participants) => {
        if (err3 && activityIds) return res.status(500).json({ error: err3.message });
        
        const activitiesWithParticipants = activities.map(act => ({
          ...act,
          participants: (participants || []).filter(p => p.activity_id === act.id)
        }));

        const events = [...activitiesWithParticipants, ...documents];
        res.json(events);
      });
    });
  });
});

// ==========================================
// Staff Activities CRUD
// ==========================================

// Create Activity
app.post('/api/activities', requireAuth, (req, res) => {
  const { title, type, start_date, end_date, deadline, location, visibility, storage_path, participants } = req.body;
  const id = 'ACT-' + Date.now();
  const created_by = req.coreUser.name || 'Unknown User';

  db.run(
    "INSERT INTO staff_activities (id, title, type, start_date, end_date, deadline, location, visibility, storage_path, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, title, type, start_date, end_date, deadline, location, visibility || 'INTERNAL', storage_path, created_by],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Insert participants if any
      if (participants && participants.length > 0) {
        const stmt = db.prepare("INSERT INTO activity_participants (id, activity_id, core_user_id, display_name) VALUES (?, ?, ?, ?)");
        participants.forEach(p => {
          stmt.run(['PART-' + Date.now() + Math.random(), id, p.core_user_id, p.display_name]);
        });
        stmt.finalize();
      }

      res.status(201).json({ success: true, id });
    }
  );
});

// Get Activities
app.get('/api/activities', requireAuth, (req, res) => {
  db.all("SELECT * FROM staff_activities WHERE is_deleted = 0", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update Activity
app.put('/api/activities/:id', requireAuth, (req, res) => {
  const { title, type, start_date, end_date, deadline, location, visibility, storage_path, participants } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE staff_activities SET title=?, type=?, start_date=?, end_date=?, deadline=?, location=?, visibility=?, storage_path=? WHERE id=? AND is_deleted=0",
    [title, type, start_date, end_date, deadline, location, visibility, storage_path, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run("DELETE FROM activity_participants WHERE activity_id = ?", [id], (delErr) => {
        if (delErr) return console.error(delErr);
        if (participants && participants.length > 0) {
          const stmt = db.prepare("INSERT INTO activity_participants (id, activity_id, core_user_id, display_name) VALUES (?, ?, ?, ?)");
          participants.forEach(p => {
            stmt.run(['PART-' + Date.now() + Math.random(), id, p.core_user_id, p.display_name]);
          });
          stmt.finalize();
        }
      });

      res.json({ success: true, updated: this.changes });
    }
  );
});

// Soft Delete Activity
app.delete('/api/activities/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run("UPDATE staff_activities SET is_deleted = 1 WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Activity soft-deleted' });
  });
});

// ==========================================
// e-Document Registry CRUD
// ==========================================

// Create Document
app.post('/api/documents', requireAuth, (req, res) => {
  const { doc_no, title, type, fiscal_year, due_date, storage_path, confidential_level, assignee_core_user_ids } = req.body;
  const id = 'DOC-' + Date.now();
  const created_by_core_user_id = req.coreUser.id;

  db.run(
    "INSERT INTO documents (id, doc_no, title, type, fiscal_year, due_date, storage_path, confidential_level, status, created_by_core_user_id, assignee_core_user_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, doc_no, title, type, fiscal_year, due_date, storage_path, confidential_level || 'ปกติ', 'PENDING', created_by_core_user_id, assignee_core_user_ids],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log Action
      db.run(
        "INSERT INTO document_audit_logs (document_id, action, details, user_id) VALUES (?, ?, ?, ?)",
        [id, 'CREATE', JSON.stringify({ title, doc_no }), created_by_core_user_id],
        (err2) => {
          if (err2) console.error('Failed to log audit:', err2);
          
          // Log to Global Audit Trail
          logToGlobalAudit(req.coreUser.name || 'Unknown', 'CREATE_DOCUMENT', `สร้างงาน/ลงทะเบียนเอกสาร: ${title} (${doc_no})`);
          
          res.status(201).json({ success: true, id });
        }
      );
    }
  );
});

// Get Documents
app.get('/api/documents', requireAuth, (req, res) => {
  db.all("SELECT * FROM documents WHERE is_deleted = 0", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update Document
app.put('/api/documents/:id', requireAuth, (req, res) => {
  const { doc_no, title, type, fiscal_year, due_date, storage_path, confidential_level, assignee_core_user_ids } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE documents SET doc_no=?, title=?, type=?, fiscal_year=?, due_date=?, storage_path=?, confidential_level=?, assignee_core_user_ids=? WHERE id=? AND is_deleted=0",
    [doc_no, title, type, fiscal_year, due_date, storage_path, confidential_level, assignee_core_user_ids, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log Action
      db.run(
        "INSERT INTO document_audit_logs (document_id, action, details, user_id) VALUES (?, ?, ?, ?)",
        [id, 'UPDATE', JSON.stringify({ title, doc_no }), req.coreUser.id],
        (err2) => {
          if (err2) console.error('Failed to log audit:', err2);
          
          // Log to Global Audit Trail
          logToGlobalAudit(req.coreUser.name || 'Unknown', 'UPDATE_DOCUMENT', `แก้ไขงาน/ข้อมูลเอกสาร: ${title} (${doc_no})`);
          
          res.json({ success: true, updated: this.changes });
        }
      );
    }
  );
});

// Soft Delete Document
app.delete('/api/documents/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run("UPDATE documents SET is_deleted = 1 WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Log Action
    db.run(
      "INSERT INTO document_audit_logs (document_id, action, details, user_id) VALUES (?, ?, ?, ?)",
      [id, 'DELETE', null, req.coreUser.id],
      (err2) => {
        if (err2) console.error('Failed to log audit:', err2);
        
        // Log to Global Audit Trail
        logToGlobalAudit(req.coreUser.name || 'Unknown', 'DELETE_DOCUMENT', `ลบงาน/เอกสาร ID: ${id}`);
        
        res.json({ success: true, message: 'Document soft-deleted' });
      }
    );
  });
});

// ==========================================
// Kanban Board Endpoints
// ==========================================

// 4.1 GET /api/smart-office/documents/board
app.get('/api/smart-office/documents/board', requireAuth, (req, res) => {
  const query = `
    SELECT * FROM documents 
    WHERE is_deleted = 0 
      AND (status != 'COMPLETED' OR (status = 'COMPLETED' AND created_at >= date('now', '-7 days')))
    ORDER BY created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const board = {
      PENDING: [],
      IN_PROGRESS: [],
      WAITING_SIGN: [],
      COMPLETED: []
    };

    rows.forEach(row => {
      if (board[row.status]) {
        board[row.status].push(row);
      }
    });

    res.json(board);
  });
});

// 4.2 PATCH /api/smart-office/documents/:id/status
app.patch('/api/smart-office/documents/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { new_status } = req.body;
  const user = req.coreUser;

  const validTransitions = {
    'PENDING': ['IN_PROGRESS'],
    'IN_PROGRESS': ['PENDING', 'WAITING_SIGN'],
    'WAITING_SIGN': ['IN_PROGRESS', 'COMPLETED'],
    'COMPLETED': []
  };

  db.get("SELECT status FROM documents WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Document not found' });

    const currentStatus = row.status;

    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(new_status)) {
      return res.status(400).json({ error: `Invalid state transition from ${currentStatus} to ${new_status}` });
    }

    if (user.role === 'executive') {
      if (currentStatus !== 'WAITING_SIGN' || new_status !== 'COMPLETED') {
        return res.status(403).json({ error: 'Executives can only approve documents (WAITING_SIGN -> COMPLETED)' });
      }
    } else if (user.role === 'admin' || user.role === 'staff') {
      if (new_status === 'COMPLETED') {
        return res.status(403).json({ error: 'Only executives can complete documents' });
      }
    } else {
      return res.status(403).json({ error: 'You do not have permission to change status' });
    }

    const query = new_status === 'IN_PROGRESS'
      ? "UPDATE documents SET status = ?, received_at = CURRENT_TIMESTAMP WHERE id = ?"
      : "UPDATE documents SET status = ? WHERE id = ?";
      
    db.run(
      query,
      [new_status, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        db.run(
          "INSERT INTO document_status_logs (document_id, previous_status, new_status, changed_by_core_user_id) VALUES (?, ?, ?, ?)",
          [id, currentStatus, new_status, user.id],
          (err2) => {
            if (err2) console.error('Failed to log status change:', err2);
            
            // Log Action to Audit
            db.run(
              "INSERT INTO document_audit_logs (document_id, action, details, user_id) VALUES (?, ?, ?, ?)",
              [id, 'STATUS_CHANGE', JSON.stringify({ from: currentStatus, to: new_status }), user.id],
              (err3) => {
                if (err3) console.error('Failed to log audit:', err3);
                
                // Log to Global Audit Trail
                logToGlobalAudit(user.name || 'Unknown', 'STATUS_CHANGE_DOCUMENT', `เปลี่ยนสถานะงาน ID: ${id} จาก ${currentStatus} เป็น ${new_status}`);
                
                res.json({ success: true });
              }
            );
          }
        );
      }
    );
  });
});

// GET /api/settings/:key
app.get('/api/settings/:key', (req, res) => {
  db.get("SELECT value FROM settings WHERE key = ?", [req.params.key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row ? { value: row.value } : { value: null });
  });
});

// POST /api/settings
app.post('/api/settings', requireAuth, (req, res) => {
  const { key, value } = req.body;
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

const PORT = 3803;
app.listen(PORT, () => console.log(`🚀 Calendar Sub-App running on http://localhost:${PORT}`));
