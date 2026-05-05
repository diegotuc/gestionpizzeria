// modulos/ventas/ventas.model.js

const db = require('../../db');

/**
 * Inserta una venta y devuelve el ID generado
 */
function insertarVenta(venta, callback) {
    const { fecha, total, metodo_pago, cliente_id } = venta;

    const sql = `
        INSERT INTO ventas (fecha, total, metodo_pago, cliente_id)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [fecha, total, metodo_pago, cliente_id], function (err) {
        if (err) return callback(err);

        callback(null, this.lastID);
    });
}

/**
 * Inserta los items de una venta
 */
function insertarDetalle(detalle, ventaId, callback) {
    const sql = `
        INSERT INTO ventas_detalle 
        (venta_id, producto, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(sql);

    detalle.forEach(item => {
        stmt.run([
            ventaId,
            item.producto,
            item.cantidad,
            item.precio,
            item.subtotal
        ]);
    });

    stmt.finalize(callback);
}

module.exports = {
    insertarVenta,
    insertarDetalle
};