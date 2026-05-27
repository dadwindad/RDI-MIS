import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sub-apps', 'calendar-app', 'databases', 'smart_office_db.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, title, storage_path FROM staff_activities ORDER BY id DESC LIMIT 5", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Recent activities:", rows);
  }
  db.close();
});
