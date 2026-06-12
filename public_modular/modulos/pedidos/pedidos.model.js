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
    // 📌 OBTENER ESTADO ACTUAL
    // ======================================================

    db.get(`
        SELECT estado
        FROM pedidos
        WHERE id = ?
    `, [id], (err, pedidoActual) => {

        if (err) {

            return callback(err);
        }

        if (!pedidoActual) {

            return callback(
                new Error(
                    'Pedido no encontrado'
                )
            );
        }

        const estadoAnterior =
            pedidoActual.estado;

        // ======================================================
        // 🧠 SLA OPERATIVO
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

        // ======================================================
        // 💾 ACTUALIZAR PEDIDO
        // ======================================================

        db.run(sql, params, function(err) {

            if (err) {

                console.error(
                    '❌ ERROR UPDATE PEDIDO:',
                    err
                );

                return callback(err);
            }

            // ======================================================
            // 🧠 AUDITORÍA CAMBIO ESTADO
            // ======================================================

            db.run(`

                INSERT INTO pedidos_estados (

                    pedido_id,
                    estado,
                    created_at

                )

                VALUES (

                    ?,
                    ?,
                    datetime('now','localtime')

                )

            `, [

                id,
                estado

            ], (err) => {

            if (err) {

                console.error(
                    '❌ ERROR INSERT pedidos_estados:',
                    err
                );
            }

            callback(err);
        });
                });

            });

        }

        // ======================================================
// 📊 MÉTRICAS OPERACIONALES
// ======================================================

function obtenerMetricas(callback) {

    db.get(`

        SELECT

            COUNT(
                CASE
                    WHEN estado = 'entregado'
                    THEN 1
                END
            ) as entregados,

            COUNT(
                CASE
                    WHEN estado = 'cancelado'
                    THEN 1
                END
            ) as cancelados,

            ROUND(AVG(

                CASE
                    WHEN preparando_at IS NOT NULL
                    THEN
                        (
                            strftime('%s', preparando_at)
                            -
                            strftime('%s', created_at)
                        ) / 60.0
                END

            ), 1) as promedioPreparacion,

            ROUND(AVG(

                CASE
                    WHEN listo_at IS NOT NULL
                    AND preparando_at IS NOT NULL
                    THEN
                        (
                            strftime('%s', listo_at)
                            -
                            strftime('%s', preparando_at)
                        ) / 60.0
                END

            ), 1) as promedioCocina,

            ROUND(AVG(

                CASE
                    WHEN entregado_at IS NOT NULL
                    THEN
                        (
                            strftime('%s', entregado_at)
                            -
                            strftime('%s', created_at)
                        ) / 60.0
                END

            ), 1) as promedioTotal

        FROM pedidos

    `, callback);
}

// ======================================================
// 🧠 SLA OPERATIVO - CALCULADORA
// ======================================================

function calcularSLA(pedido) {

    const now = Date.now();

    const created = new Date(pedido.created_at).getTime();
    const preparing = pedido.preparando_at ? new Date(pedido.preparando_at).getTime() : null;
    const ready = pedido.listo_at ? new Date(pedido.listo_at).getTime() : null;
    const delivered = pedido.entregado_at ? new Date(pedido.entregado_at).getTime() : null;

    // ======================================================
    // ⏱ TIEMPOS POR ETAPA (MINUTOS)
    // ======================================================

    /*const tiempoCola = preparing
        ? (preparing - created) / 60000
        : (now - created) / 60000;
    
    const tiempoCocina = (preparing && ready)
        ? (ready - preparing) / 60000
        : (preparing ? (now - preparing) / 60000 : 0);

    const tiempoSalida = (ready && delivered)
        ? (delivered - ready) / 60000
        : 0;*/

        // ======================================================
// ⏱ TIEMPOS POR ETAPA (MINUTOS)
// ======================================================

const tiempoCola = Math.max(

    0,

    preparing
        ? (preparing - created) / 60000
        : (now - created) / 60000
);

const tiempoCocina = Math.max(

    0,

    (preparing && ready)
        ? (ready - preparing) / 60000
        : (
            preparing
                ? (now - preparing) / 60000
                : 0
        )
);

const tiempoSalida = Math.max(

    0,

    (ready && delivered)
        ? (delivered - ready) / 60000
        : 0
);

    // ======================================================
    // 🚨 UMBRALES SLA
    // ======================================================

    const SLA = {
        cola: { atencion: 5, critico: 10 },
        cocina: { atencion: 15, critico: 25 },
        salida: { atencion: 10, critico: 20 }
    };

    let nivel = "normal";
    let critico = false;

    // ======================================================
    // 🧠 EVALUACIÓN SLA
    // ======================================================

    if (tiempoCola > SLA.cola.critico ||
        tiempoCocina > SLA.cocina.critico ||
        tiempoSalida > SLA.salida.critico) {

        nivel = "critico";
        critico = true;
    }

    else if (tiempoCola > SLA.cola.atencion ||
        tiempoCocina > SLA.cocina.atencion ||
        tiempoSalida > SLA.salida.atencion) {

        nivel = "atencion";
    }

    // ======================================================
    // 📊 SCORE LIGERO (IA SIMPLE OPERATIVA)
    // ======================================================

    const score =
        (tiempoCola * 1.2) +
        (tiempoCocina * 1.5) +
        (tiempoSalida * 1.0);

    return {
        tiempoCola: parseFloat(tiempoCola.toFixed(1)),
        tiempoCocina: parseFloat(tiempoCocina.toFixed(1)),
        tiempoSalida: parseFloat(tiempoSalida.toFixed(1)),
        nivel,
        critico,
        score: parseFloat(score.toFixed(2))
    };
}


module.exports = {
    obtenerPedidos,
    obtenerHistorial,
    obtenerPedidoPorId,
    crearPedido,
    actualizarEstado,
    obtenerMetricas,
    calcularSLA
};