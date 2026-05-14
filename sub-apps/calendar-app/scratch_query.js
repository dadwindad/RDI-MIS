import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'databases', 'smart_office_db.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM staff_activities WHERE visibility = 'PUBLIC'", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
