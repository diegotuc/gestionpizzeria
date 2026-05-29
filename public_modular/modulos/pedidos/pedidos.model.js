const db = require('../../db');


// ======================================================
// 📋 PEDIDOS ACTIVOS
// ======================================================

function obtenerPedidos(callback) {

    db.all(`
        SELECT *
        FROM pedidos
        ORDER BY created_at DESC
    `, callback);
}


// ======================================================
// 📋 HISTORIAL PEDIDOS
// ======================================================

function obtenerHistorial(callback) {

    db.all(`
        SELECT *
        FROM pedidos
        WHERE estado IN (
            'entregado',
            'cancelado'
        )
        ORDER BY updated_at DESC
        LIMIT 100
    `, callback);
}


// ======================================================
// 📄 PEDIDO POR ID
// ======================================================

function obtenerPedidoPorId(
    id,
    callback
) {

    db.get(`
        SELECT *
        FROM pedidos
        WHERE id = ?
    `, [id], callback);
}


// ======================================================
// ➕ CREAR PEDIDO
// ======================================================

function crearPedido(data, callback) {

    const sql = `
    INSERT INTO pedidos (

        cliente,
        telefono,
        direccion,
        detalle,
        total,
        estado,
        observaciones,

        created_at,
        updated_at,

        pendiente_at

    )
    VALUES (

        ?, ?, ?, ?, ?, ?, ?,

        datetime('now', 'localtime'),
        datetime('now', 'localtime'),

        datetime('now', 'localtime')
    )
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


// ======================================================
// 🔄 ACTUALIZAR ESTADO
// ======================================================

function actualizarEstado(
    id,
    estado,
    callback
) {

    // ======================================================
    // 🧠 AUDITORÍA OPERATIVA REAL
    // ======================================================

// ======================================================
// 🧠 SLA OPERATIVO - TIMESTAMPS POR ESTADO
// ======================================================

let sql = '';
let params = [];

if (estado === 'preparando') {

    sql = `
        UPDATE pedidos
        SET
            estado = ?,

            preparando_at =
                datetime('now','localtime'),

            updated_at =
                datetime('now','localtime')

        WHERE id = ?
    `;

    params = [estado, id];
}

else if (estado === 'listo') {

    sql = `
        UPDATE pedidos
        SET
            estado = ?,

            listo_at =
                datetime('now','localtime'),

            updated_at =
                datetime('now','localtime')

        WHERE id = ?
    `;

    params = [estado, id];
}

else if (estado === 'entregado') {

    sql = `
        UPDATE pedidos
        SET
            estado = ?,

            entregado_at =
                datetime('now','localtime'),

            updated_at =
                datetime('now','localtime')

        WHERE id = ?
    `;

    params = [estado, id];
}

else if (estado === 'cancelado') {

    sql = `
        UPDATE pedidos
        SET
            estado = ?,

            cancelado_at =
                datetime('now','localtime'),

            updated_at =
                datetime('now','localtime')

        WHERE id = ?
    `;

    params = [estado, id];
}

else {

    sql = `
        UPDATE pedidos
        SET
            estado = ?,

            updated_at =
                datetime('now','localtime')

        WHERE id = ?
    `;

    params = [estado, id];
}

db.run(sql, params, callback);

}


module.exports = {
    obtenerPedidos,
    obtenerHistorial,
    obtenerPedidoPorId,
    crearPedido,
    actualizarEstado
};