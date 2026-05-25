const db = require('../../db');

function obtenerPedidos(callback) {

    db.all(`
        SELECT *
        FROM pedidos
        ORDER BY created_at DESC
    `, callback);
}

function crearPedido(data, callback) {

    const sql = `
        INSERT INTO pedidos (
            cliente,
            telefono,
            direccion,
            detalle,
            total,
            estado,
            observaciones
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        data.cliente || '',
        data.telefono || '',
        data.direccion || '',
        data.detalle || '',
        data.total || 0,
        'pendiente',
        data.observaciones || ''
    ], function(err) {

        callback(err, {
            id: this.lastID
        });
    });
}

function actualizarEstado(id, estado, callback) {

    const sql = `
        UPDATE pedidos
        SET
            estado = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
    `;

    db.run(sql, [estado, id], callback);
}

module.exports = {
    obtenerPedidos,
    crearPedido,
    actualizarEstado
};