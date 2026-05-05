// modulos/ventas/ventas.controller.js

const {
    insertarVenta,
    insertarDetalle
} = require('./ventas.model');

/**
 * Crea una venta completa (cabecera + detalle)
 */
function crearVenta(data) {
    return new Promise((resolve, reject) => {

        insertarVenta(data, (err, ventaId) => {
            if (err) return reject(err);

            insertarDetalle(data.detalle, ventaId, (err2) => {
                if (err2) return reject(err2);

                resolve({
                    ok: true,
                    msg: "Venta guardada correctamente",
                    ventaId: ventaId
                });
            });
        });

    });
}

module.exports = {
    crearVenta
};