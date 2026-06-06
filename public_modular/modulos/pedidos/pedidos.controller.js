const model = require('./pedidos.model');


// ======================================================
// 📋 LISTAR PEDIDOS ACTIVOS
// ======================================================

function listar(req, res) {

    model.obtenerPedidos((err, rows) => {

    if (err) {

        return res.status(500).json({
            error: 'Error obteniendo pedidos'
        });
    }

    const data = rows.map(pedido => {

        const sla = model.calcularSLA(pedido);

        return {
            ...pedido,
            sla
        };
    });

    res.json(data);
});
}


// ======================================================
// 📋 HISTORIAL PEDIDOS
// ======================================================

function listarHistorial(req, res) {

    model.obtenerHistorial((err, rows) => {

        if (err) {

            return res.status(500).json({
                error: 'Error obteniendo historial'
            });
        }

        res.json(rows);
    });
}


// ======================================================
// 📄 DETALLE PEDIDO
// ======================================================

function obtenerDetalle(req, res) {

    const { id } = req.params;

    model.obtenerPedidoPorId(id, (err, row) => {

        if (err) {

            return res.status(500).json({
                error: 'Error obteniendo pedido'
            });
        }

        if (!row) {

            return res.status(404).json({
                error: 'Pedido no encontrado'
            });
        }

        res.json(row);
    });
}


// ======================================================
// ➕ CREAR PEDIDO
// ======================================================

function crear(req, res) {

    const data = req.body;

    if (!data.cliente) {

        return res.status(400).json({
            error: 'Cliente requerido'
        });
    }

    model.crearPedido(data, (err, result) => {

        if (err) {

            return res.status(500).json({
                error: 'Error creando pedido'
            });
        }

        res.json({
            ok: true,
            id: result.id
        });
    });
}


// ======================================================
// 🔄 CAMBIAR ESTADO
// ======================================================

function cambiarEstado(req, res) {

    const { id } = req.params;

    const { estado } = req.body;

    const estadosValidos = [
        'pendiente',
        'preparando',
        'listo',
        'entregado',
        'cancelado'
    ];

    if (!estadosValidos.includes(estado)) {

        return res.status(400).json({
            error: 'Estado inválido'
        });
    }

    model.actualizarEstado(
        id,
        estado,
        (err) => {

            if (err) {

                return res.status(500).json({
                    error:
                        'Error actualizando estado'
                });
            }

            res.json({
                ok: true
            });
        }
    );
}

// ======================================================
// 📊 MÉTRICAS OPERACIONALES
// ======================================================

function obtenerMetricas(req, res) {

    model.obtenerMetricas((err, data) => {

        if (err) {

            return res.status(500).json({
                error:
                    'Error obteniendo métricas'
            });
        }

        res.json(data);
    });
}


module.exports = {
    listar,
    listarHistorial,
    obtenerDetalle,
    crear,
    cambiarEstado,
    obtenerMetricas

};