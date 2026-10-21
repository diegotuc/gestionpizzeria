// ======================================================
// 🔊 PEDIDOS AUDIO
// ARCHIVO: pedidos.audio.js
// ======================================================


// ======================================================
// 🔓 ESTADO AUDIO
// ======================================================

let audioHabilitado = false;

let ultimaAlertaCritica = 0;

let ultimoSonidoDemora = 0;


// ======================================================
// 🔓 HABILITAR AUDIO
// ======================================================

function habilitarAudio() {

    if (audioHabilitado) {

        return;
    }

    audioHabilitado = true;

    console.log(
        '🔊 Audio habilitado'
    );
}


// ======================================================
// 🖱 ACTIVAR POR INTERACCIÓN
// ======================================================

window.addEventListener(
    'click',
    habilitarAudio
);


// ======================================================
// 🔊 REPRODUCIR AUDIO
// ======================================================

function reproducirAudio(
    ruta,
    volumen = 1
) {

    if (!audioHabilitado) {

        return;
    }

    const audio =
        new Audio(ruta);

    audio.volume =
        volumen;

    audio.play().catch(err => {

        console.warn(
            '⚠️ Error reproduciendo audio:',
            err
        );
    });
}


// ======================================================
// 🔔 NUEVO PEDIDO
// ======================================================

function sonarNuevoPedido() {

    reproducirAudio(
        '/sounds/caja_registradora.mp3'
    );
}


// ======================================================
// 🚨 PEDIDO CRÍTICO
// ======================================================

function sonarCriticos() {

    const ahora =
        Date.now();

    // ======================================================
    // ⏱ EVITAR SPAM
    // ======================================================

    if (

        ahora
        - ultimaAlertaCritica

        < 300000

    ) {

        return;
    }

    ultimaAlertaCritica =
        ahora;

    reproducirAudio(
        '/sounds/warning.mp3'
    );
}

// ======================================================
// 🔔 SONIDO NUEVO PEDIDO
// ======================================================

function sonarNuevoPedido() {

    reproducirAudio(
        '/sounds/caja_registradora.mp3'
    );
}


// ======================================================
// 🚨 DEMORA OPERACIONAL
// ======================================================

function verificarSonidoDemora(
    cantidadCriticos
) {

    if (
        !cantidadCriticos
        ||
        cantidadCriticos <= 0
    ) {

        return;
    }

    const ahora =
        Date.now();

    // ======================================================
    // ⏱ COOLDOWN
    // ======================================================

    if (

        ahora
        - ultimoSonidoDemora

        < 300000

    ) {

        return;
    }

    ultimoSonidoDemora =
        ahora;

    sonarCriticos();
}


// ======================================================
// 🔇 RESET ALERTAS
// ======================================================

function resetAlertasAudio() {

    ultimaAlertaCritica = 0;

    ultimoSonidoDemora = 0;
}


// ======================================================
// 📦 EXPORTS GLOBALES
// ======================================================

window.PedidosAudio = {

    habilitarAudio,

    sonarNuevoPedido,

    sonarCriticos,

    verificarSonidoDemora,

    resetAlertasAudio
};
window.sonarCriticos =
    sonarCriticos;

window.sonarNuevoPedido =
    sonarNuevoPedido;