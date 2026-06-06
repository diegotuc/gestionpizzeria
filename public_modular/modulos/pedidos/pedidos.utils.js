// ======================================================
// 🛠 UTILS PEDIDOS
// pedidos.utils.js
// ======================================================


// ======================================================
// ⏱ CALCULAR MINUTOS
// ======================================================

function calcularMinutos(fecha) {

    if (!fecha) return 0;

    const fechaNormalizada =
        fecha.replace(' ', 'T');

    const fechaPedido =
        new Date(fechaNormalizada);

    if (
        isNaN(fechaPedido.getTime())
    ) {

        console.warn(
            "⚠️ Fecha inválida:",
            fecha
        );

        return 0;
    }

    return Math.floor(

        (
            Date.now()
            - fechaPedido.getTime()
        ) / 60000
    );
}


// ======================================================
// ⏱ CALCULAR SEGUNDOS
// ======================================================

function calcularSegundos(fecha) {

    if (!fecha) return 0;

    const fechaNormalizada =
        fecha.replace(' ', 'T');

    const fechaPedido =
        new Date(fechaNormalizada);

    if (
        isNaN(fechaPedido.getTime())
    ) {

        console.warn(
            "⚠️ Fecha inválida:",
            fecha
        );

        return 0;
    }

    return Math.floor(

        (
            Date.now()
            - fechaPedido.getTime()
        ) / 1000
    );
}


// ======================================================
// 🧠 CARGA COCINA
// ======================================================

function calcularCargaCocina() {

    const pendientes =
        PedidosState.pedidos.filter(
            p => p.estado === "pendiente"
        ).length;

    const preparando =
        PedidosState.pedidos.filter(
            p => p.estado === "preparando"
        ).length;

    return pendientes
        + (preparando * 2);
}


// ======================================================
// ⏱ ESTIMAR DEMORA
// ======================================================

function estimarDemoraPromedio() {

    const hora =
        new Date().getHours();

    // ======================================================
    // 🍕 HORARIO PICO MEDIODÍA
    // ======================================================

    if (
        hora >= 12
        &&
        hora <= 14
    ) {

        return 18;
    }

    // ======================================================
    // 🍕 HORARIO PICO NOCHE
    // ======================================================

    if (
        hora >= 20
        &&
        hora <= 22
    ) {

        return 22;
    }

    // ======================================================
    // ✅ NORMAL
    // ======================================================

    return 10;
}


// ======================================================
// 🌐 EXPORT GLOBAL
// ======================================================

window.calcularMinutos =
    calcularMinutos;

window.calcularSegundos =
    calcularSegundos;

window.calcularCargaCocina =
    calcularCargaCocina;

window.estimarDemoraPromedio =
    estimarDemoraPromedio;