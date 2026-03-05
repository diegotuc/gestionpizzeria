const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./pizzeria.db");

db.all("PRAGMA table_info(clientes);", [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Estructura tabla clientes:");
    console.table(rows);
  }
  db.close();
});