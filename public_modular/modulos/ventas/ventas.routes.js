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

module.exports = router;