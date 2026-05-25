const express = require('express');

const path = require('path');
//const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.json());

const PORT = 3000;

// =====================
// DB
// =====================
/*const db = new sqlite3.Database('./pizzeria_modular.db', (err) => {
    if (err) {
        console.error("❌ Error SQLite:", err.message);
    } else {
        console.log("📦 SQLite conectado");
    }
});*/

const db = require('./public_modular/db');

app.locals.db = db;

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public_modular')));

// =====================
// ROUTES
// =====================

// Ventas (no tocar)
const ventasRoutes = require('./public_modular/modulos/ventas/ventas.routes');
app.use('/api/ventas', ventasRoutes);

// Caja
const cajaControlRoutes = require('./modulos/cajaControl/cajaControl.routes');
app.use('/api/caja', cajaControlRoutes);

// Inventario
const inventarioRoutes = require('./public_modular/modulos/inventario/inventario.routes');

app.use('/api/inventario', inventarioRoutes);

// Dashboard
const dashboardRoutes =
require('./public_modular/modulos/dashboard/dashboard.routes');

app.use('/api/dashboard', dashboardRoutes);

// Reportes
const reportesRoutes =
require('./public_modular/modulos/reportes/reportes.routes');

app.use('/api/reportes', reportesRoutes);

// Pedidos
const pedidosRoutes =
require('./public_modular/modulos/pedidos/pedidos.routes');

console.log(pedidosRoutes);

app.use('/api/pedidos', pedidosRoutes);

// =====================
// INVENTARIO - TABLAS
// =====================

// Productos
db.run(`
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        stock REAL NOT NULL DEFAULT 0,
        activo INTEGER DEFAULT 1
    )
`);

// Movimientos de stock
db.run(`
    CREATE TABLE IF NOT EXISTS stock_movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        cantidad REAL NOT NULL,
        motivo TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(producto_id)
            REFERENCES productos(id)
    )
`);

// =====================
// AUDITORÍA PRODUCTOS
// =====================
db.run(`
    CREATE TABLE IF NOT EXISTS auditoria_productos (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        producto_id INTEGER NOT NULL,

        accion TEXT NOT NULL,

        valor_anterior TEXT,

        valor_nuevo TEXT,

        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(producto_id)
            REFERENCES productos(id)
    )
`);

// =====================
// PEDIDOS
// =====================

console.log("🔥 CREANDO TABLA PEDIDOS");

db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        cliente TEXT NOT NULL,

        telefono TEXT,

        direccion TEXT,

        detalle TEXT,

        total REAL NOT NULL DEFAULT 0,

        estado TEXT NOT NULL DEFAULT 'pendiente',

        observaciones TEXT,

        created_at DATETIME DEFAULT (
            datetime('now', 'localtime')
        ),

        updated_at DATETIME DEFAULT (
            datetime('now', 'localtime')
        )
    )
`, (err) => {

    if (err) {
        console.error("❌ Error creando pedidos:", err.message);
    } else {
        console.log("✅ Tabla pedidos OK");
    }
});

// =====================
// TEST
// =====================
app.get('/api/test', (req, res) => {
    res.json({ ok: true });
});

// =====================
// START
// =====================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});