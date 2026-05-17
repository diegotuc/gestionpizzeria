const express = require('express');

const router = express.Router();

// ===============================
// DB
// ===============================
const db = require('../../db');

// ===============================
// TEST
// ===============================
router.get('/test', (req, res) => {

    res.json({
        ok: true,
        modulo: 'inventario funcionando'
    });
});

// ===============================
// PRODUCTOS REALES DESDE SQLITE
// ===============================
router.get('/productos', (req, res) => {

    const sql = `
        SELECT
            id,
            nombre,
            precio,
            stock
        FROM productos
        WHERE activo = 1
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {

            console.error(
                'Error obteniendo productos:',
                err
            );

            return res.status(500).json({
                ok: false,
                error: 'Error obteniendo productos'
            });
        }

        res.json(rows);
    });
});

/**
 * =====================================
 * CREAR PRODUCTO
 * =====================================
 */
router.post(

    '/productos',

    (req, res) => {

        const {
            nombre,
            precio,
            stock
        } = req.body;

        // ==========================
        // VALIDACIONES
        // ==========================
        if (!nombre || nombre.trim() === '') {

            return res.status(400).json({

                ok: false,

                error:
                    'Nombre requerido'
            });
        }

        if (
            precio === undefined
            ||
            isNaN(precio)
        ) {

            return res.status(400).json({

                ok: false,

                error:
                    'Precio inválido'
            });
        }

        if (
            stock === undefined
            ||
            isNaN(stock)
            ||
            stock < 0
        ) {

            return res.status(400).json({

                ok: false,

                error:
                    'Stock inválido'
            });
        }

        // ==========================
        // INSERT
        // ==========================
        const sql = `
            INSERT INTO productos
            (
                nombre,
                precio,
                stock,
                activo
            )
            VALUES
            (
                ?,
                ?,
                ?,
                1
            )
        `;

        db.run(

            sql,

            [
                nombre.trim(),
                precio,
                stock
            ],

            function (err) {

                if (err) {

                    console.error(
                        'Error creando producto:',
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            'Error creando producto'
                    });
                }

                res.json({

                    ok: true,

                    id: this.lastID,

                    msg:
                        'Producto creado correctamente'
                });
            }
        );
    }
);

/**
 * =====================================
 * PRODUCTOS ADMIN
 * =====================================
 */
router.get(

    '/productos-admin',

    (req, res) => {

        const sql = `
            SELECT
                id,
                nombre,
                precio,
                stock,
                activo
            FROM productos
            ORDER BY nombre ASC
        `;

        db.all(sql, [], (err, rows) => {

            if (err) {

                console.error(
                    'Error obteniendo productos admin:',
                    err
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error obteniendo productos'
                });
            }

            res.json(rows);
        });
    }
);

/**
 * =====================================
 * INGRESAR STOCK
 * =====================================
 */
router.post(
    '/ingresar-stock',

    (req, res) => {

        const {
            producto_id,
            cantidad,
            motivo
        } = req.body;

        // ==========================
        // VALIDACIONES
        // ==========================
        if (!producto_id) {

            return res.status(400).json({

                ok: false,

                error:
                    'producto_id requerido'
            });
        }

        if (!cantidad || cantidad <= 0) {

            return res.status(400).json({

                ok: false,

                error:
                    'cantidad inválida'
            });
        }

        // ==========================
        // OBTENER STOCK ACTUAL
        // ==========================
        const sqlBuscar = `
            SELECT stock
            FROM productos
            WHERE id = ?
        `;

        db.get(

            sqlBuscar,

            [producto_id],

            (errBuscar, productoActual) => {

                if (errBuscar) {

                    console.error(
                        'Error obteniendo producto:',
                        errBuscar
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            'Error obteniendo producto'
                    });
                }

                if (!productoActual) {

                    return res.status(404).json({

                        ok: false,

                        error:
                            'Producto no encontrado'
                    });
                }

                const stockAnterior =
                    Number(productoActual.stock);

                // ==========================
                // UPDATE STOCK
                // ==========================
                const sqlUpdate = `
                    UPDATE productos
                    SET stock = stock + ?
                    WHERE id = ?
                `;

                db.run(

                    sqlUpdate,

                    [
                        cantidad,
                        producto_id
                    ],

                    function (errUpdate) {

                        if (errUpdate) {

                            console.error(
                                'Error actualizando stock:',
                                errUpdate
                            );

                            return res.status(500).json({

                                ok: false,

                                error:
                                    'Error actualizando stock'
                            });
                        }

                        const stockNuevo =
                            stockAnterior + Number(cantidad);

                        // ======================
                        // AUDITORÍA
                        // ======================
                        const sqlAuditoria = `
                            INSERT INTO auditoria_productos
                            (
                                producto_id,
                                accion,
                                valor_anterior,
                                valor_nuevo,
                                fecha
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?,
                                datetime('now', 'localtime')
                            )
                        `;

                        const valorAnterior =
                            JSON.stringify({
                                stock:
                                    stockAnterior
                            });

                        const valorNuevo =
                            JSON.stringify({

                                stock:
                                    stockNuevo,

                                cantidad_ingresada:
                                    cantidad,

                                motivo:
                                    motivo || 'Ingreso manual'
                            });

                        db.run(

                            sqlAuditoria,

                            [
                                producto_id,
                                'ingreso_stock',
                                valorAnterior,
                                valorNuevo
                            ],

                            (errAuditoria) => {

                                if (errAuditoria) {

                                    console.error(
                                        'Error auditoría stock:',
                                        errAuditoria
                                    );
                                }

                                // ======================
                                // MOVIMIENTO STOCK
                                // ======================
                                const sqlMovimiento = `
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
                                        'ingreso',
                                        ?,
                                        ?,
                                        datetime('now', 'localtime')
                                    )
                                `;

                                db.run(

                                    sqlMovimiento,

                                    [
                                        producto_id,
                                        cantidad,
                                        motivo || 'Ingreso manual'
                                    ],

                                    (err2) => {

                                        if (err2) {

                                            console.error(
                                                'Error registrando movimiento:',
                                                err2
                                            );

                                            return res.status(500).json({

                                                ok: false,

                                                error:
                                                    'Error registrando movimiento'
                                            });
                                        }

                                        res.json({

                                            ok: true,

                                            msg:
                                                'Stock actualizado correctamente'
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);

/**
 * =====================================
 * DESACTIVAR PRODUCTO
 * =====================================
 */
router.put(

    '/productos/:id/desactivar',

    (req, res) => {

        const id = req.params.id;

        const sql = `
            UPDATE productos
            SET activo = 0
            WHERE id = ?
        `;

        db.run(sql, [id], function (err) {

            if (err) {

                console.error(
                    'Error desactivando producto:',
                    err
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error desactivando producto'
                });
            }

            // ==========================
            // AUDITORÍA
            // ==========================
            const sqlAuditoria = `
                INSERT INTO auditoria_productos
                (
                    producto_id,
                    accion,
                    valor_anterior,
                    valor_nuevo,
                    fecha
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    datetime('now', 'localtime')
                )
            `;

            db.run(

                sqlAuditoria,

                [
                    id,
                    'desactivar_producto',

                    JSON.stringify({
                        estado: 'activo'
                    }),

                    JSON.stringify({
                        estado: 'desactivado'
                    })
                ],

                (errAuditoria) => {

                    if (errAuditoria) {

                        console.error(
                            'Error auditoría:',
                            errAuditoria
                        );
                    }

                    res.json({

                        ok: true,

                        msg:
                            'Producto desactivado'
                    });
                }
            );
        });
    }
);

/**
 * =====================================
 * REACTIVAR PRODUCTO
 * =====================================
 */
router.put(

    '/productos/:id/reactivar',

    (req, res) => {

        const id = req.params.id;

        const sql = `
            UPDATE productos
            SET activo = 1
            WHERE id = ?
        `;

        db.run(sql, [id], function (err) {

            if (err) {

                console.error(
                    'Error reactivando producto:',
                    err
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error reactivando producto'
                });
            }

            // ==========================
            // AUDITORÍA
            // ==========================
            const sqlAuditoria = `
                INSERT INTO auditoria_productos
                (
                    producto_id,
                    accion,
                    valor_anterior,
                    valor_nuevo,
                    fecha
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    datetime('now', 'localtime')
                )
            `;

            db.run(

                sqlAuditoria,

                [
                    id,
                    'reactivar_producto',

                    JSON.stringify({
                        estado: 'desactivado'
                    }),

                    JSON.stringify({
                        estado: 'activo'
                    })
                ],

                (errAuditoria) => {

                    if (errAuditoria) {

                        console.error(
                            'Error auditoría:',
                            errAuditoria
                        );
                    }

                    res.json({

                        ok: true,

                        msg:
                            'Producto reactivado'
                    });
                }
            );
        });
    }
);

/**
 * =====================================
 * EDITAR PRODUCTO
 * =====================================
 */
router.put(

    '/productos/:id',

    (req, res) => {

        const id = req.params.id;

        const {
            nombre,
            precio
        } = req.body;

        // ==========================
        // VALIDACIONES
        // ==========================
        if (!nombre || nombre.trim() === '') {

            return res.status(400).json({

                ok: false,

                error:
                    'Nombre requerido'
            });
        }

        if (
            precio === undefined
            ||
            isNaN(precio)
        ) {

            return res.status(400).json({

                ok: false,

                error:
                    'Precio inválido'
            });
        }

        // ==========================
        // PRODUCTO ACTUAL
        // ==========================
        const sqlBuscar = `
            SELECT
                nombre,
                precio
            FROM productos
            WHERE id = ?
        `;

        db.get(

            sqlBuscar,

            [id],

            (errBuscar, productoActual) => {

                if (errBuscar) {

                    console.error(
                        'Error buscando producto:',
                        errBuscar
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            'Error buscando producto'
                    });
                }

                if (!productoActual) {

                    return res.status(404).json({

                        ok: false,

                        error:
                            'Producto no encontrado'
                    });
                }

                // ==========================
                // UPDATE
                // ==========================
                const sqlUpdate = `
                    UPDATE productos
                    SET
                        nombre = ?,
                        precio = ?
                    WHERE id = ?
                `;

                db.run(

                    sqlUpdate,

                    [
                        nombre.trim(),
                        precio,
                        id
                    ],

                    function (errUpdate) {

                        if (errUpdate) {

                            console.error(
                                'Error editando producto:',
                                errUpdate
                            );

                            return res.status(500).json({

                                ok: false,

                                error:
                                    'Error editando producto'
                            });
                        }

                        // ======================
                        // AUDITORÍA
                        // ======================
                        const sqlAuditoria = `
                            INSERT INTO auditoria_productos
                            (
                                producto_id,
                                accion,
                                valor_anterior,
                                valor_nuevo,
                                fecha
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?,
                                datetime('now', 'localtime')
                            )
                        `;

                        const valorAnterior =
                            JSON.stringify({

                                nombre:
                                    productoActual.nombre,

                                precio:
                                    productoActual.precio
                            });

                        const valorNuevo =
                            JSON.stringify({

                                nombre:
                                    nombre.trim(),

                                precio:
                                    precio
                            });

                        db.run(

                            sqlAuditoria,

                            [
                                id,
                                'editar_producto',
                                valorAnterior,
                                valorNuevo
                            ],

                            (errAuditoria) => {

                                if (errAuditoria) {

                                    console.error(
                                        'Error registrando auditoría:',
                                        errAuditoria
                                    );

                                    return res.status(500).json({

                                        ok: false,

                                        error:
                                            'Producto actualizado pero auditoría falló'
                                    });
                                }

                                res.json({

                                    ok: true,

                                    msg:
                                        'Producto actualizado'
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

/**
 * =====================================
 * HISTORIAL AUDITORÍA
 * =====================================
 */
router.get(

    '/auditoria',

    (req, res) => {

        const sql = `
            SELECT
                a.id,
                a.producto_id,
                p.nombre AS producto_nombre,
                a.accion,
                a.valor_anterior,
                a.valor_nuevo,
                a.fecha
            FROM auditoria_productos a

            LEFT JOIN productos p
                ON p.id = a.producto_id

            ORDER BY a.fecha DESC

            LIMIT 50
        `;

        db.all(sql, [], (err, rows) => {

            if (err) {

                console.error(
                    'Error obteniendo auditoría:',
                    err
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error obteniendo auditoría'
                });
            }

            res.json(rows);
        });
    }
);

/**
 * =====================================
 * MÉTRICAS INVENTARIO
 * =====================================
 */
router.get(

    '/metricas',

    (req, res) => {

        const sql = `
            SELECT

                COUNT(
                    CASE
                        WHEN activo = 1
                        THEN 1
                    END
                ) AS productosActivos,

                COUNT(
                    CASE
                        WHEN activo = 0
                        THEN 1
                    END
                ) AS productosInactivos,

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
                ) AS valorTotalInventario

            FROM productos
        `;

        db.get(sql, [], (err, row) => {

            if (err) {

                console.error(
                    'Error obteniendo métricas:',
                    err
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        'Error obteniendo métricas'
                });
            }

            res.json({

                productosActivos:
                    row.productosActivos || 0,

                productosInactivos:
                    row.productosInactivos || 0,

                productosCriticos:
                    row.productosCriticos || 0,

                productosSinStock:
                    row.productosSinStock || 0,

                valorTotalInventario:
                    row.valorTotalInventario || 0
            });
        });
    }
);

module.exports = router;