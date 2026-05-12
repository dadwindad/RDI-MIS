import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'databases', 'pms_db.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM fund_types", [], (err, rows) => {
  if (err) console.error(err);
  console.log("Fund Types:", rows);
  db.close();
});
