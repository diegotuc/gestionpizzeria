const express = require('express');

const router = express.Router();

const db = require('../../db');

/**
 * =====================================
 * RESUMEN DASHBOARD ADMIN
 * =====================================
 */
router.get('/resumen', (req, res) => {

    // ==============================
    // MÉTRICAS VENTAS HOY
    // ==============================
    const sqlVentas = `
        SELECT

            COUNT(*) AS ventasHoy,

            ROUND(
                SUM(total),
                2
            ) AS montoVentasHoy

        FROM ventas

        WHERE DATE(fecha) =
        DATE('now', 'localtime')
    `;

    // ==============================
    // MÉTRICAS INVENTARIO
    // ==============================
    const sqlInventario = `
        SELECT

            COUNT(
                CASE
                    WHEN activo = 1
                    THEN 1
                END
            ) AS productosActivos,

            COUNT(
                CASE
                    WHEN stock <= 5
                    THEN 1
                END
            ) AS productosCriticos,

            COUNT(
                CASE
                    WHEN stock <= 0
                    THEN 1
                END
            ) AS productosSinStock,

            ROUND(
                SUM(precio * stock),
                2
            ) AS valorInventario

        FROM productos
    `;

    // ==============================
    // ESTADO CAJA
    // ==============================
    const sqlCaja = `
        SELECT tipo
        FROM caja
        ORDER BY id DESC
        LIMIT 1
    `;

    // ==============================
    // ÚLTIMAS VENTAS
    // ==============================
    const sqlUltimasVentas = `
        SELECT
            id,
            cliente,
            total,
            fecha
        FROM ventas
        ORDER BY id DESC
        LIMIT 5
    `;

    // ==============================
    // ÚLTIMOS MOVIMIENTOS
    // ==============================
    const sqlMovimientos = `
        SELECT
            sm.id,
            p.nombre AS producto,
            sm.tipo,
            sm.cantidad,
            sm.fecha
        FROM stock_movimientos sm

        LEFT JOIN productos p
            ON p.id = sm.producto_id

        ORDER BY sm.id DESC
        LIMIT 5
    `;

    // ==============================
    // ÚLTIMA AUDITORÍA
    // ==============================
    const sqlAuditoria = `
        SELECT
            a.id,
            p.nombre AS producto,
            a.accion,
            a.fecha
        FROM auditoria_productos a

        LEFT JOIN productos p
            ON p.id = a.producto_id

        ORDER BY a.id DESC
        LIMIT 5
    `;

    // ==============================
    // CONSULTA VENTAS
    // ==============================
    db.get(sqlVentas, [], (errVentas, ventas) => {

        if (errVentas) {

            console.error(
                'Error métricas ventas:',
                errVentas
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error obteniendo ventas'
            });
        }

        // ==========================
        // CONSULTA INVENTARIO
        // ==========================
        db.get(sqlInventario, [], (errInv, inventario) => {

            if (errInv) {

                console.error(
                    'Error métricas inventario:',
                    errInv
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error obteniendo inventario'
                });
            }

            // ======================
            // CONSULTA CAJA
            // ======================
            db.get(sqlCaja, [], (errCaja, caja) => {

                if (errCaja) {

                    console.error(
                        'Error estado caja:',
                        errCaja
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            'Error obteniendo caja'
                    });
                }

                // ======================
                // ÚLTIMAS VENTAS
                // ======================
                db.all(sqlUltimasVentas, [], (errUV, ultimasVentas) => {

                    if (errUV) {

                        console.error(
                            'Error últimas ventas:',
                            errUV
                        );

                        return res.status(500).json({

                            ok: false,

                            error:
                                'Error obteniendo últimas ventas'
                        });
                    }

                    // ======================
                    // MOVIMIENTOS
                    // ======================
                    db.all(sqlMovimientos, [], (errMov, movimientos) => {

                        if (errMov) {

                            console.error(
                                'Error movimientos:',
                                errMov
                            );

                            return res.status(500).json({

                                ok: false,

                                error:
                                    'Error obteniendo movimientos'
                            });
                        }

                        // ======================
                        // AUDITORÍA
                        // ======================
                        db.all(sqlAuditoria, [], (errAud, auditoria) => {

                            if (errAud) {

                                console.error(
                                    'Error auditoría:',
                                    errAud
                                );

                                return res.status(500).json({

                                    ok: false,

                                    error:
                                        'Error obteniendo auditoría'
                                });
                            }

                            const estadoCaja =
                                !caja
                                    ? 'CERRADA'
                                    : caja.tipo === 'cierre'
                                        ? 'CERRADA'
                                        : 'ABIERTA';

                            // ==================
                            // RESPUESTA FINAL
                            // ==================
                            res.json({

                                ventasHoy:
                                    ventas?.ventasHoy || 0,

                                montoVentasHoy:
                                    ventas?.montoVentasHoy || 0,

                                cajaEstado:
                                    estadoCaja,

                                productosActivos:
                                    inventario?.productosActivos || 0,

                                productosCriticos:
                                    inventario?.productosCriticos || 0,

                                productosSinStock:
                                    inventario?.productosSinStock || 0,

                                valorInventario:
                                    inventario?.valorInventario || 0,

                                ultimasVentas:
                                    ultimasVentas || [],

                                movimientosStock:
                                    movimientos || [],

                                auditoriaAdmin:
                                    auditoria || []
                            });
                        });
                    });
                });
            });
        });
    });
});

