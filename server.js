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
// CREACIÓN DE TABLAS (CORRECTA)
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

  // 🔥 YA INCLUYE DESCUENTOS (NO HAY ALTER TABLE)
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
// 🔹 MIGRACIÓN: AGREGAR TELEFONO A VENTAS
// Solo se ejecuta si la columna no existe
// =====================================================

db.all(`PRAGMA table_info(ventas)`, [], (err, columns) => {

  if (err) {
    console.error("Error verificando columnas", err);
    return;
  }

  const existe = columns.some(col => col.name === "telefono");

  if (!existe) {
    db.run(`ALTER TABLE ventas ADD COLUMN telefono TEXT`, (err) => {
      if (err) console.error("Error agregando columna telefono", err);
      else console.log("✅ Columna telefono agregada a ventas");
    });
  }

});

// =====================================================
// DEBUG
// =====================================================

app.get("/debug/cerrar-cajas", (req, res) => {
  db.run(`UPDATE caja SET estado='CERRADA' WHERE estado='ABIERTA'`, function(err) {
    if (err) return res.status(500).json({ error: "Error limpiando cajas" });
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

// =====================================================
// 🔹 LISTADO DE CLIENTES (MEJORADO)
// Calcula tipo de cliente dinámicamente según compras
// =====================================================

// =====================================================
// 🔹 LISTADO DE CLIENTES (CON FILTRO REAL)
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

    if (err) {
      console.error("Error listando clientes", err);
      return res.status(500).json({ error: "Error obteniendo clientes" });
    }

    const clientes = rows.map(c => {

      // ajuste histórico
      let compras = c.compras;
      if (compras === 0 && c.pizzas_acumuladas > 0) {
        compras = 1;
      }

      // clasificación
      let tipo_cliente = "NUEVO";

      if (compras >= 2 && compras <= 4) {
        tipo_cliente = "OCASIONAL";
      } else if (compras >= 5) {
        tipo_cliente = "FRECUENTE";
      }

      return {
        ...c,
        compras,
        tipo_cliente
      };

    });

    // =====================================================
    // 🔹 FILTRO POR TIPO (AHORA SÍ FUNCIONA)
    // =====================================================

    const filtrados = tipo
      ? clientes.filter(c => c.tipo_cliente === tipo)
      : clientes;

    res.json(filtrados);

  });

});

// =====================================================
// 🔹 HISTORIAL DE CLIENTE (VERSIÓN ESTABLE)
// Compatible con ventas viejas sin teléfono
// =====================================================

app.get("/clientes/historial/:telefono", (req, res) => {

  const telefono = req.params.telefono;

  if (!telefono) {
    return res.json([]);
  }

  db.all(`
    SELECT 
      v.id as venta_id,
      v.fecha,
      SUM(d.cantidad) as pizzas
    FROM ventas v
    JOIN detalle_venta d ON v.id = d.venta_id
    WHERE v.telefono = ?
    GROUP BY v.id
    ORDER BY v.fecha DESC
  `, [telefono], (err, rows) => {

    if (err) {
      console.error("❌ Error en historial:", err);
      return res.json([]);
    }

    // 🔹 Asegura siempre array válido
    if (!Array.isArray(rows)) {
      return res.json([]);
    }

    res.json(rows);

  });

});

// =====================================================
// 🔹 RESUMEN DE CLIENTE
// Calcula métricas clave para análisis de comportamiento
// =====================================================

app.get("/clientes/resumen/:telefono", (req, res) => {

  const telefono = req.params.telefono;

  if (!telefono) {
    return res.json({ error: "Teléfono requerido" });
  }

  db.all(`
    SELECT 
      v.fecha,
      SUM(d.cantidad) as pizzas
    FROM ventas v
    JOIN detalle_venta d ON v.id = d.venta_id
    WHERE v.telefono = ?
    GROUP BY v.id
    ORDER BY v.fecha DESC
  `, [telefono], (err, rows) => {

    if (err) {
      console.error("Error resumen cliente", err);
      return res.json({ error: "Error obteniendo resumen" });
    }

    if (!rows || rows.length === 0) {
      return res.json({
        compras: 0,
        total_pizzas: 0,
        promedio_pizzas: 0,
        ultima_compra: "-"
      });
    }

    const compras = rows.length;

    const total_pizzas = rows.reduce((acc, v) => acc + v.pizzas, 0);

    const promedio = (total_pizzas / compras).toFixed(2);

    const ultima = new Date(rows[0].fecha).toLocaleDateString();

    
    // =====================================================
// 🔹 SISTEMA DE FIDELIZACIÓN
// Calcula progreso hacia recompensa
// =====================================================

const clientePizzas = total_pizzas;

const resto = clientePizzas % 10;
let faltan = 10 - resto;

let mensaje_fidelizacion = "";

if (resto === 0 && clientePizzas > 0) {
  mensaje_fidelizacion = "🎉 Tenés una pizza gratis disponible";
} else {
  mensaje_fidelizacion = `Te faltan ${faltan} pizzas para una gratis 🍕`;
}

    // =====================================================
    // 🔹 CLASIFICACIÓN AUTOMÁTICA DE CLIENTE
    // Determina el tipo según cantidad de compras
    // =====================================================

    let tipo_cliente = "NUEVO";

    if (compras >= 2 && compras <= 4) {
      tipo_cliente = "OCASIONAL";
    } else if (compras >= 5) {
      tipo_cliente = "FRECUENTE";
    }

    res.json({
      compras,
      total_pizzas,
      promedio_pizzas: promedio,
      ultima_compra: ultima,
      tipo_cliente,
      faltan_pizzas: faltan,
  mensaje_fidelizacion
    });

  });
});

  // =====================================================
