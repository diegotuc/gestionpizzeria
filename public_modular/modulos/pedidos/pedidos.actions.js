// ======================================================
// 🎛 ACCIONES OPERACIONALES
// pedidos.actions.js
// ======================================================


// ======================================================
// 🔄 CAMBIAR ESTADO
// ======================================================

async function cambiarEstado(
    id,
    estado
) {

    if (
        PedidosState.actualizandoEstado
    ) return;

    PedidosState.actualizandoEstado =
        true;

    try {

        await fetch(
            `/api/pedidos/${id}/estado`,
            {
                method: 'PATCH',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    estado
                })
            }
        );

        // ======================================================
        // ✨ FEEDBACK VISUAL
        // ======================================================

        PedidosState.ultimoCambioEstado = {

            id,
            estado
        };

        PedidosState
            .ultimoPedidoActualizado = id;

        await obtenerPedidos();
    }

    catch (err) {

        console.error(
            '❌ Error cambiando estado:',
            err
        );
    }

    finally {

        PedidosState.actualizandoEstado =
            false;
    }
}


// ======================================================
// 📄 DETALLE PEDIDO
// ======================================================

async function verDetallePedido(id) {

    try {

        const res =
            await fetch(
                `/api/pedidos/${id}`
            );

        if (!res.ok) {

            throw new Error(
                "Error obteniendo pedido"
            );
        }

        const p =
            await res.json();

        alert(`

🍕 PEDIDO #${p.id}

👤 Cliente: ${p.cliente}
📞 Teléfono: ${p.telefono || '-'}
📍 Dirección: ${p.direccion || '-'}

📦 Detalle: ${p.detalle || '-'}

💰 Total: $${p.total}
📌 Estado: ${p.estado}

🕒 Creado: ${p.created_at || '-'}
🔄 Actualizado: ${p.updated_at || '-'}

📝 Observaciones: ${p.observaciones || '-'}

        `);
    }

    catch (err) {

        console.error(err);

        alert(
            "❌ Error obteniendo detalle"
        );
    }
}


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.cambiarEstado =
    cambiarEstado;

window.verDetallePedido =
    verDetallePedido;
