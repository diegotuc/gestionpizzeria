// ======================================================
// 🍕 PEDIDOS SLA OPERACIONAL
// ARCHIVO: pedidos.sla.js
// ======================================================




// ======================================================
// ⏱ CALCULAR MINUTOS
// ======================================================

function calcularMinutosDesde(fecha) {

    if (!fecha) return 0;

    const inicio =
        normalizarFecha(fecha);

    if (!inicio) return 0;

    if (
        isNaN(inicio.getTime())
    ) {

        return 0;
    }

    return (
        Date.now()
        - inicio.getTime()
    ) / 60000;
}


// ======================================================
// 📍 MINUTOS EN ETAPA
// ======================================================

function obtenerMinutosEtapa(pedido) {

    if (
        pedido.estado === 'pendiente'
    ) {

        return calcularMinutosDesde(
            pedido.pendiente_at
            || pedido.created_at
        );
    }

    if (
        pedido.estado === 'preparando'
    ) {

        return calcularMinutosDesde(
            pedido.preparando_at
            || pedido.created_at
        );
    }

    if (
        pedido.estado === 'listo'
    ) {

        return calcularMinutosDesde(
            pedido.listo_at
            || pedido.created_at
        );
    }

    return 0;
}


// ======================================================
// 🚨 SLA POR ETAPA
// ======================================================

function obtenerAlertaEtapa(pedido) {

    const minutosEtapa =
        obtenerMinutosEtapa(
            pedido
        );

    let alerta = '';

    let clase = '';

    // ======================================================
    // 🟡 PENDIENTE
    // ======================================================

    if (
        pedido.estado === 'pendiente'
    ) {

        if (minutosEtapa >= 5) {

            alerta =
                '⚠ Caja no liberó pedido';

            clase =
                'sla-alerta';
        }

        if (minutosEtapa >= 10) {

            alerta =
                '🚨 Pedido pendiente crítico';

            clase =
                'sla-critico';
        }
    }

    // ======================================================
    // 🟠 PREPARANDO
    // ======================================================

    else if (
        pedido.estado === 'preparando'
    ) {

        if (minutosEtapa >= 10) {

            alerta =
                '⚠ Cocina demorando preparación';

            clase =
                'sla-alerta';
        }

        if (minutosEtapa >= 20) {

            alerta =
                '🚨 Cocina saturada';

            clase =
                'sla-critico';
        }
    }

    // ======================================================
    // 🔵 LISTO
    // ======================================================

    else if (
        pedido.estado === 'listo'
    ) {

        if (minutosEtapa >= 5) {

            alerta =
                '⚠ Delivery no despachó';

            clase =
                'sla-alerta';
        }

        if (minutosEtapa >= 10) {

            alerta =
                '🚨 Pedido listo detenido';

            clase =
                'sla-critico';
        }
    }

    return {

        minutosEtapa:
            parseFloat(
                minutosEtapa.toFixed(1)
            ),

        alerta,

        clase
    };
}


// ======================================================
// 🧠 PRIORIDAD OPERACIONAL
// ======================================================

function calcularPrioridadOperacional(
    pedido
) {

    const minutosTotal =
        calcularMinutosDesde(
            pedido.created_at
        );

    const minutosEtapa =
        obtenerMinutosEtapa(
            pedido
        );

    // ======================================================
    // 🚨 CRÍTICA
    // ======================================================

    if (

        minutosTotal >= 25

        ||

        (
            pedido.estado === 'listo'
            &&
            minutosEtapa >= 10
        )

    ) {

        return {

            nivel: 'critica',

            texto:
                '🚨 PRIORIDAD CRÍTICA',

            clase:
                'prioridad-critica'
        };
    }

    // ======================================================
    // ⚠ URGENTE
    // ======================================================

    if (

        minutosTotal >= 15

        ||

        (
            pedido.estado === 'preparando'
            &&
            minutosEtapa >= 10
        )

    ) {

        return {

            nivel: 'urgente',

            texto:
                '⚠ PRIORIDAD URGENTE',

            clase:
                'prioridad-urgente'
        };
    }

    // ======================================================
    // 🟡 ALTA
    // ======================================================

    if (

        pedido.estado === 'pendiente'
        &&
        minutosEtapa >= 5

    ) {

        return {

            nivel: 'alta',

            texto:
                '🟡 PRIORIDAD ALTA',

            clase:
                'prioridad-alta'
        };
    }

    // ======================================================
    // 🟢 NORMAL
    // ======================================================

    return {

        nivel: 'normal',

        texto:
            '🟢 PRIORIDAD NORMAL',

        clase:
            'prioridad-normal'
    };
}


// ======================================================
// 📊 SLA COMPLETO
// ======================================================

function calcularSLA(pedido) {

    const prioridad =
        calcularPrioridadOperacional(pedido);

    const etapa =
        obtenerAlertaEtapa(pedido);

    const ia =
    window.PedidosIA
    &&
    PedidosIA.evaluarIAOperacional
        ? PedidosIA.evaluarIAOperacional(
            pedido
        )
        : null;

    return {

        prioridad,
        etapa,

        ia, // 👈 NUEVA CAPA

        minutosTotal:
            parseFloat(
                calcularMinutosDesde(
                    pedido.created_at
                ).toFixed(1)
            ),

        estado: pedido.estado
    };
}


// ======================================================
// 🚨 PEDIDOS CRÍTICOS
// ======================================================

function obtenerPedidosCriticos() {

    return PedidosState.pedidos.filter(p => {

        const prioridad =
            calcularPrioridadOperacional(p);

        return (
            prioridad.nivel === 'critica'
            ||
            prioridad.nivel === 'urgente'
        );
    });
}


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosSLA = {

    calcularMinutosDesde,

    obtenerMinutosEtapa,

    obtenerAlertaEtapa,

    calcularPrioridadOperacional,

    calcularSLA,

    obtenerPedidosCriticos
};