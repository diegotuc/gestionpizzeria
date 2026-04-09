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

  db.run(`
CREATE TABLE IF NOT EXISTS caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME,
  estado TEXT NOT NULL DEFAULT 'ABIERTA',
  monto_inicial REAL NOT NULL DEFAULT 0,
  monto_final REAL
)
`);

db.run(`  
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caja_id INTEGER NOT NULL,
  tipo TEXT NOT NULL, -- INGRESO / EGRESO
  categoria TEXT NOT NULL, -- VENTA, GASTO, AJUSTE
  monto REAL NOT NULL,
  metodo_pago TEXT,
  referencia_id INTEGER,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (caja_id) REFERENCES caja(id)
 )
 `)

});


app.get("/debug/caja", (req, res) => {
  db.all(`SELECT * FROM movimientos_caja`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error leyendo caja" });
    }

    res.json(rows);
  });
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

    const { nombre, telefono, tipo_cliente, productos,metodo_pago } = req.body;

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

              // -------------------------
// REGISTRAR EN CAJA
// -------------------------

db.get(
  `SELECT * FROM caja WHERE estado = 'ABIERTA' LIMIT 1`,
  [],
  (err, caja) => {

    if (err) {
      console.error("Error buscando caja:", err);
      return;
    }

    const registrarMovimiento = (cajaId) => {
      db.run(
        `INSERT INTO movimientos_caja 
        (caja_id, tipo, categoria, monto, metodo_pago, referencia_id)
        VALUES (?, 'INGRESO', 'VENTA', ?, ?, ?)`,
        [cajaId, total_final, metodo_pago, ventaId],
        (err) => {
          if (err) {
            console.error("Error registrando movimiento:", err);
          }
        }
      );
    };

    // Si NO hay caja → crear una
    if (!caja) {
      db.run(
        `INSERT INTO caja (estado, monto_inicial)
         VALUES ('ABIERTA', 0)`,
        function (err) {
          if (err) {
            console.error("Error creando caja:", err);
            return;
          }

          registrarMovimiento(this.lastID);
        }
      );
    } else {
      // Si ya hay caja abierta → usarla
      registrarMovimiento(caja.id);
    }

  }
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

/*app.get("/clientes/historial/:telefono", (req, res) => {

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

});*/

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

// ===============================
// ENDPOINT: Ventas por día
// ===============================
app.get("/ventas/por-dia", (req, res) => {

  const ventas = db.prepare(`
      SELECT 
          DATE(fecha) as dia,
          COUNT(*) as compras,
          SUM(cantidad) as pizzas
      FROM ventas
      GROUP BY dia
      ORDER BY dia DESC
      LIMIT 30
  `).all();

  res.json(ventas);

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

// ======================================
// TOP CLIENTES POR PIZZAS COMPRADAS
// API: /clientes/top
// ======================================

app.get("/clientes/top", (req, res) => {

  db.all(
    `SELECT nombre, telefono, pizzas_acumuladas
     FROM clientes
     ORDER BY pizzas_acumuladas DESC
     LIMIT 10`,
    [],
    (err, rows) => {

      if (err) {
        console.error("Error obteniendo ranking:", err.message);
        return res.status(500).json({ error: "Error obteniendo ranking" });
      }

      res.json(rows);

    }
  );

});

// ======================================
// RESUMEN GENERAL DEL NEGOCIO (DASHBOARD)
// API: /dashboard/resumen
// ======================================

app.get("/dashboard/resumen", (req, res) => {

  const hoy = new Date().toISOString().slice(0,10);

  const datos = {};

  // ======================================
  // VENTAS Y FACTURACIÓN DEL DÍA
  // ======================================

  db.get(`
    SELECT 
    COUNT(*) as ventas,
    IFNULL(SUM(total_final),0) as total
    FROM ventas
    WHERE DATE(fecha) = ?
  `,[hoy],(err,row)=>{

    if(err){
      console.error("Error ventas hoy:", err);
      return res.status(500).json({error:"Error ventas hoy"});
    }

    datos.ventas = row ? row.ventas : 0;
    datos.total_dia = row ? row.total : 0;

    // ======================================
    // PIZZAS VENDIDAS HOY
    // ======================================

    db.get(`
      SELECT IFNULL(SUM(cantidad),0) as pizzas
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      WHERE DATE(v.fecha) = ?
    `,[hoy],(err,row2)=>{

      if(err){
        console.error("Error pizzas hoy:", err);
        datos.pizzas = 0;
      }else{
        datos.pizzas = row2 ? row2.pizzas : 0;
      }

      // ======================================
      // COMPRAS REALIZADAS HOY
      // (No usamos cliente_id porque no existe)
      // ======================================

      db.get(`
        SELECT COUNT(*) as clientes
        FROM ventas
        WHERE DATE(fecha) = ?
      `,[hoy],(err,row3)=>{

        if(err){
          console.error("Error compras hoy:", err);
          datos.clientes = 0;
        }else{
          datos.clientes = row3 ? row3.clientes : 0;
        }

        // ======================================
        // PIZZA MÁS VENDIDA (HISTÓRICO)
        // ======================================

        db.get(`
          SELECT nombre_producto
          FROM detalle_venta
          GROUP BY nombre_producto
          ORDER BY SUM(cantidad) DESC
          LIMIT 1
        `,[],(err,row4)=>{

          if(err){
            console.error("Error top pizza:", err);
            datos.top_pizza = "-";
          }else{
            datos.top_pizza = row4 ? row4.nombre_producto : "-";
          }

          // ======================================
          // TICKET PROMEDIO
          // ======================================

          datos.ticket_promedio =
            datos.ventas > 0
              ? Math.round(datos.total_dia / datos.ventas)
              : 0;

          // ======================================
          // RESPUESTA FINAL DEL DASHBOARD
          // ======================================

          res.json(datos);

        });

      });

    });

  });

});


// ======================================
// DASHBOARD - VENTAS DE LA SEMANA
// API: /dashboard/ventas-semana
// ======================================

app.get("/dashboard/ventas-semana", (req, res) => {

  const query = `
  SELECT
  DATE(fecha) as dia,
  SUM(total_final) as total
  FROM ventas
  WHERE fecha >= date('now','-6 day')
  GROUP BY DATE(fecha)
  ORDER BY dia
  `;

  db.all(query, [], (err, rows) => {

    if (err) {
      console.error("Error dashboard semana:", err);
      return res.status(500).json({ error: "Error ventas semana" });
    }

    res.json(rows);

  });

});

// ======================================
// DASHBOARD - PIZZAS POR SABOR
// API: /dashboard/pizzas-sabor
// ======================================

app.get("/dashboard/pizzas-sabor", (req, res) => {

  const query = `
  SELECT
  nombre_producto as sabor,
  SUM(cantidad) as total
  FROM detalle_venta
  GROUP BY nombre_producto
  ORDER BY total DESC
  LIMIT 10
  `;

  db.all(query, [], (err, rows) => {

    if (err) {
      console.error("Error pizzas sabor:", err);
      return res.status(500).json({ error: "Error pizzas sabor" });
    }

    res.json(rows);

  });

});

// ======================================
// TOP 5 PIZZAS MÁS VENDIDAS
// API: /dashboard/top-pizzas
// ======================================

app.get("/dashboard/top-pizzas", (req, res) => {

  db.all(`
    SELECT 
      nombre_producto,
      SUM(cantidad) as total
    FROM detalle_venta
    GROUP BY nombre_producto
    ORDER BY total DESC
    LIMIT 5
  `, [], (err, rows) => {

    if(err){
      console.error("Error top pizzas:", err);
      return res.status(500).json({error:"Error top pizzas"});
    }

    res.json(rows);

  });

});


// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});