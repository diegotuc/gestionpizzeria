// db.js

const sqlite3 = require('sqlite3').verbose();

// Conexión a la base de datos
const db = new sqlite3.Database('./pizzeria_modular.db', (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a SQLite');
    }
});

// Crear tablas automáticamente
db.serialize(() => {

    console.log('Creando tablas si no existen...');

    db.run(`
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            total REAL NOT NULL,
            metodo_pago TEXT,
            cliente_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS ventas_detalle (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venta_id INTEGER,
            producto TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (venta_id) REFERENCES ventas(id)
        )
    `);

});

module.exports = db;