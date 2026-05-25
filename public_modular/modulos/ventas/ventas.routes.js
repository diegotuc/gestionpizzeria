// modulos/ventas/ventas.routes.js

const express = require('express');
const router = express.Router();

const { crearVenta } = require('./ventas.controller');

// POST /api/ventas
router.post('/', async (req, res) => {
    try {
        const resultado = await crearVenta(req.body);
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

router.get('/', (req, res) => {
    res.json({ ok: true, msg: "Ruta ventas OK" });
});

// =====================================
// LISTADO REAL DE VENTAS
// =====================================
router.get('/listado', (req, res) => {

    const db = require('../../db');

    const sql = `
        SELECT
            id,
            cliente,
            total,
            fecha
        FROM ventas
        ORDER BY fecha DESC
        LIMIT 100
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {

            console.error(
                'Error obteniendo ventas:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error obteniendo ventas'
            });
        }

        res.json(rows || []);
    });
});

module.exports = router;