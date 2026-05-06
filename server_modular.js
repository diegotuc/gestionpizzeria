const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// =====================
// DB
// =====================
const db = new sqlite3.Database('./pizzeria_modular.db', (err) => {
    if (err) {
        console.error("❌ Error SQLite:", err.message);
    } else {
        console.log("📦 SQLite conectado");
    }
});

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