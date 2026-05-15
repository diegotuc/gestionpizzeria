// modulos/ventas/ventas.model.js

const db = require('../../db');

/**
 * =====================================
 * VALIDAR STOCK DISPONIBLE
 * =====================================
 */
function validarStock(detalle) {

    return new Promise((resolve, reject) => {

        // =============================
        // SIN PRODUCTOS
        // =============================
        if (!detalle || detalle.length === 0) {

            return reject(
                new Error('No hay productos')
            );
        }

        let pendientes = detalle.length;

        // =============================
        // VALIDAR UNO POR UNO
        // =============================
        detalle.forEach(item => {

            const sql = `
                SELECT
                    id,
                    nombre,
                    stock
                FROM productos
                WHERE id = ?
            `;

            db.get(
                sql,
                [item.producto_id],

                (err, producto) => {

                    if (err) {
                        return reject(err);
                    }

                    // =====================
                    // PRODUCTO INEXISTENTE
                    // =====================
                    if (!producto) {

                        return reject(
                            new Error(
                                `Producto inexistente ID ${item.producto_id}`
                            )
                        );
                    }

                    // =====================
                    // STOCK INSUFICIENTE
                    // =====================
                    if (
                        producto.stock <
                        item.cantidad
                    ) {

                        return reject(
                            new Error(
                                `Stock insuficiente para ${producto.nombre}`
                            )
                        );
                    }

                    pendientes--;

                    // =====================
                    // TODO OK
                    // =====================
                    if (pendientes === 0) {
                        resolve(true);
                    }
                }
            );
        });
    });
}

/**
 * =====================================
 * DESCONTAR STOCK REAL
 * =====================================
 */
function descontarStock(detalle) {

    return new Promise((resolve, reject) => {

        let pendientes = detalle.length;

        detalle.forEach(item => {

            // =========================
            // UPDATE SEGURO
            // =========================
            const sql = `
                UPDATE productos
                SET stock = stock - ?
                WHERE id = ?
                AND stock >= ?
            `;

            db.run(
                sql,
                [
                    item.cantidad,
                    item.producto_id,
                    item.cantidad
                ],

                function (err) {

                    if (err) {
                        return reject(err);
                    }

                    // =====================
                    // BLOQUEO STOCK NEGATIVO
                    // =====================
                    if (this.changes === 0) {

                        return reject(
                            new Error(
                                'Stock insuficiente'
                            )
                        );
                    }

                    pendientes--;

                    if (pendientes === 0) {
                        resolve(true);
                    }
                }
            );
        });
    });
}

/**
 * =====================================
 * REGISTRAR MOVIMIENTO STOCK
 * =====================================
 */
function registrarMovimientoStock(
    detalle
) {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO stock_movimientos
            (
                producto_id,
                tipo,
                cantidad,
                motivo,
                fecha
            )
            VALUES
            (
                ?,
                'venta',
                ?,
                ?,
                datetime('now')
            )
        `;

        const stmt = db.prepare(sql);

        detalle.forEach(item => {

            stmt.run(
                [
                    item.producto_id,
                    item.cantidad,
                    'Venta automática'
                ],

                (err) => {

                    if (err) {
                        console.error(
                            'Error registrando movimiento:',
                            err
                        );
                    }
                }
            );
        });

        stmt.finalize((err) => {

            if (err) {
                return reject(err);
            }

            resolve(true);
        });
    });
}

/**
 * =====================================
 * INSERTAR VENTA
 * =====================================
 */
function insertarVenta(
    venta,
    callback
) {

    const { total } = venta;

    const sql = `
        INSERT INTO ventas
        (
            cliente,
            total,
            fecha
        )
        VALUES
        (
            ?,
            ?,
            datetime('now')
        )
    `;

    db.run(
        sql,
        ["", total],

        function (err) {

            if (err) {

                console.error(
                    "Error insertando venta:",
                    err
                );

                return callback(err);
            }

            callback(
                null,
                this.lastID
            );
        }
    );
}

/**
 * =====================================
 * INSERTAR DETALLE
 * =====================================
 */
function insertarDetalle(
    detalle,
    ventaId,
    callback
) {

    const sql = `
        INSERT INTO ventas_detalle
        (
            venta_id,
            producto,
            cantidad,
            precio_unitario,
            subtotal
        )
        VALUES
        (
            ?, ?, ?, ?, ?
        )
    `;

    const stmt = db.prepare(sql);

    detalle.forEach(item => {

        const subtotal =
            item.precio *
            item.cantidad;

        stmt.run(
            [
                ventaId,
                item.producto_id,
                item.cantidad,
                item.precio,
                subtotal
            ],

            (err) => {

                if (err) {

                    console.error(
                        "Error insertando detalle:",
                        err
                    );
                }
            }
        );
    });

    stmt.finalize(callback);
}

module.exports = {

    validarStock,

    descontarStock,

    registrarMovimientoStock,

    insertarVenta,

    insertarDetalle
};