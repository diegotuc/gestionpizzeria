// modulos/ventas/ventas.model.js

const db = require('../../db');

/**
 * ===============================
 * INSERTAR VENTA (ADAPTADO A TU DB)
 * ===============================
 */
function insertarVenta(venta, callback) {

    const { total } = venta;

    const sql = `
        INSERT INTO ventas (cliente, total, fecha)
        VALUES (?, ?, datetime('now'))
    `;

    db.run(sql, ["", total], function (err) {
        if (err) {
            console.error("Error insertando venta:", err);
            return callback(err);
        }

        callback(null, this.lastID);
    });
}

/**
 * ===============================
 * INSERTAR DETALLE (100% COMPATIBLE)
 * ===============================
 */
function insertarDetalle(detalle, ventaId, callback) {

    const sql = `
        INSERT INTO ventas_detalle 
        (venta_id, producto, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(sql);

    detalle.forEach(item => {

        const subtotal = item.precio * item.cantidad;

        stmt.run([
            ventaId,
            item.producto_id, // 👉 lo guardamos en "producto"
            item.cantidad,
            item.precio,      // 👉 precio_unitario
            subtotal
        ], (err) => {
            if (err) {
                console.error("Error insertando detalle:", err);
            }
        });
    });

    stmt.finalize(callback);
}

module.exports = {
    insertarVenta,
    insertarDetalle
};