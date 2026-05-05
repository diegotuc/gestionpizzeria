// ===== INICIO MÓDULO: CORE =====

window.App = {

    estado: {
        pedidos: JSON.parse(localStorage.getItem('pedidos')) || []
    },

    eventos: {},

    emitir(nombre, data) {
        if (this.eventos[nombre]) {
            this.eventos[nombre].forEach(fn => fn(data));
        }

        localStorage.setItem('pedidos', JSON.stringify(this.estado.pedidos));
    },

    escuchar(nombre, callback) {
        if (!this.eventos[nombre]) {
            this.eventos[nombre] = [];
        }
        this.eventos[nombre].push(callback);
    }
};

// ===== FIN MÓDULO: CORE =====


// 👇👇👇 AGREGÁ ESTO 👇👇👇

import { initCaja } from '../modulos/caja/caja.js';

document.addEventListener('DOMContentLoaded', () => {
    initCaja();
});