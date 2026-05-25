const express = require('express');

const router = express.Router();

const controller = require('./pedidos.controller');

router.get('/', controller.listar);

router.post('/', controller.crear);

router.patch('/:id/estado', controller.cambiarEstado);

module.exports = router;