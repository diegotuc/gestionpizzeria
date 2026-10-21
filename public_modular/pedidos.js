// ======================================================
// 🍕 PEDIDOS MAIN
// pedidos.js
// ======================================================


// ======================================================
// 📦 STATE GLOBAL
// ======================================================

window.PedidosState = {

    // ======================================================
    // 📦 PEDIDOS
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
    // 🔄 CONTROL
    // ======================================================

    ultimoPedidoActualizado: null,

    ultimoCambioEstado: null,

    ultimaActualizacion: null,

    sistemaActivo: true,

    idsAnteriores: new Set(),

    primeraCarga: true,

    cargandoPedidos: false,

    actualizandoEstado: false,

    filtroEstado: 'todos',

    // ======================================================
    // 🔊 AUDIO
    // ======================================================

    audioHabilitado: false,

    ultimaAlertaCritica: 0,

    ultimoSonidoDemora: 0
};