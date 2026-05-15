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

        // ===========================
        // ERROR SQLITE
        // ===========================
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

        // ===========================
        // RESPUESTA OK
        // ===========================
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
 * MUESTRA ACTIVOS E INACTIVOS
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

            // ===========================
            // ERROR SQLITE
            // ===========================
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

            // ===========================
            // RESPUESTA OK
            // ===========================
            res.json(rows);
        });
    }
);

/**
 * =====================================
 * INGRESAR STOCK MANUALMENTE
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
        // ACTUALIZAR STOCK
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

            function (err) {

                if (err) {

                    console.error(
                        'Error actualizando stock:',
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            'Error actualizando stock'
                    });
                }

                // ======================
                // PRODUCTO NO EXISTE
                // ======================
                if (this.changes === 0) {

                    return res.status(404).json({

                        ok: false,

                        error:
                            'Producto no encontrado'
                    });
                }

                // ======================
                // REGISTRAR MOVIMIENTO
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
                        datetime('now')
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

            if (this.changes === 0) {

                return res.status(404).json({

                    ok: false,

                    error:
                        'Producto no encontrado'
                });
            }

            res.json({

                ok: true,

                msg:
                    'Producto desactivado'
            });
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

            if (this.changes === 0) {

                return res.status(404).json({

                    ok: false,

                    error:
                        'Producto no encontrado'
                });
            }

            res.json({

                ok: true,

                msg:
                    'Producto reactivado'
            });
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
        // UPDATE
        // ==========================
        const sql = `
            UPDATE productos
            SET
                nombre = ?,
                precio = ?
            WHERE id = ?
        `;

        db.run(

            sql,

            [
                nombre.trim(),
                precio,
                id
            ],

            function (err) {

                if (err) {

                    console.error(
                        'Error editando producto:',
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            'Error editando producto'
                    });
                }

                if (this.changes === 0) {

                    return res.status(404).json({

                        ok: false,

                        error:
                            'Producto no encontrado'
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

module.exports = router;