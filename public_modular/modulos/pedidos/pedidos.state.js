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

    idsAnteriores: new Set()
};


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosState =
    PedidosState;