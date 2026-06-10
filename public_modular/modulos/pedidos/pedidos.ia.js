// ======================================================
// 🤖 IA OPERACIONAL
// pedidos.ia.js
// ======================================================


// ======================================================
// 🤖 EVALUAR IA OPERACIONAL
// ======================================================

function evaluarIAOperacional(pedido) {

    let minutosEtapa = 0;

    if (pedido.estado === "pendiente") {

        minutosEtapa =
            calcularMinutos(
                pedido.pendiente_at
                || pedido.created_at
            );
    }

    else if (
        pedido.estado === "preparando"
    ) {

        minutosEtapa =
            calcularMinutos(
                pedido.preparando_at
                || pedido.created_at
            );
    }

    else if (
        pedido.estado === "listo"
    ) {

        minutosEtapa =
            calcularMinutos(
                pedido.listo_at
                || pedido.created_at
            );
    }

    // ======================================================
    // 🚨 IA OPERACIONAL
    // ======================================================

    if (
        pedido.estado === "listo"
        &&
        minutosEtapa >= 10
    ) {

        return {

            nivel: "critico",

            mensaje:
                "🚨 Pedido listo esperando entrega"
        };
    }

    if (
        pedido.estado === "pendiente"
        &&
        minutosEtapa >= 8
    ) {

        return {

            nivel: "alerta",

            mensaje:
                "⚠ Pendiente demorando cocina"
        };
    }

    if (
        pedido.estado === "preparando"
        &&
        minutosEtapa >= 12
    ) {

        return {

            nivel: "urgente",

            mensaje:
                "🔥 Cocina demorando preparación"
        };
    }

    return {

        nivel: "normal",

        mensaje:
            "✅ Flujo operacional normal"
    };
}


// ======================================================
// 🤖 RESUMEN IA
// ======================================================

function calcularResumenIA() {

    const resumen = {

        alto: 0,

        medio: 0,

        normal: 0
    };

    PedidosState.pedidos.forEach(p => {

        if (!p.sla) return;

        if (
            p.sla.riesgoDemora === 'alto'
        ) {

            resumen.alto++;
        }

        else if (
            p.sla.riesgoDemora === 'medio'
        ) {

            resumen.medio++;
        }

        else {

            resumen.normal++;
        }
    });

    return resumen;
}


// ======================================================
// 🤖 DETECTAR SATURACIÓN
// ======================================================

function detectarSaturacionIA() {

    const resumen =
        PedidosState.resumenIA;

    // ======================================================
    // 🚨 SATURACIÓN ALTA
    // ======================================================

    if (resumen.alto >= 5) {

        return {

            nivel: 'alto',

            motivo:
                'Muchos pedidos críticos'
        };
    }

    // ======================================================
    // ⚠ SATURACIÓN MEDIA
    // ======================================================

    if (resumen.medio >= 5) {

        return {

            nivel: 'medio',

            motivo:
                'Alta carga operacional'
        };
    }

    // ======================================================
    // ✅ NORMAL
    // ======================================================

    return {

        nivel: 'normal',

        motivo:
            'Operación estable'
    };
}


// ======================================================
// 🤖 HISTORIAL IA
// ======================================================

function registrarHistorialIA(
    nuevoEstado
) {

    const historial =
        PedidosState
            .historialIAOperacional;

    const ultimo =
        historial[
            historial.length - 1
        ];

    // ======================================================
    // 🚫 EVITAR DUPLICADOS
    // ======================================================

    if (
        ultimo
        &&
        ultimo.nivel === nuevoEstado.nivel
    ) {

        return;
    }

    // ======================================================
    // 💾 REGISTRAR
    // ======================================================

    historial.push({

        nivel:
            nuevoEstado.nivel,

        motivo:
            nuevoEstado.motivo,

        timestamp:
            new Date()
                .toISOString()
    });

    // ======================================================
    // 🧹 LIMPIAR
    // ======================================================

    if (historial.length > 100) {

        historial.shift();
    }
}


// ======================================================
// 🤖 GENERAR SLA OPERACIONAL
// ======================================================

function generarSLAOperacional(
    pedido,
    minutos,
    demoraEstimada,
    slaInfo,
    prioridad
) {

    return {

        prioridadIA:
            prioridad.texto,

        riesgoDemora:
            minutos >= 15
                ? 'alto'
                : minutos >= demoraEstimada
                    ? 'medio'
                    : 'normal',

        etapaActual:
            pedido.estado,

        minutosEnEtapa:
            slaInfo.minutosEtapa
    };
}

// ======================================================
// 🤖 NAMESPACE IA
// ======================================================

window.PedidosIA = {

    evaluarIAOperacional,

    calcularResumenIA,

    detectarSaturacionIA,

    registrarHistorialIA,

    generarSLAOperacional
};


// ======================================================
// 🌐 BRIDGES LEGACY
// ======================================================

window.evaluarIAOperacional =
    PedidosIA.evaluarIAOperacional;

window.calcularResumenIA =
    PedidosIA.calcularResumenIA;

window.detectarSaturacionIA =
    PedidosIA.detectarSaturacionIA;

window.registrarHistorialIA =
    PedidosIA.registrarHistorialIA;

window.generarSLAOperacional =
    PedidosIA.generarSLAOperacional;