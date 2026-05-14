const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'databases', 'core_platform.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM app_registry", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
