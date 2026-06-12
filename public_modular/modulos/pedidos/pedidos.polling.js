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

        if (

        window.PedidosMonitor

        &&

        PedidosMonitor.verificarDemorasAutomaticas

    ) {

        PedidosMonitor
            .verificarDemorasAutomaticas();
    }    
        
          PedidosUI.actualizarUI();
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

    //
// ======================================================
// 🛡 EVITAR DOBLE INICIALIZACIÓN
// ======================================================
//

if (PedidosState.pollingIniciado) {

    console.warn(
        "⚠ Polling ya iniciado"
    );

    return;
}

    obtenerPedidos();

    //
// ======================================================
// 🔒 MARCAR POLLING ACTIVO
// ======================================================
//

PedidosState.pollingIniciado = true;

//
// ======================================================
// 🔁 POLLING PEDIDOS
// ======================================================
//

PedidosState.intervalos.pedidos =
    setInterval(() => {

        obtenerPedidos();

    }, 3000);


//
// ======================================================
// 🎨 ACTUALIZACIÓN UI
// ======================================================
//

PedidosState.intervalos.ui =
    setInterval(() => {

        PedidosUI.actualizarUI();

    }, 1000);


//
// ======================================================
// 🚨 MONITOREO OPERACIONAL
// ======================================================
//

PedidosState.intervalos.monitor =
    setInterval(() => {

        if (

            window.PedidosMonitor

            &&

            PedidosMonitor.verificarDemorasAutomaticas

        ) {

            PedidosMonitor
                .verificarDemorasAutomaticas();
        }

        if (

            window.PedidosMonitor

            &&

            PedidosMonitor.detectarCuelloBotella

        ) {

            PedidosMonitor
                .detectarCuelloBotella();
        }

    }, 1000);
}




// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosPolling = {

    obtenerPedidos,

    iniciarPollingPedidos
};