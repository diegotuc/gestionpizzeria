// =====================================================
// SISTEMA DE GESTION - PIZZERIA
// SERVIDOR PRINCIPAL (Node + Express + SQLite)
// =====================================================


// =====================================================
// IMPORTACIONES
// =====================================================

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");


// =====================================================
// CONFIGURACION GENERAL
// =====================================================

const app = express();
const PORT = 3000;


// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// SERVIR ARCHIVOS HTML / CSS / JS
app.use(express.static("public"));


// =====================================================
// CONEXION A BASE DE DATOS
// =====================================================

const db = new sqlite3.Database("./pizzeria.db", (err) => {
  if (err) {
    console.error("❌ Error al conectar base de datos:", err.message);
  } else {
    console.log("✅ Conectado a SQLite");
  }
});


// =====================================================
// CREACION DE TABLAS
// =====================================================

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      telefono TEXT,
      tipo_cliente TEXT,
      pizzas_acumuladas INTEGER DEFAULT 0,
      fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      precio REAL,
      activo INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_bruto REAL,
      descuento REAL,
      total_final REAL,
      tipo_descuento TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS detalle_venta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      nombre_producto TEXT,
      cantidad INTEGER,
      precio_unitario REAL,
      FOREIGN KEY(venta_id) REFERENCES ventas(id)
    )
  `);

});


// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {
  res.send("🍕 Servidor funcionando correctamente");
});


// =====================================================
// OBTENER PRODUCTOS ACTIVOS
// =====================================================

app.get("/productos", (req, res) => {

  db.all("SELECT * FROM productos WHERE activo = 1", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });

});

// =====================================================
// CARGAR PRODUCTOS INICIALES
// =====================================================

app.get("/init-productos", (req, res) => {

  db.run(`INSERT INTO productos (nombre, precio) VALUES ('Muzzarella', 2500)`);
  db.run(`INSERT INTO productos (nombre, precio) VALUES ('Especial', 3000)`);
  db.run(`INSERT INTO productos (nombre, precio) VALUES ('Napolitana', 2800)`);

  res.send("Productos iniciales cargados");
});


// =====================================================
// GUARDAR VENTA + DETALLE
// =====================================================

// =====================================================
// CREAR VENTA + FIDELIZACION CLIENTE
// =====================================================

app.post("/ventas", (req, res) => {

  //const telefono = req.body.telefono;
  const pizzas = req.body.pizzas;
  
  let cliente = clientes.find(c => c.telefono === telefono);
  
  if (cliente) {
    cliente.pizzas += pizzas;
    cliente.historial.push({
      fecha: new Date(),
      pizzas: pizzas
    });
  } else {
    clientes.push({
      telefono: telefono,
      pizzas: pizzas,
      historial: [{
        fecha: new Date(),
        pizzas: pizzas
      }]
    });
  }


  const { nombre, telefono, tipo_cliente, productos } = req.body;

  if (!telefono || !productos || productos.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  // -------------------------
  // CALCULAR PIZZAS DE ESTA VENTA
  // -------------------------

  let pizzasVenta = 0;
  let precios = [];
  let total_bruto = 0;

  productos.forEach(p => {
    pizzasVenta += p.cantidad;
    total_bruto += p.precio * p.cantidad;

    for (let i = 0; i < p.cantidad; i++) {
      precios.push(p.precio);
    }
  });

  // -------------------------
  // BUSCAR CLIENTE
  // -------------------------

  db.get(
    `SELECT * FROM clientes WHERE telefono = ?`,
    [telefono],
    (err, cliente) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error buscando cliente" });
      }

      // -------------------------
      // SI NO EXISTE → CREAR CLIENTE
      // -------------------------

      if (!cliente) {

        db.run(
          `INSERT INTO clientes (nombre, telefono, tipo_cliente, pizzas_acumuladas)
           VALUES (?, ?, ?, ?)`,
          [nombre || "Cliente", telefono, tipo_cliente, pizzasVenta]
        );

        cliente = {
          pizzas_acumuladas: 0
        };
      }

      const acumuladasAntes = cliente.pizzas_acumuladas || 0;
      const acumuladasAhora = acumuladasAntes + pizzasVenta;

      // -------------------------
      // CALCULAR PROMO
      // -------------------------

      const bloquesAntes = Math.floor(acumuladasAntes / 5);
      const bloquesAhora = Math.floor(acumuladasAhora / 5);

      const promosActivadas = bloquesAhora - bloquesAntes;

      let descuento = 0;

      if (promosActivadas > 0) {

        precios.sort((a, b) => a - b);

        const precioMasBarato = precios[0];

        descuento = precioMasBarato * 0.25 * promosActivadas;
      }

      const total_final = total_bruto - descuento;

      // -------------------------
      // GUARDAR VENTA
      // -------------------------

      db.run(
        `INSERT INTO ventas (total_bruto, descuento, total_final, tipo_descuento)
         VALUES (?, ?, ?, ?)`,
        [
          total_bruto,
          descuento,
          total_final,
          descuento > 0 ? "promo_fidelizacion" : "ninguno"
        ],
        function (err) {

          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error guardando venta" });
          }

          const ventaId = this.lastID;

          // -------------------------
          // GUARDAR DETALLE
          // -------------------------

          productos.forEach(p => {

            db.run(
              `INSERT INTO detalle_venta 
              (venta_id, nombre_producto, cantidad, precio_unitario)
              VALUES (?, ?, ?, ?)`,
              [
                ventaId,
                p.nombre,
                p.cantidad,
                p.precio
              ]
            );

          });

          // -------------------------
          // ACTUALIZAR ACUMULADAS
          // -------------------------

          db.run(
            `UPDATE clientes 
             SET pizzas_acumuladas = ?
             WHERE telefono = ?`,
            [acumuladasAhora, telefono]
          );

          res.json({
            mensaje: "Venta registrada",
            descuento,
            acumuladas: acumuladasAhora,
            promos_activadas: promosActivadas
          });

        }

      );

    }
  );

});

 

// =====================================================
// BUSCAR CLIENTE POR TELEFONO
// =====================================================

app.get("/clientes/buscar/:telefono", (req, res) => {

  const telefono = req.params.telefono;

  db.get(
    `SELECT * FROM clientes WHERE telefono = ?`,
    [telefono],
    (err, row) => {

      if (err) {
        console.error("Error buscando cliente:", err.message);
        return res.status(500).json({ error: "Error al buscar cliente" });
      }

      if (!row) {
        return res.json(null);
      }

      res.json(row);

    }
  );

});

// =====================================================
// HISTORIAL DE VENTAS POR CLIENTE
// =====================================================

app.get("/clientes/historial/:telefono", (req, res) => {

  const telefono = req.params.telefono;

  db.all(
    `
    SELECT 
      v.fecha,
      SUM(d.cantidad) as pizzas
    FROM ventas v
    JOIN detalle_venta d ON v.id = d.venta_id
    JOIN clientes c ON c.telefono = ?
    GROUP BY v.id
    ORDER BY v.fecha DESC
    `,
    [telefono],
    (err, rows) => {

      if (err) {
        console.error("Error obteniendo historial:", err.message);
        return res.status(500).json({ error: "Error al obtener historial" });
      }

      res.json(rows);

    }
  );

});

// =====================================================
// RESUMEN INTELIGENTE DE CLIENTE
// Total compras, pizzas compradas, promedio y última compra
// =====================================================

app.get("/clientes/resumen/:telefono", (req, res) => {

  const telefono = req.params.telefono;
  
  db.all(
  
  `SELECT 
      ventas.fecha,
      SUM(detalle_venta.cantidad) as pizzas
  FROM ventas
  JOIN detalle_venta 
      ON ventas.id = detalle_venta.venta_id
  JOIN clientes 
      ON clientes.telefono = ?
  GROUP BY ventas.id
  ORDER BY ventas.fecha DESC
  `,
  
  [telefono],
  
  (err, rows)=>{
  
  if(err){
  console.error("Error resumen cliente:", err);
  return res.json({error:"Error al obtener resumen"});
  }
  
  if(rows.length === 0){
  return res.json({
  compras:0,
  total_pizzas:0,
  promedio_pizzas:0,
  ultima_compra:"-"
  });
  }
  
  const compras = rows.length;
  
  const totalPizzas = rows.reduce((acc,r)=>acc + r.pizzas,0);
  
  const promedio = (totalPizzas / compras).toFixed(2);
  
  const ultimaCompra = new Date(rows[0].fecha).toLocaleDateString();
  
  res.json({
  
  compras: compras,
  total_pizzas: totalPizzas,
  promedio_pizzas: promedio,
  ultima_compra: ultimaCompra
  
  });
  
  }
  
  );
  
  });


// =====================================================
// LISTAR TODAS LAS VENTAS
// =====================================================

app.get("/ventas", (req, res) => {

  db.all(`
    SELECT id, fecha, total_bruto, descuento, total_final, tipo_descuento
    FROM ventas
    ORDER BY id DESC
  `, [], (err, rows) => {

    if (err) {
      console.error("Error obteniendo ventas:", err.message);
      res.status(500).json({ error: "Error al obtener ventas" });
    } else {
      res.json(rows);
    }

  });

});


// =====================================================
// OBTENER DETALLE DE UNA VENTA
// =====================================================

app.get("/ventas/:id", (req, res) => {

  const { id } = req.params;

  db.all(
    `SELECT nombre_producto, cantidad, precio_unitario
     FROM detalle_venta
     WHERE venta_id = ?`,
    [id],
    (err, rows) => {

      if (err) {
        console.error("Error al obtener detalle:", err.message);
        res.status(500).json({ error: "Error al obtener detalle" });
      } else {
        res.json(rows);
      }

    }
  );

});


// =====================================================
// DEBUG - VER TABLAS
// =====================================================

app.get("/debug-tablas", (req, res) => {

  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });

});

// =====================================================
// ESTADISTICAS GENERALES
// =====================================================

app.get("/estadisticas", (req, res) => {

  const estadisticas = {};

  db.serialize(() => {

    // TOTAL VENDIDO HOY
    db.get(`
      SELECT IFNULL(SUM(total_final),0) as total
      FROM ventas
      WHERE date(fecha) = date('now')
    `, [], (err, row) => {
      estadisticas.total_hoy = row.total;
    });

    // TOTAL VENDIDO ESTE MES
    db.get(`
      SELECT IFNULL(SUM(total_final),0) as total
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m','now')
    `, [], (err, row) => {
      estadisticas.total_mes = row.total;
    });

    // TOTAL PIZZAS VENDIDAS
    db.get(`
      SELECT IFNULL(SUM(cantidad),0) as total
      FROM detalle_venta
    `, [], (err, row) => {
      estadisticas.total_pizzas = row.total;
    });

    // PIZZA MAS VENDIDA
    db.get(`
      SELECT nombre_producto, SUM(cantidad) as total
      FROM detalle_venta
      GROUP BY nombre_producto
      ORDER BY total DESC
      LIMIT 1
    `, [], (err, row) => {

      estadisticas.pizza_top = row ? row.nombre_producto : "Ninguna";

      res.json(estadisticas);

    });

  });

});

// =====================================================
// DATOS PARA GRAFICO - VENTAS POR DIA
// =====================================================

app.get("/ventas-por-dia", (req, res) => {

  db.all(`
    SELECT date(fecha) as dia, 
           SUM(total_final) as total
    FROM ventas
    GROUP BY date(fecha)
    ORDER BY dia ASC
  `, [], (err, rows) => {

    if (err) {
      console.error("Error obteniendo ventas por día:", err.message);
      res.status(500).json({ error: "Error obteniendo datos" });
    } else {
      res.json(rows);
    }

  });

});

// ===============================
// DEBUG TEMPORAL
// ===============================

app.get("/debug/detalle", (req, res) => {
  db.all("PRAGMA table_info(detalle_venta);", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// ===============================
// DEBUG TEMPORAL DE CLIENTES
// ===============================

app.get("/debug/clientes", (req, res) => {
  db.all("SELECT id, nombre, telefono, pizzas_acumuladas FROM clientes", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});