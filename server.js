// =====================================================
// SISTEMA DE GESTION - PIZZERIA
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
// TABLAS
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
// DEBUG (IMPORTANTE)
// =====================================================

app.get("/debug/cerrar-cajas", (req, res) => {

  db.run(`UPDATE caja SET estado='CERRADA' WHERE estado='ABIERTA'`, function(err) {

    if (err) {
      console.error("Error limpiando cajas:", err);
      return res.status(500).json({ error: "Error limpiando cajas" });
    }

    res.json({ mensaje: "Todas las cajas fueron cerradas" });

  });

});

// =====================================================
// PRODUCTOS
// =====================================================

app.get("/productos", (req, res) => {
  db.all("SELECT * FROM productos WHERE activo = 1", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// =====================================================
// CLIENTES
// =====================================================

app.get("/clientes/buscar/:telefono", (req, res) => {
  db.get(
    `SELECT * FROM clientes WHERE telefono = ?`,
    [req.params.telefono],
    (err, row) => {
      if (err) return res.status(500).json(err);
      res.json(row || null);
    }
  );
});

// =====================================================
// CAJA
// =====================================================

// ABRIR
app.post("/caja/abrir", (req, res) => {

  db.get(`SELECT * FROM caja WHERE estado='ABIERTA' LIMIT 1`, [], (err, caja) => {

    if (caja) {
      return res.status(400).json({ error: "Ya hay caja abierta" });
    }

    db.run(`INSERT INTO caja (estado) VALUES ('ABIERTA')`, function(err){
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Caja abierta", id: this.lastID });
    });

  });

});

// CERRAR
app.post("/caja/cerrar", (req, res) => {

  db.get(`SELECT * FROM caja WHERE estado='ABIERTA'`, [], (err, caja) => {

    if (!caja) {
      return res.status(400).json({ error: "No hay caja abierta" });
    }

    db.get(`
      SELECT 
        SUM(CASE WHEN tipo='INGRESO' THEN monto ELSE 0 END) ingresos,
        SUM(CASE WHEN tipo='EGRESO' THEN monto ELSE 0 END) egresos
      FROM movimientos_caja
      WHERE caja_id = ?
    `, [caja.id], (err, totales) => {

      const ingresos = totales.ingresos || 0;
      const egresos = totales.egresos || 0;
      const total = ingresos - egresos;

      db.run(`
        UPDATE caja 
        SET estado='CERRADA', monto_final=?, fecha_cierre=CURRENT_TIMESTAMP
        WHERE id=?
      `, [total, caja.id], (err) => {

        if (err) return res.status(500).json({ error: "Error al cerrar caja" });

        console.log("✅ Caja cerrada correctamente");

        res.json({
          mensaje: "Caja cerrada",
          resumen: { ingresos, egresos, total }
        });

      });

    });

  });

});

// CAJA ACTUAL
app.get("/caja/actual", (req, res) => {

  db.get(`SELECT * FROM caja WHERE estado='ABIERTA' LIMIT 1`, [], (err, caja) => {

    if (!caja) {
      return res.json({ caja: null, movimientos: [] });
    }

    db.all(
      `SELECT * FROM movimientos_caja WHERE caja_id = ?`,
      [caja.id],
      (err, movimientos) => {

        res.json({ caja, movimientos });

      }
    );

  });

});

// =====================================================
// 📋 LISTADO DE CAJAS
// =====================================================

app.get("/caja/listado", (req, res) => {

  db.all(`
    SELECT 
      id,
      fecha_apertura,
      fecha_cierre,
      estado,
      monto_final
    FROM caja
    ORDER BY id DESC
  `, [], (err, cajas) => {

    if (err) {
      return res.status(500).json({ error: "Error al obtener cajas" });
    }

    res.json(cajas);

  });

});

// =====================================================
// 📊 RESUMEN DE CAJA (HISTORIAL)
// =====================================================

// =====================================================
// 📊 RESUMEN DE CAJA
// =====================================================
app.get("/caja/resumen/:id", (req, res) => {

  const cajaId = req.params.id;

  // Obtener caja
  db.get(`SELECT * FROM caja WHERE id = ?`, [cajaId], (err, caja) => {

    if (err) return res.status(500).json({ error: "Error al obtener caja" });
    if (!caja) return res.status(404).json({ error: "Caja no encontrada" });

    // Obtener movimientos
    db.all(
      `SELECT * FROM movimientos_caja WHERE caja_id = ?`,
      [cajaId],
      (err, movimientos) => {

        if (err) return res.status(500).json({ error: "Error en movimientos" });

        // ===============================
        // 🔹 TOTALES GENERALES
        // ===============================
        let ingresos = 0;
        let egresos = 0;

        movimientos.forEach(m => {
          if (m.tipo === 'INGRESO') ingresos += m.monto;
          if (m.tipo === 'EGRESO') egresos += m.monto;
        });

        const total = ingresos - egresos;

        // ===============================
        // 🔹 TOTALES POR METODO (CORRECTO)
        // ===============================
        let metodos = {
          efectivo: 0,
          tarjeta: 0,
          transferencia: 0
        };

        movimientos.forEach(m => {

          if (m.tipo === 'INGRESO') {

            if (m.metodo_pago === 'efectivo') {
              metodos.efectivo += m.monto;
            }

            if (m.metodo_pago === 'tarjeta') {
              metodos.tarjeta += m.monto;
            }

            if (m.metodo_pago === 'transferencia') {
              metodos.transferencia += m.monto;
            }

          }

        });

        // ===============================
        // 🔹 RESPUESTA FINAL
        // ===============================
        res.json({
          caja,
          ingresos,
          egresos,
          total,
          metodos,
          movimientos
        });

      }
    );
  });

});




// =====================================================
// VENTAS
// =====================================================

app.post("/ventas", (req, res) => {

  console.log("➡️ INTENTANDO CREAR VENTA");

  const { telefono, productos, metodo_pago } = req.body;

  if (!telefono || !productos || productos.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  db.all(`SELECT * FROM caja WHERE estado='ABIERTA'`, [], (err, cajas) => {

    if (!cajas || cajas.length === 0) {
      return res.status(400).json({ error: "Caja cerrada" });
    }

    if (cajas.length > 1) {
      return res.status(500).json({ error: "Error de integridad en caja" });
    }

    const caja = cajas[0];

    let total = 0;
    productos.forEach(p => total += p.precio * p.cantidad);

    db.run(
      `INSERT INTO ventas (total_final) VALUES (?)`,
      [total],
      function(err){

        if (err) return res.status(500).json({ error: "Error al registrar venta" });

        const ventaId = this.lastID;

        productos.forEach(p => {
          db.run(
            `INSERT INTO detalle_venta 
            (venta_id, nombre_producto, cantidad, precio_unitario)
            VALUES (?,?,?,?)`,
            [ventaId, p.nombre, p.cantidad, p.precio]
          );
        });

        db.run(`
          INSERT INTO movimientos_caja
          (caja_id, tipo, categoria, monto, metodo_pago, referencia_id)
          VALUES (?, 'INGRESO', 'VENTA', ?, ?, ?)
        `, [caja.id, total, metodo_pago, ventaId]);

        res.json({ mensaje: "Venta registrada" });

      }
    );

  });

});

// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/venta.html");
});

// =====================================================
// SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log("🚀 http://localhost:3000");
});