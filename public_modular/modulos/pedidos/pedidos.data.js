// ======================================================
// 📦 DATA PEDIDOS
// pedidos.data.js
// ======================================================


// ======================================================
// 📥 OBTENER PEDIDOS
// ======================================================

async function obtenerPedidos() {

    try {

        // ======================================================
        // 🚫 EVITAR DOBLE REQUEST
        // ======================================================

        if (
            PedidosState.cargandoPedidos
        ) {

            return;
        }

        PedidosState.cargandoPedidos =
            true;

        // ======================================================
        // 📡 API
        // ======================================================

        const pedidos =
            await window.PedidosAPI
                .obtenerPedidos();

        // ======================================================
        // 📦 STATE
        // ======================================================

        PedidosState.pedidos =
            pedidos;

        // ======================================================
        // 🟢 SISTEMA ONLINE
        // ======================================================

        PedidosState.sistemaActivo =
            true;

        // ======================================================
        // 🕒 TIMESTAMP
        // ======================================================

        PedidosState.ultimaActualizacion =
            new Date().toISOString();

        // ======================================================
        // 🎨 RENDER
        // ======================================================

        window.PedidosRender
            .renderPedidos();

        // ======================================================
        // 📊 UI
        // ======================================================

        actualizarUI();
    }

    catch (err) {

        console.error(
            "❌ Error obteniendo pedidos:",
            err
        );

        // ======================================================
        // 🔴 OFFLINE
        // ======================================================

        PedidosState.sistemaActivo =
            false;
    }

    finally {

        PedidosState.cargandoPedidos =
            false;
    }
}


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.obtenerPedidos =
    obtenerPedidos;

window.PedidosData = {

    obtenerPedidos
};