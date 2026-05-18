const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'databases', 'core_platform.sqlite');
const db = new sqlite3.Database(dbPath);

const app = {
  app_id: 'org-qa',
  name: 'QA & Performance Metrics',
  entry_url: 'http://localhost:3805/remoteEntry.js',
  api_endpoint: 'http://localhost:3805',
  required_roles: '["admin","manager","staff"]',
  status: 'Active'
};

db.run(
  "INSERT OR REPLACE INTO app_registry (app_id, name, entry_url, api_endpoint, required_roles, status) VALUES (?, ?, ?, ?, ?, ?)",
  [app.app_id, app.name, app.entry_url, app.api_endpoint, app.required_roles, app.status],
  function(err) {
    if (err) {
      console.error('Failed to register app:', err.message);
    } else {
      console.log('QA Sub-App registered successfully.');
    }
    db.close();
  }
);
