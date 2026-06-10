// ======================================================
// 🍕 PEDIDOS STATE GLOBAL
// ARCHIVO: pedidos.state.js
// ======================================================


// ======================================================
// 📦 STATE GLOBAL
// ======================================================

const PedidosState = {

    // ======================================================
    // 📋 PEDIDOS
    // ======================================================

    pedidos: [],

    // ======================================================
    // 🤖 IA OPERACIONAL
    // ======================================================

    resumenIA: {},

    estadoIAOperacional: {

        nivel: 'normal',

        motivo: 'Sin saturación'
    },

    historialIAOperacional: [],

    // ======================================================
    // 🔄 UI
    // ======================================================

    filtroEstado: 'todos',

    sistemaActivo: true,

    ultimaActualizacion: null,

    // ======================================================
    // 🔔 EVENTOS VISUALES
    // ======================================================

    ultimoPedidoActualizado: null,

    ultimoCambioEstado: null,

    // ======================================================
    // 🔊 AUDIO
    // ======================================================

    audioHabilitado: false,

    ultimaAlertaCritica: 0,

    ultimoSonidoDemora: 0,

    // ======================================================
// ⚡ CONTROL INTERNO
// ======================================================

cargandoPedidos: false,

actualizandoEstado: false,

primeraCarga: true,

idsAnteriores: new Set(),

//
// ======================================================
// 🔁 CONTROL RUNTIME POLLING
// Evita múltiples inicializaciones accidentales
// y permite registrar los intervals activos.
// ======================================================
//

pollingIniciado: false,

intervalos: {

    pedidos: null,

    ui: null,

    monitor: null
}

};

// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosState =
    PedidosState;