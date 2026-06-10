// ======================================================
// 🚀 INIT PEDIDOS
// ARCHIVO: pedidos.init.js
// ======================================================


// ======================================================
// 🔊 HABILITAR AUDIO
// ======================================================

window.addEventListener('click', () => {

    if (
        window.PedidosAudio
        &&
        PedidosAudio.habilitarAudio
    ) {

        PedidosAudio.habilitarAudio();
    }
});


// ======================================================
// 🚀 START SISTEMA
// ======================================================

function iniciarSistemaPedidos() {

    console.log(
        '🍕 Iniciando sistema pedidos...'
    );

    // ======================================================
    // 🟡 FILTRO INICIAL
    // ======================================================

        if (
        window.PedidosUI
        &&
        PedidosUI.setFiltro
    ) {

        PedidosUI.setFiltro(
            'todos'
        );
    }

    // ======================================================
    // 🔄 POLLING
    // ======================================================

    if (
        window.PedidosPolling
        &&
        PedidosPolling.iniciarPollingPedidos
    ) {

        PedidosPolling
            .iniciarPollingPedidos();
    }

    console.log(
        '✅ Sistema pedidos iniciado'
    );
}


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosInit = {

    iniciarSistemaPedidos
};


// ======================================================
// 🚀 AUTO INIT
// ======================================================

iniciarSistemaPedidos();