// 🔹 LISTADO DE CLIENTES
// Devuelve todos los clientes con filtros opcionales
// NO afecta lógica existente
// =====================================================

app.get("/clientes", (req, res) => {

  const { buscar = "", tipo = "" } = req.query;

  let query = `
    SELECT * FROM clientes
    WHERE 1=1
  `;

  const params = [];

  // =====================================================
  // 🔹 FILTRO POR NOMBRE O TELÉFONO
  // Permite búsqueda parcial
  // =====================================================
  if (buscar) {
    query += ` AND (nombre LIKE ? OR telefono LIKE ?)`;
    params.push(`%${buscar}%`, `%${buscar}%`);
  }

  // =====================================================
  // 🔹 FILTRO POR TIPO DE CLIENTE
  // NUEVO / OCASIONAL / FRECUENTE
  // =====================================================
  if (tipo) {
    query += ` AND tipo_cliente = ?`;
    params.push(tipo);
  }

  // =====================================================
  // 🔹 ORDEN
  // Clientes con más pizzas primero (más importantes)
  // =====================================================
  query += ` ORDER BY pizzas_acumuladas DESC`;

  db.all(query, params, (err, rows) => {

    if (err) {
      console.error("Error listando clientes", err);
      return res.status(500).json({ error: "Error obteniendo clientes" });
    }

    res.json(rows);

  });

});


// =====================================================
// CAJA
// =====================================================

app.post("/caja/abrir", (req, res) => {
  db.get(`SELECT * FROM caja WHERE estado='ABIERTA'`, [], (err, caja) => {
    if (caja) return res.status(400).json({ error: "Ya hay caja abierta" });

    db.run(`INSERT INTO caja (estado) VALUES ('ABIERTA')`, function(err){
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Caja abierta", id: this.lastID });
    });
  });
});

app.post("/caja/cerrar", (req, res) => {

  db.get(`SELECT * FROM caja WHERE estado='ABIERTA'`, [], (err, caja) => {

    if (!caja) return res.status(400).json({ error: "No hay caja abierta" });

    db.get(`
      SELECT 
        SUM(CASE WHEN tipo='INGRESO' THEN monto ELSE 0 END) ingresos,
        SUM(CASE WHEN tipo='EGRESO' THEN monto ELSE 0 END) egresos
      FROM movimientos_caja
      WHERE caja_id = ?
    `, [caja.id], (err, totales) => {

      const ingresos = totales?.ingresos || 0;
      const egresos = totales?.egresos || 0;
      const total = ingresos - egresos;

      db.run(`
        UPDATE caja 
        SET estado='CERRADA', monto_final=?, fecha_cierre=CURRENT_TIMESTAMP
        WHERE id=?
      `, [total, caja.id], (err) => {

        if (err) return res.status(500).json({ error: "Error al cerrar caja" });

        res.json({
          mensaje: "Caja cerrada",
          resumen: { ingresos, egresos, total }
        });

      });

    });

  });

});

app.get("/caja/actual", (req, res) => {

  db.get(`SELECT * FROM caja WHERE estado='ABIERTA'`, [], (err, caja) => {

    if (!caja) return res.json({ caja: null, movimientos: [] });

    db.all(`SELECT * FROM movimientos_caja WHERE caja_id = ?`,
      [caja.id],
      (err, movimientos) => {
        res.json({ caja, movimientos });
      }
    );

  });

});

// =====================================================
// VENTAS
// =====================================================

// LISTAR
app.get("/ventas", (req, res) => {

  db.all(`
    SELECT 
      id,
      fecha,
      total_bruto,
      descuento,
      total_final,
      tipo_descuento
    FROM ventas
    ORDER BY fecha DESC
  `, [], (err, rows) => {

    if (err) return res.status(500).json(err);
    res.json(rows);

  });

});

// FILTRO POR FECHA
app.get("/ventas-rango", (req, res) => {

  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ error: "Fechas requeridas" });
  }

  db.all(`
    SELECT 
      id,
      fecha,
      total_bruto,
      descuento,
      total_final,
      tipo_descuento
    FROM ventas
    WHERE DATE(fecha) BETWEEN DATE(?) AND DATE(?)
    ORDER BY fecha DESC
  `, [desde, hasta], (err, rows) => {

    if (err) return res.status(500).json(err);
    res.json(rows);

  });

});

