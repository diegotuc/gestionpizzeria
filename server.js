// =====================================================
// SISTEMA DE GESTION - PIZZERIA (VERSIÓN ESTABLE)
// =====================================================

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// =====================================================
// BASE DE DATOS
// =====================================================

const db = new sqlite3.Database("./pizzeria.db", (err) => {
  if (err) console.error(err);
  else console.log("✅ SQLite conectado");
});

// =====================================================
// CREACIÓN DE TABLAS
// =====================================================

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    telefono TEXT,
    tipo_cliente TEXT,
    pizzas_acumuladas INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    precio REAL,
    activo INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_bruto REAL DEFAULT 0,
    descuento REAL DEFAULT 0,
    tipo_descuento TEXT DEFAULT 'NINGUNO',
    total_final REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS detalle_venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    nombre_producto TEXT,
    cantidad INTEGER,
    precio_unitario REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    estado TEXT DEFAULT 'ABIERTA',
    monto_inicial REAL DEFAULT 0,
    monto_final REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caja_id INTEGER,
    tipo TEXT,
    categoria TEXT,
    monto REAL,
    metodo_pago TEXT,
    referencia_id INTEGER
  )`);

});

// =====================================================
// MIGRACIÓN TELEFONO EN VENTAS
// =====================================================

db.all(`PRAGMA table_info(ventas)`, [], (err, columns) => {

  const existe = columns.some(col => col.name === "telefono");

  if (!existe) {
    db.run(`ALTER TABLE ventas ADD COLUMN telefono TEXT`);
  }

});

// =====================================================
// PRODUCTOS
// =====================================================

app.get("/productos", (req, res) => {
  db.all("SELECT * FROM productos WHERE activo = 1", [], (err, rows) => {
    res.json(rows);
  });
});

// =====================================================
// CLIENTES (LISTADO PRINCIPAL)
// =====================================================

app.get("/clientes", (req, res) => {

  const { buscar = "", tipo = "" } = req.query;

  db.all(`
    SELECT 
      c.id,
      c.nombre,
      c.telefono,
      c.pizzas_acumuladas,
      COUNT(v.id) as compras
    FROM clientes c
    LEFT JOIN ventas v ON c.telefono = v.telefono
    WHERE (c.nombre LIKE ? OR c.telefono LIKE ?)
    GROUP BY c.id
    ORDER BY c.pizzas_acumuladas DESC
  `,
  [`%${buscar}%`, `%${buscar}%`],
  (err, rows) => {

    const clientes = rows.map(c => {

      let compras = c.compras;
      if (compras === 0 && c.pizzas_acumuladas > 0) compras = 1;

      let tipo_cliente = "NUEVO";
      if (compras >= 2 && compras <= 4) tipo_cliente = "OCASIONAL";
      else if (compras >= 5) tipo_cliente = "FRECUENTE";

      return { ...c, compras, tipo_cliente };
    });

    const filtrados = tipo
      ? clientes.filter(c => c.tipo_cliente === tipo)
      : clientes;

    res.json(filtrados);

  });

});

// =====================================================
// 🔹 BUSCAR CLIENTE
// =====================================================

app.get("/clientes/buscar/:telefono", (req, res) => {

  const telefono = req.params.telefono;

  db.get(`SELECT * FROM clientes WHERE telefono = ?`,
    [telefono],
    (err, cliente) => {

      if (err) return res.status(500).json(null);
      res.json(cliente || null);

    });

});

// =====================================================
// HISTORIAL
// =====================================================

app.get("/clientes/historial/:telefono", (req, res) => {

  db.all(`
    SELECT v.fecha, SUM(d.cantidad) as pizzas
    FROM ventas v
    JOIN detalle_venta d ON v.id = d.venta_id
    WHERE v.telefono = ?
    GROUP BY v.id
    ORDER BY v.fecha DESC
  `, [req.params.telefono], (err, rows) => {

    res.json(rows || []);

  });

});

// =====================================================
// RESUMEN + FIDELIZACIÓN
// =====================================================

app.get("/clientes/resumen/:telefono", (req, res) => {

  db.all(`
    SELECT v.fecha, SUM(d.cantidad) as pizzas
    FROM ventas v
    JOIN detalle_venta d ON v.id = d.venta_id
    WHERE v.telefono = ?
    GROUP BY v.id
    ORDER BY v.fecha DESC
  `, [req.params.telefono], (err, rows) => {

    if (!rows || rows.length === 0) {
      return res.json({
        compras: 0,
        total_pizzas: 0,
        promedio_pizzas: 0,
        ultima_compra: "-"
      });
    }

    const compras = rows.length;
    const total = rows.reduce((acc, v) => acc + v.pizzas, 0);
    const promedio = (total / compras).toFixed(2);
    const ultima = new Date(rows[0].fecha).toLocaleDateString();

    const resto = total % 10;
    const faltan = 10 - resto;

    const mensaje = resto === 0 && total > 0
      ? "🎉 Tenés una pizza gratis disponible"
      : `Te faltan ${faltan} pizzas para una gratis 🍕`;

    let tipo = "NUEVO";
    if (compras >= 2 && compras <= 4) tipo = "OCASIONAL";
    else if (compras >= 5) tipo = "FRECUENTE";

    res.json({
      compras,
      total_pizzas: total,
      promedio_pizzas: promedio,
      ultima_compra: ultima,
      tipo_cliente: tipo,
      mensaje_fidelizacion: mensaje
    });

  });

});

// =====================================================
// TOP CLIENTES (PIZZAS)
// =====================================================

app.get("/clientes/top", (req, res) => {

  db.all(`
    SELECT c.*, COUNT(v.id) as compras
    FROM clientes c
    LEFT JOIN ventas v ON c.telefono = v.telefono
    GROUP BY c.id
    ORDER BY c.pizzas_acumuladas DESC
    LIMIT 10
  `, [], (err, rows) => {

    const ranking = rows.map((c, i) => ({
      posicion: i + 1,
      ...c
    }));

    res.json(ranking);

  });

});

// =====================================================
// TOP CLIENTES POR DINERO
// =====================================================

app.get("/clientes/top-dinero", (req, res) => {

  db.all(`
    SELECT 
      c.*, 
      COUNT(v.id) as compras,
      COALESCE(SUM(v.total_final),0) as total_gastado
    FROM clientes c
    LEFT JOIN ventas v ON c.telefono = v.telefono
    GROUP BY c.id
    ORDER BY total_gastado DESC
    LIMIT 10
  `, [], (err, rows) => {

    const ranking = rows.map((c, i) => ({
      posicion: i + 1,
      ...c
    }));

    res.json(ranking);

  });

});

// =====================================================
// SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log("🚀 http://localhost:3000");
});