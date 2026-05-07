const express = require('express');
const router = express.Router();


// ===============================
// 🟢 APERTURA
// ===============================
router.post('/apertura', (req, res) => {

    const db = req.app.locals.db;

    if (!req.body || typeof req.body.monto === "undefined") {
        return res.status(400).json({ error: "Monto requerido" });
    }

    const monto = Number(req.body.monto);

    if (isNaN(monto) || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    db.get(`
        SELECT 
          (SELECT COUNT(*) FROM caja WHERE tipo='apertura' AND date(fecha)=date('now')) as aperturas,
          (SELECT COUNT(*) FROM caja WHERE tipo='cierre' AND date(fecha)=date('now')) as cierres
    `, [], (err, row) => {

        if (err) return res.status(500).json({ error: err.message });

        if (row.aperturas > row.cierres) {
            return res.status(400).json({ error: 'Caja ya abierta' });
        }

        db.run(`
            INSERT INTO caja (tipo, monto, descripcion, fecha)
            VALUES ('apertura', ?, 'Apertura de caja', datetime('now'))
        `, [monto], (err) => {

            if (err) return res.status(500).json({ error: err.message });

            res.json({ ok: true });
        });
    });
});


// ===============================
// 🔴 CIERRE
// ===============================
router.post('/cierre', (req, res) => {

    const db = req.app.locals.db;

    if (!req.body || typeof req.body.monto === "undefined") {
        return res.status(400).json({ error: "Monto requerido" });
    }

    const monto = Number(req.body.monto);

    if (isNaN(monto) || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    db.get(`
        SELECT tipo 
        FROM caja 
        WHERE date(fecha) = date('now')
        ORDER BY id DESC
        LIMIT 1
    `, [], (err, row) => {

        if (err) return res.status(500).json({ error: err.message });

        if (!row) {
            return res.status(400).json({ error: 'No hay caja abierta' });
        }

        if (row.tipo === 'cierre') {
            return res.status(400).json({ error: 'La caja ya está cerrada' });
        }

        db.run(`
            INSERT INTO caja (tipo, monto, descripcion, fecha)
            VALUES ('cierre', ?, 'Cierre de caja', datetime('now'))
        `, [monto], (err) => {

            if (err) return res.status(500).json({ error: err.message });

            res.json({ ok: true });
        });
    });
});


// ===============================
// 📊 RESUMEN
// ===============================
router.get('/resumen', (req, res) => {

    const db = req.app.locals.db;

    db.all(`
        SELECT tipo, SUM(monto) as total
        FROM caja
        GROUP BY tipo
    `, [], (err, rows) => {

        if (err) return res.status(500).json({ error: err.message });

        const data = {
            apertura: 0,
            ingreso: 0,
            cierre: 0
        };

        rows.forEach(r => {
            data[r.tipo] = r.total || 0;
        });

        data.esperado = data.apertura + data.ingreso;
        data.diferencia = data.cierre - data.esperado;

        res.json(data);
    });
});


// ===============================
// 🟡 ESTADO
// ===============================
router.get('/estado', (req, res) => {

    const db = req.app.locals.db;

    db.get(`
        SELECT 
          (SELECT COUNT(*) FROM caja WHERE tipo='apertura' AND date(fecha)=date('now')) as aperturas,
          (SELECT COUNT(*) FROM caja WHERE tipo='cierre' AND date(fecha)=date('now')) as cierres
    `, [], (err, row) => {

        if (err) return res.status(500).json({ error: err.message });

        res.json({
            estado: row.aperturas > row.cierres ? 'ABIERTA' : 'CERRADA'
        });
    });
});


// ===============================
// 📚 HISTORIAL
// ===============================
router.get('/historial', (req, res) => {

    const db = req.app.locals.db;

    const query = `
        SELECT 
            DATE(fecha) as fecha,
            SUM(CASE WHEN tipo='apertura' THEN monto ELSE 0 END) as apertura,
            SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) as ingresos,
            SUM(CASE WHEN tipo='cierre' THEN monto ELSE 0 END) as cierre
        FROM caja
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
    `;

    db.all(query, [], (err, rows) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error historial' });
        }

        res.json(rows || []);
    });
});


// ===============================
// 📋 REPORTE DIARIO (CORREGIDO DEFINITIVO)
// ===============================
router.get('/reporte-diario', (req, res) => {

    const db = req.app.locals.db;

    const query = `
        SELECT 
            DATE(fecha) as fecha,

            SUM(CASE WHEN tipo='apertura' THEN monto ELSE 0 END) as apertura,
            SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) as ingresos,
            SUM(CASE WHEN tipo='cierre' THEN monto ELSE 0 END) as cierre

        FROM caja
        WHERE DATE(fecha) = date('now')
        GROUP BY DATE(fecha)
    `;

    db.get(query, [], (err, row) => {

        if (err) {
            console.error('Error reporte diario:', err);
            return res.status(500).json({
                error: 'Error al generar reporte'
            });
        }

        // 🔥 CLAVE: evitar NULL total
        const apertura = row?.apertura ?? 0;
        const ingresos = row?.ingresos ?? 0;
        const cierreReal = row?.cierre ?? 0;

        const esperado = apertura + ingresos;
        const diferencia = cierreReal - esperado;

        res.json({
            fecha: row?.fecha || new Date().toISOString().slice(0,10),
            apertura,
            ingresos,
            esperado,
            real: cierreReal,
            diferencia
        });
    });
});

module.exports = router;