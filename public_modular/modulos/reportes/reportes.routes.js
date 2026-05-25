const express = require('express');

const router = express.Router();

const db = require('../../db');

/**
 * =====================================
 * REPORTE VENTAS
 * =====================================
 */
router.get('/ventas', (req, res) => {

    const desde = req.query.desde;
    const hasta = req.query.hasta;

    let sql = `
        SELECT
            id,
            cliente,
            total,
            fecha
        FROM ventas
        WHERE 1=1
    `;

    const params = [];

    // ==========================
    // FILTRO DESDE
    // ==========================
    if (desde) {

        sql += `
            AND DATE(fecha) >= DATE(?)
        `;

        params.push(desde);
    }

    // ==========================
    // FILTRO HASTA
    // ==========================
    if (hasta) {

        sql += `
            AND DATE(fecha) <= DATE(?)
        `;

        params.push(hasta);
    }

    sql += `
        ORDER BY fecha DESC
        LIMIT 200
    `;

    db.all(sql, params, (err, rows) => {

        if (err) {

            console.error(
                'Error reporte ventas:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error obteniendo reporte'
            });
        }

        // ==========================
        // TOTAL GENERAL
        // ==========================
        const totalGeneral =
            rows.reduce(
                (acc, item) =>
                    acc + Number(item.total || 0),
                0
            );

        res.json({

            totalVentas:
                rows.length,

            totalGeneral,

            ventas:
                rows || []
        });
    });
});

/**
 * =====================================
 * REPORTE CAJA
 * =====================================
 */
router.get('/caja', (req, res) => {

    const desde = req.query.desde;
    const hasta = req.query.hasta;

    let sql = `
        SELECT
            DATE(fecha) as fecha,

            SUM(
                CASE
                    WHEN tipo='apertura'
                    THEN monto
                    ELSE 0
                END
            ) as apertura,

            SUM(
                CASE
                    WHEN tipo='ingreso'
                    THEN monto
                    ELSE 0
                END
            ) as ingresos,

            SUM(
                CASE
                    WHEN tipo='egreso'
                    THEN monto
                    ELSE 0
                END
            ) as egresos,

            SUM(
                CASE
                    WHEN tipo='cierre'
                    THEN monto
                    ELSE 0
                END
            ) as cierre

        FROM caja

        WHERE 1=1
    `;

    const params = [];

    // ==========================
    // FILTRO DESDE
    // ==========================
    if (desde) {

        sql += `
            AND DATE(fecha) >= DATE(?)
        `;

        params.push(desde);
    }

    // ==========================
    // FILTRO HASTA
    // ==========================
    if (hasta) {

        sql += `
            AND DATE(fecha) <= DATE(?)
        `;

        params.push(hasta);
    }

    sql += `
        GROUP BY DATE(fecha)

        ORDER BY fecha DESC

        LIMIT 60
    `;

    db.all(sql, params, (err, rows) => {

        if (err) {

            console.error(
                'Error reporte caja:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error reporte caja'
            });
        }

        res.json(rows || []);
    });
});

/**
 * =====================================
 * REPORTE INVENTARIO
 * =====================================
 */
router.get('/inventario', (req, res) => {

    const sql = `
        SELECT
            id,
            nombre,
            precio,
            stock,
            activo,

            ROUND(
                precio * stock,
                2
            ) as valorizado

        FROM productos

        ORDER BY nombre ASC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {

            console.error(
                'Error reporte inventario:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error reporte inventario'
            });
        }

        res.json(rows || []);
    });
});

/**
 * =====================================
 * REPORTE MOVIMIENTOS STOCK
 * =====================================
 */
router.get('/movimientos', (req, res) => {

    const desde = req.query.desde;
    const hasta = req.query.hasta;

    let sql = `
        SELECT
            sm.id,
            p.nombre as producto,
            sm.tipo,
            sm.cantidad,
            sm.motivo,
            sm.usuario,
            sm.stock_anterior,
            sm.stock_nuevo,
            sm.fecha

        FROM stock_movimientos sm

        LEFT JOIN productos p
        ON p.id = sm.producto_id

        WHERE 1=1
    `;

    const params = [];

    // ==========================
    // FILTRO DESDE
    // ==========================
    if (desde) {

        sql += `
            AND DATE(sm.fecha) >= DATE(?)
        `;

        params.push(desde);
    }

    // ==========================
    // FILTRO HASTA
    // ==========================
    if (hasta) {

        sql += `
            AND DATE(sm.fecha) <= DATE(?)
        `;

        params.push(hasta);
    }

    sql += `
        ORDER BY sm.fecha DESC

        LIMIT 200
    `;

    db.all(sql, params, (err, rows) => {

        if (err) {

            console.error(
                'Error reporte movimientos:',
                err
            );

            return res.status(500).json({

                ok: false,

                error:
                    'Error reporte movimientos'
            });
        }

        res.json(rows || []);
    });
});

module.exports = router;