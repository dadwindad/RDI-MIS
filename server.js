import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to decode x-user-name header (contains Thai characters encoded as URI)
app.use((req, res, next) => {
  if (req.headers['x-user-name']) {
    try {
      req.headers['x-user-name'] = decodeURIComponent(req.headers['x-user-name']);
    } catch (e) {
      console.error('Failed to decode x-user-name header', e);
    }
  }
  next();
});

// Ensure databases directory exists
const dbDir = path.join(process.cwd(), 'databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure local storage directory exists
const storageDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configure multer for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const appSource = req.body.appSource || 'Core System';
    const activity = req.body.activity || 'General';
    const uploader = req.body.uploader || 'Unknown';
    cb(null, `[${appSource}]_[${activity}]_[${uploader}]_${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Serve storage files statically
app.use('/storage', express.static(storageDir));

// Initialize SQLite database
const dbPath = path.join(dbDir, 'core_platform.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    email TEXT,
    dept TEXT,
    role TEXT,
    status TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    action TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    permissions TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS fiscal_years (
    year TEXT PRIMARY KEY,
    start_date TEXT,
    end_date TEXT,
    state TEXT,
    desc TEXT
  )`, () => {
    db.run(`ALTER TABLE fiscal_years ADD COLUMN is_deleted INTEGER DEFAULT 0`, (err) => {
      // Ignore error if column already exists
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS app_registry (
    app_id TEXT PRIMARY KEY,
    name TEXT,
    entry_url TEXT,
    api_endpoint TEXT,
    required_roles TEXT,
    status TEXT
  )`);

  // Seed initial data if the table is empty
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      console.log("Seeding initial users to SQLite...");
      const stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run('1001', 'admin', 'password', 'สมมติ นามสมมติ', 'admin@ricp.ac.th', 'IT Division', 'admin', 'Active');
      stmt.run('1002', 'manager', 'password', 'Jane Smith', 'jane.s@ricp.ac.th', 'Finance & Budgeting', 'manager', 'Active');
      stmt.run('1003', 'staff', 'password', 'Prof. Alan Turing', 'alan.t@ricp.ac.th', 'Research Institute', 'staff', 'Active');
      stmt.finalize();
    }
  });

  // Seed initial roles to match user types (admin, staff, manager)
  db.all("SELECT name FROM roles", [], (err, rows) => {
    const roleNames = rows ? rows.map(r => r.name).sort() : [];
    const expectedRoles = ['admin', 'manager', 'staff'].sort();
    
    const isDifferent = roleNames.length !== expectedRoles.length || 
                        !roleNames.every((val, index) => val === expectedRoles[index]);
                        
    if (isDifferent) {
      console.log("Wiping old roles and seeding correct roles (admin, manager, staff) to SQLite...");
      db.run("DELETE FROM roles", [], () => {
        const stmt = db.prepare("INSERT INTO roles (name, permissions) VALUES (?, ?)");
        stmt.run('admin', JSON.stringify(['pms:create', 'pms:approve', 'pms:read_all', 'finance:view', 'finance:approve', 'finance:disburse', 'core:manage_apps', 'core:manage_users']));
        stmt.run('manager', JSON.stringify(['pms:create', 'pms:read_all', 'finance:view', 'finance:approve']));
        stmt.run('staff', JSON.stringify(['pms:create', 'finance:view']));
        stmt.finalize();
      });
    }
  });

  // Temporary cleanup of encoded logs
  db.run("DELETE FROM audit_logs WHERE instr(user_name, '%E0%B8') > 0", function(err) {
    if (err) {
      console.error("Failed to clean up logs:", err.message);
    } else {
      if (this.changes > 0) {
        console.log(`Cleaned up ${this.changes} encoded log entries.`);
      }
    }
  });

  db.get("SELECT COUNT(*) as count FROM fiscal_years", (err, row) => {
    if (row && row.count === 0) {
      console.log("Seeding initial fiscal years to SQLite...");
      const stmt = db.prepare("INSERT INTO fiscal_years (year, start_date, end_date, state, desc) VALUES (?, ?, ?, ?, ?)");
      stmt.run('2568', '1 ต.ค. 67', '30 ก.ย. 68', 'Planning', 'เปิดรับคำของบประมาณ');
      stmt.run('2567', '1 ต.ค. 66', '30 ก.ย. 67', 'Active', 'ปีงบประมาณปัจจุบัน');
      stmt.run('2566', '1 ต.ค. 65', '30 ก.ย. 66', 'Archived', 'ปิดปีงบประมาณแล้ว');
      stmt.finalize();
    }
  });

  db.get("SELECT COUNT(*) as count FROM app_registry", (err, row) => {
    if (row && row.count === 0) {
      console.log("Seeding initial apps to SQLite...");
      const stmt = db.prepare("INSERT INTO app_registry VALUES (?, ?, ?, ?, ?, ?)");
      stmt.run('org-pms', 'Project Management (PMS)', 'http://localhost:3802/remoteEntry.js', 'http://localhost:3802', '["admin","manager","staff"]', 'Active');
      stmt.run('org-ec', 'Ethics Committee (EC)', 'https://ec.research.ac.th/remoteEntry.js', 'https://api-ec.research.ac.th', '["admin","manager"]', 'Active');
      stmt.run('org-finance', 'Financial System', 'https://finance.research.ac.th/remoteEntry.js', 'https://api-finance.research.ac.th', '["admin","manager"]', 'Maintenance');
      stmt.run('org-ip', 'IP Registration', 'https://ip.research.ac.th/remoteEntry.js', 'https://api-ip.research.ac.th', '["admin","manager"]', 'Maintenance');
      stmt.finalize();
    }
  });
});

// Helper to log audit trail
const logAudit = (user_name, action, details) => {
  db.run("INSERT INTO audit_logs (user_name, action, details) VALUES (?, ?, ?)", [user_name, action, details], (err) => {
    if (err) console.error("Failed to insert audit log:", err.message);
  });
};

// Authentication Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT id, username, name, email, dept, role, status FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      logAudit(row.name, 'LOGIN', 'User logged into Core Platform');
      res.json(row); // Return user without password
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  db.all("SELECT id, username, name, email, dept, role, status FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userName = req.headers['x-user-name'] || 'System';
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes > 0) logAudit(userName, 'DELETE_USER', `Deleted user ID: ${req.params.id}`);
    res.json({ success: true, deleted: this.changes });
  });
});

// Get all roles
app.get('/api/roles', (req, res) => {
  db.all("SELECT * FROM roles", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const roles = rows.map(row => ({
      ...row,
      permissions: JSON.parse(row.permissions || '[]')
    }));
    res.json(roles);
  });
});

// Update role permissions
app.put('/api/roles/:id', (req, res) => {
  const { permissions } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  
  db.run("UPDATE roles SET permissions = ? WHERE id = ?", 
    [JSON.stringify(permissions), req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAudit(userName, 'UPDATE_ROLE', `Updated permissions for role ID ${req.params.id}`);
    res.json({ success: true, updated: this.changes });
  });
});

// Create custom role
app.post('/api/roles', (req, res) => {
  const { name, permissions } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  
  db.run("INSERT INTO roles (name, permissions) VALUES (?, ?)", 
    [name, JSON.stringify(permissions || [])], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAudit(userName, 'CREATE_ROLE', `Created custom role: ${name}`);
    res.json({ success: true, id: this.lastID });
  });
});

// Add new user
app.post('/api/users', (req, res) => {
  const { username, password, name, email, dept, role, status } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  const id = Date.now().toString(); // Simple ID generation
  db.run("INSERT INTO users (id, username, password, name, email, dept, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    [id, username, password, name, email, dept, role, status], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAudit(userName, 'CREATE_USER', `Created new user: ${username} (${role})`);
    res.json({ success: true, id });
  });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const { username, password, name, email, dept, role, status } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  
  if (password) {
    db.run("UPDATE users SET username = ?, password = ?, name = ?, email = ?, dept = ?, role = ?, status = ? WHERE id = ?", 
      [username, password, name, email, dept, role, status, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(userName, 'UPDATE_USER', `Updated user ID ${req.params.id} (with password reset)`);
      res.json({ success: true, updated: this.changes });
    });
  } else {
    db.run("UPDATE users SET username = ?, name = ?, email = ?, dept = ?, role = ?, status = ? WHERE id = ?", 
      [username, name, email, dept, role, status, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(userName, 'UPDATE_USER', `Updated user ID ${req.params.id}`);
      res.json({ success: true, updated: this.changes });
    });
  }
});

// Create Audit Log
app.post('/api/audit', (req, res) => {
  const { user_name, action, details } = req.body;
  db.run("INSERT INTO audit_logs (user_name, action, details) VALUES (?, ?, ?)", [user_name, action, details], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// Get Audit Logs
app.get('/api/audit', (req, res) => {
  db.all("SELECT id, user_name, action, details, replace(timestamp, ' ', 'T') || 'Z' AS timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 100", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- FISCAL YEAR API ---
app.get('/api/fiscal-years', (req, res) => {
  db.all("SELECT * FROM fiscal_years WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY year DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/core/fiscal-years/active', (req, res) => {
  db.get("SELECT * FROM fiscal_years WHERE state = 'Active' AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

app.post('/api/fiscal-years', (req, res) => {
  const { year, start_date, end_date, state, desc } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  db.run("INSERT INTO fiscal_years (year, start_date, end_date, state, desc) VALUES (?, ?, ?, ?, ?)",
    [year, start_date, end_date, state, desc], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(userName, 'CREATE_FISCAL_YEAR', `Created fiscal year: ${year}`);
      res.json({ success: true, year });
    });
});

app.put('/api/fiscal-years/:year/state', (req, res) => {
  const { state } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  
  if (state === 'Active') {
    db.run("UPDATE fiscal_years SET state = 'Archived' WHERE state = 'Active'", [], (err) => {
      updateState();
    });
  } else {
    updateState();
  }

  function updateState() {
    db.run("UPDATE fiscal_years SET state = ? WHERE year = ?", [state, req.params.year], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(userName, 'UPDATE_FISCAL_YEAR_STATE', `Updated fiscal year ${req.params.year} to ${state}`);
      res.json({ success: true, updated: this.changes });
    });
  }
});

app.put('/api/fiscal-years/:year', (req, res) => {
  const { start_date, end_date, desc } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  db.run("UPDATE fiscal_years SET start_date = ?, end_date = ?, desc = ? WHERE year = ?",
    [start_date, end_date, desc, req.params.year], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(userName, 'UPDATE_FISCAL_YEAR', `Edited fiscal year: ${req.params.year}`);
      res.json({ success: true, updated: this.changes });
    });
});

app.delete('/api/fiscal-years/:year', (req, res) => {
  const userName = req.headers['x-user-name'] || 'System';
  db.run("UPDATE fiscal_years SET is_deleted = 1 WHERE year = ?", [req.params.year], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAudit(userName, 'DELETE_FISCAL_YEAR', `Soft deleted fiscal year: ${req.params.year}`);
    res.json({ success: true, deleted: this.changes });
  });
});

// --- APP REGISTRY API ---
app.get('/api/apps', (req, res) => {
  db.all("SELECT * FROM app_registry", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/apps', (req, res) => {
  const { app_id, name, entry_url, api_endpoint, required_roles, status } = req.body;
  const userName = req.headers['x-user-name'] || 'System';
  db.run("INSERT INTO app_registry (app_id, name, entry_url, api_endpoint, required_roles, status) VALUES (?, ?, ?, ?, ?, ?)",
    [app_id, name, entry_url, api_endpoint, required_roles, status], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      logAudit(userName, 'REGISTER_APP', `Registered sub-app: ${app_id}`);
      res.json({ success: true, app_id });
    });
});

app.put('/api/apps/:id', (req, res) => {
  const userName = req.headers['x-user-name'] || 'System';
  const fields = [];
  const params = [];
  
  const allowed = ['name', 'entry_url', 'api_endpoint', 'required_roles', 'status'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  });

  if (fields.length === 0) {
    return res.json({ success: true, message: 'No fields to update' });
  }

  params.push(req.params.id);
  const sql = `UPDATE app_registry SET ${fields.join(', ')} WHERE app_id = ?`;

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAudit(userName, 'UPDATE_APP', `Updated sub-app: ${req.params.id}`);
    res.json({ success: true, updated: this.changes });
  });
});

app.delete('/api/apps/:id', (req, res) => {
  const userName = req.headers['x-user-name'] || 'System';
  db.run("DELETE FROM app_registry WHERE app_id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    logAudit(userName, 'DELETE_APP', `Deleted sub-app: ${req.params.id}`);
    res.json({ success: true, deleted: this.changes });
  });
});

// --- LOCAL STORAGE GATEWAY API ---

// Upload File
app.post('/api/storage/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const userName = req.headers['x-user-name'] || 'System';
  logAudit(userName, 'UPLOAD_FILE', `Uploaded file to local storage: ${req.file.originalname}`);
  res.json({ success: true, filename: req.file.filename, path: `/storage/${req.file.filename}` });
});

// List Files
app.get('/api/storage/files', (req, res) => {
  fs.readdir(storageDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const fileList = files.map(filename => {
      const stats = fs.statSync(path.join(storageDir, filename));
      let appSource = 'Core System';
      let activity = 'General';
      let uploader = 'Unknown';
      let isDeleted = false;
      let parseFilename = filename;

      if (filename.endsWith('.deleted')) {
        isDeleted = true;
        parseFilename = filename.replace('.deleted', '');
      }

      let displayName = parseFilename;
      
      const match = parseFilename.match(/^\[(.*?)\]_\[(.*?)\]_\[(.*?)\]_\d+-(.*)/);
      if (match) {
        appSource = match[1];
        activity = match[2];
        uploader = match[3];
        displayName = match[4];
      } else {
        const matchOld = parseFilename.match(/^\[(.*?)\]_\[(.*?)\]_\d+-(.*)/);
        if (matchOld) {
          appSource = matchOld[1];
          uploader = matchOld[2];
          displayName = matchOld[3];
        } else if (parseFilename.match(/^\d+-(.*)/)) {
          displayName = parseFilename.substring(parseFilename.indexOf('-') + 1);
        }
      }
      
      return {
        filename,
        displayName,
        appSource,
        activity,
        uploader,
        isDeleted,
        url: '/rdi_mis/storage/' + parseFilename,
        size: stats.size,
        createdAt: stats.birthtime
      };
    }).sort((a, b) => b.createdAt - a.createdAt); // Newest first
    
    res.json(fileList);
  });
});

// Soft Delete File
app.delete('/api/storage/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(storageDir, filename);
  const userName = req.headers['x-user-name'] || 'System';
  
  if (fs.existsSync(filePath)) {
    fs.renameSync(filePath, filePath + '.deleted');
    logAudit(userName, 'SOFT_DELETE_FILE', `Soft deleted file: ${filename}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Clear Soft Deleted Files
app.post('/api/storage/clear-deleted', (req, res) => {
  const userName = req.headers['x-user-name'] || 'System';
  fs.readdir(storageDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let count = 0;
    files.forEach(filename => {
      if (filename.endsWith('.deleted')) {
        fs.unlinkSync(path.join(storageDir, filename));
        count++;
      }
    });
    
    logAudit(userName, 'CLEAR_DELETED_FILES', `Cleared ${count} soft deleted files`);
    res.json({ success: true, count });
  });
});

const PORT = 3801;
app.listen(PORT, () => {
  console.log(`SQLite Backend Server running on http://localhost:${PORT}`);
});