// DETALLE
app.get("/ventas/:id", (req, res) => {
  db.all(`SELECT * FROM detalle_venta WHERE venta_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

// CREAR VENTA (CON DESCUENTO REAL)
app.post("/ventas", (req, res) => {

  const {
    telefono,
    productos,
    metodo_pago,
    descuento = 0,
    tipo_descuento = "NINGUNO"
  } = req.body;

  if (!telefono || !productos || productos.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  db.get(`SELECT * FROM caja WHERE estado='ABIERTA'`, [], (err, caja) => {

    if (!caja) return res.status(400).json({ error: "Caja cerrada" });

    let total_bruto = 0;
    productos.forEach(p => total_bruto += p.precio * p.cantidad);

    const total_final = total_bruto - descuento;

    db.run(`
    INSERT INTO ventas (total_bruto, descuento, tipo_descuento, total_final, telefono)
    VALUES (?,?,?,?,?)`,
    [total_bruto, descuento, tipo_descuento, total_final, telefono],
    function(err){

      if (err) return res.status(500).json({ error: "Error al registrar venta" });

      const ventaId = this.lastID;

      productos.forEach(p => {
        db.run(`
          INSERT INTO detalle_venta 
          (venta_id, nombre_producto, cantidad, precio_unitario)
          VALUES (?,?,?,?)`,
          [ventaId, p.nombre, p.cantidad, p.precio]
        );
      });

      db.run(`
        INSERT INTO movimientos_caja
        (caja_id, tipo, categoria, monto, metodo_pago, referencia_id)
        VALUES (?, 'INGRESO', 'VENTA', ?, ?, ?)`,
        [caja.id, total_final, metodo_pago, ventaId]
      );

      // =====================================================
// 🔹 GESTIÓN AUTOMÁTICA DE CLIENTE
// Crea o actualiza cliente y acumula pizzas compradas
// =====================================================

// Calcular total de pizzas de la venta
let totalPizzas = 0;
productos.forEach(p => totalPizzas += p.cantidad);

// 🔥 BONUS: si compra 5 o más pizzas → +1 extra
let bonus = 0;
if (totalPizzas >= 5) {
  bonus = 1;
}

const totalFinalPizzas = totalPizzas + bonus; 




// Buscar cliente por teléfono
db.get(`SELECT * FROM clientes WHERE telefono = ?`, [telefono], (err, cliente) => {

  if (err) {
    console.error("Error buscando cliente", err);
    return;
  }

  // =====================================================
  // 🔹 CLIENTE NO EXISTE → CREAR
  // =====================================================
  if (!cliente) {

    db.run(`
      INSERT INTO clientes (nombre, telefono, tipo_cliente, pizzas_acumuladas)
      VALUES (?, ?, 'REGULAR', ?)
    `,
    [
      "Cliente", // nombre por defecto (luego se puede mejorar)
      telefono,
      totalFinalPizzas
    ],
    (err) => {
      if (err) console.error("Error creando cliente", err);
    });

  } 
  // =====================================================
  // 🔹 CLIENTE EXISTE → ACTUALIZAR
  // =====================================================
  else {

    const nuevasPizzas = cliente.pizzas_acumuladas + totalFinalPizzas;

    db.run(`
      UPDATE clientes
      SET pizzas_acumuladas = ?
      WHERE telefono = ?
    `,
    [nuevasPizzas, telefono],
    (err) => {
      if (err) console.error("Error actualizando cliente", err);
    });

  }

});
      res.json({ mensaje: "Venta registrada" });

    });

  });

});

// =====================================================
// ESTADISTICAS
// =====================================================

app.get("/estadisticas", (req, res) => {

  db.get(`
    SELECT SUM(total_final) as total_hoy
    FROM ventas
    WHERE DATE(fecha) = DATE('now')
  `, [], (err, hoy) => {

    db.get(`
      SELECT SUM(total_final) as total_mes
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')
    `, [], (err, mes) => {

      db.get(`
        SELECT 
          SUM(cantidad) as total_pizzas,
          nombre_producto as pizza_top
        FROM detalle_venta
        GROUP BY nombre_producto
        ORDER BY total_pizzas DESC
        LIMIT 1
      `, [], (err, top) => {

        res.json({
          total_hoy: hoy?.total_hoy || 0,
          total_mes: mes?.total_mes || 0,
          total_pizzas: top?.total_pizzas || 0,
          pizza_top: top?.pizza_top || "-"
        });

      });

    });

  });

});

// GRAFICO
app.get("/ventas-por-dia", (req, res) => {

  db.all(`
    SELECT 
      DATE(fecha) as dia,
      SUM(total_final) as total
    FROM ventas
    GROUP BY dia
    ORDER BY dia ASC
  `, [], (err, rows) => {

    if (err) return res.status(500).json(err);
    res.json(rows);

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