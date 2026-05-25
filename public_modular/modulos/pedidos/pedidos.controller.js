const model = require('./pedidos.model');

function listar(req, res) {

    model.obtenerPedidos((err, rows) => {

        if (err) {
            return res.status(500).json({
                error: 'Error obteniendo pedidos'
            });
        }

        res.json(rows);
    });
}

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

    model.actualizarEstado(id, estado, (err) => {

        if (err) {
            return res.status(500).json({
                error: 'Error actualizando estado'
            });
        }

        res.json({
            ok: true
        });
    });
}

module.exports = {
    listar,
    crear,
    cambiarEstado
};