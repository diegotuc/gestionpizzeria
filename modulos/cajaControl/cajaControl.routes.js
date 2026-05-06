const express = require('express');
const router = express.Router();

// ===============================
// 🟢 APERTURA
// ===============================
router.post('/apertura', (req, res) => {
    const db = req.app.locals.db;
    const monto = Number(req.body.monto);

    if (!monto || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    db.get(`
        SELECT 
          (SELECT COUNT(*) FROM caja 
           WHERE tipo='apertura' AND date(fecha)=date('now')) as aperturas,
          (SELECT COUNT(*) FROM caja 
           WHERE tipo='cierre' AND date(fecha)=date('now')) as cierres
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
    const monto = Number(req.body.monto);

    if (!monto || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    // 👉 buscamos la ÚLTIMA operación del día
    db.get(`
        SELECT tipo 
        FROM caja 
        WHERE date(fecha) = date('now')
        ORDER BY id DESC
        LIMIT 1
    `, [], (err, row) => {

        if (err) return res.status(500).json({ error: err.message });

        // ❌ nunca se abrió hoy
        if (!row) {
            return res.status(400).json({ error: 'No hay caja abierta' });
        }

        // ❌ ya está cerrada
        if (row.tipo === 'cierre') {
            return res.status(400).json({ error: 'La caja ya está cerrada' });
        }

        // ✔ cerrar caja
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
          (SELECT COUNT(*) FROM caja 
           WHERE tipo='apertura' AND date(fecha)=date('now')) as aperturas,
          (SELECT COUNT(*) FROM caja 
           WHERE tipo='cierre' AND date(fecha)=date('now')) as cierres
    `, [], (err, row) => {

        if (err) return res.status(500).json({ error: err.message });

        res.json({
            estado: row.aperturas > row.cierres ? 'ABIERTA' : 'CERRADA'
        });
    });
});

module.exports = router;