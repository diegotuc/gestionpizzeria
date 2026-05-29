const express = require('express');

const router = express.Router();

const controller = require('./pedidos.controller');


// ======================================================
// 📋 PEDIDOS ACTIVOS
// ======================================================

router.get('/', controller.listar);


// ======================================================
// 📋 HISTORIAL PEDIDOS
// ======================================================

router.get(
    '/historial',
    controller.listarHistorial
);


// ======================================================
// 📄 DETALLE PEDIDO
// ======================================================

router.get(
    '/:id',
    controller.obtenerDetalle
);


// ======================================================
// ➕ CREAR PEDIDO
// ======================================================

router.post('/', controller.crear);


// ======================================================
// 🔄 CAMBIAR ESTADO
// ======================================================

router.patch(
    '/:id/estado',
    controller.cambiarEstado
);


module.exports = router;