/**
 * =====================================
 * VENTAS ÚLTIMOS 7 DÍAS
 * =====================================
 */
router.get('/ventas-7dias', (req, res) => {

    const sql = `
        SELECT

            DATE(fecha) AS fecha,

            COUNT(*) AS cantidadVentas,

            ROUND(
                SUM(total),
                2
            ) AS totalVentas

        FROM ventas

        WHERE DATE(fecha) >=
            DATE('now', '-6 days', 'localtime')

        GROUP BY DATE(fecha)

        ORDER BY DATE(fecha) ASC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {

            console.error(
                'Error ventas 7 días:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error obteniendo analytics'
            });
        }

        res.json(rows || []);
    });
});

/**
 * =====================================
 * KPIs DASHBOARD
 * =====================================
 */
router.get('/kpis', (req, res) => {

    const sqlHoy = `
        SELECT

            COUNT(*) AS ventasHoy,

            ROUND(
                SUM(total),
                2
            ) AS montoHoy

        FROM ventas

        WHERE DATE(fecha) =
            DATE('now', 'localtime')
    `;

    const sqlAyer = `
        SELECT

            COUNT(*) AS ventasAyer,

            ROUND(
                SUM(total),
                2
            ) AS montoAyer

        FROM ventas

        WHERE DATE(fecha) =
            DATE('now', '-1 day', 'localtime')
    `;

    db.get(sqlHoy, [], (errHoy, hoy) => {

        if (errHoy) {

            console.error(
                'Error KPI hoy:',
                errHoy
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error KPIs'
            });
        }

        db.get(sqlAyer, [], (errAyer, ayer) => {

            if (errAyer) {

                console.error(
                    'Error KPI ayer:',
                    errAyer
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error KPIs'
                });
            }

            const montoHoy =
                Number(hoy?.montoHoy || 0);

            const montoAyer =
                Number(ayer?.montoAyer || 0);

            let diferencia = 0;

            if (montoAyer > 0) {

                diferencia =
                    (
                        (
                            montoHoy - montoAyer
                        ) / montoAyer
                    ) * 100;
            }

            res.json({

                ventasHoy:
                    hoy?.ventasHoy || 0,

                ventasAyer:
                    ayer?.ventasAyer || 0,

                montoHoy,

                montoAyer,

                diferenciaPorcentual:
                    Number(
                        diferencia.toFixed(2)
                    ),

                tendencia:
                    diferencia >= 0
                        ? 'POSITIVA'
                        : 'NEGATIVA'
            });
        });
    });
});

/**
 * =====================================
 * PRODUCTOS MÁS VENDIDOS
 * =====================================
 */
/**
 * =====================================
 * PRODUCTOS MÁS VENDIDOS
 * =====================================
 */
/**
 * =====================================
 * PRODUCTOS MÁS VENDIDOS
 * =====================================
 */
router.get('/productos-top', (req, res) => {

    const sql = `
        SELECT

            p.nombre,

            SUM(vd.cantidad)
                AS totalVendido

        FROM ventas_detalle vd

        LEFT JOIN productos p
            ON p.id = CAST(vd.producto AS INTEGER)

        GROUP BY vd.producto

        ORDER BY totalVendido DESC

        LIMIT 5
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {

            console.error(
                'Error productos top:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error ranking productos'
            });
        }

        res.json(rows || []);
    });
});
module.exports = router;