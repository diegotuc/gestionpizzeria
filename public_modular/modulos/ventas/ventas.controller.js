// modulos/ventas/ventas.controller.js

const {
    insertarVenta,
    insertarDetalle
} = require('./ventas.model');

const db = require('../../db');

/**
 * ===================================
 * VERIFICAR SI HAY CAJA ABIERTA
 * ===================================
 */
function verificarCajaAbierta() {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT *
            FROM caja
            ORDER BY id DESC
            LIMIT 1
        `;

        db.get(sql, [], (err, row) => {

            if (err) {
                return reject(err);
            }

            // Si no hay movimientos
            if (!row) {
                return resolve(false);
            }

            // Caja abierta si el último movimiento
            // NO es cierre
            resolve(row.tipo !== 'cierre');
        });
    });
}

/**
 * ===================================
 * REGISTRAR INGRESO EN CAJA
 * ===================================
 */
function registrarIngresoCaja(
    monto,
    ventaId
) {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO caja
            (
                tipo,
                monto,
                descripcion,
                fecha
            )
            VALUES
            (
                'ingreso',
                ?,
                ?,
                datetime('now')
            )
        `;

        const descripcion =
            `Venta automática #${ventaId}`;

        db.run(
            sql,
            [monto, descripcion],
            function (err) {

                if (err) {
                    return reject(err);
                }

                resolve(true);
            }
        );
    });
}

/**
 * ===================================
 * CREAR VENTA COMPLETA
 * ===================================
 */
function crearVenta(data) {

    return new Promise(async (
        resolve,
        reject
    ) => {

        try {

            // =========================
            // VALIDAR CAJA ABIERTA
            // =========================
            const cajaAbierta =
                await verificarCajaAbierta();

            if (!cajaAbierta) {

                return reject(
                    new Error(
                        "No hay caja abierta"
                    )
                );
            }

            // =========================
            // INSERTAR VENTA
            // =========================
            insertarVenta(
                data,
                (err, ventaId) => {

                    if (err) {
                        return reject(err);
                    }

                    // =====================
                    // INSERTAR DETALLE
                    // =====================
                    insertarDetalle(
                        data.detalle,
                        ventaId,

                        async (err2) => {

                            if (err2) {
                                return reject(err2);
                            }

                            try {

                                // =====================
                                // REGISTRAR INGRESO
                                // EN CAJA
                                // =====================
                                await registrarIngresoCaja(
                                    data.total,
                                    ventaId
                                );

                                resolve({

                                    ok: true,

                                    msg:
                                        "Venta guardada correctamente",

                                    ventaId:
                                        ventaId
                                });

                            } catch (errorCaja) {

                                reject(errorCaja);
                            }
                        }
                    );
                }
            );

        } catch (error) {

            reject(error);
        }
    });
}

module.exports = {
    crearVenta
};