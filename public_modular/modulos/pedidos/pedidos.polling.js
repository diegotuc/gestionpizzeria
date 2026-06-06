// ======================================================
// 🔁 POLLING OPERACIONAL
// pedidos.polling.js
// ======================================================


// ======================================================
// 📦 CACHE PEDIDOS
// ======================================================

let pedidosPrevios = [];


// ======================================================
// 📥 OBTENER PEDIDOS
// ======================================================

async function obtenerPedidos() {

    try {

        const pedidos =
            await PedidosAPI.obtenerPedidos();

        // ======================================================
        // 🔔 DETECTAR NUEVOS PEDIDOS
        // ======================================================

        const idsPrevios =
            pedidosPrevios.map(
                p => p.id
            );

        const nuevosPedidos =
            pedidos.filter(
                p => !idsPrevios.includes(p.id)
            );

        // ======================================================
        // 🔊 SONIDO NUEVO PEDIDO
        // ======================================================

        if (

            nuevosPedidos.length > 0

            &&

            pedidosPrevios.length > 0

        ) {

            sonarNuevoPedido();
        }

        // ======================================================
        // 💾 GUARDAR CACHE
        // ======================================================

        pedidosPrevios =
            [...pedidos];

        // ======================================================
        // 📦 STATE GLOBAL
        // ======================================================

        PedidosState.pedidos =
            pedidos;

        PedidosState.ultimaActualizacion =
            new Date().toISOString();

        PedidosState.sistemaActivo =
            true;

        // ======================================================
        // 🎨 RENDER
        // ======================================================

        PedidosRender.renderPedidos(
            pedidos
        );

        /*verificarDemorasAutomaticas();*/

        if (typeof verificarDemorasAutomaticas === "function") {
    verificarDemorasAutomaticas();
}
    if (typeof detectarCuelloBotella === "function") {
    detectarCuelloBotella();
}
        
        actualizarUI();

    }

    catch (err) {

        console.error(
            "❌ Error obteniendo pedidos:",
            err
        );

        PedidosState.sistemaActivo =
            false;
    }
}


// ======================================================
// 🔁 INICIAR POLLING
// ======================================================

function iniciarPollingPedidos() {

    obtenerPedidos();

    setInterval(() => {

        obtenerPedidos();

    }, 3000);

    setInterval(() => {

        actualizarUI();

    }, 1000);

    setInterval(() => {

    if (typeof verificarDemorasAutomaticas === "function") {
        verificarDemorasAutomaticas();
    }

    if (typeof detectarCuelloBotella === "function") {
        detectarCuelloBotella();
    }

}, 1000);
}


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.obtenerPedidos =
    obtenerPedidos;

window.PedidosPolling = {

    obtenerPedidos,

    iniciarPollingPedidos
};