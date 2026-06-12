// ======================================================
// 🚨 MONITOR OPERACIONAL
// ARCHIVO: pedidos.monitor.js
// ======================================================





// ======================================================
// 🚨 VERIFICAR DEMORAS
// ======================================================

function verificarDemorasAutomaticas() {

    const ahora =
        Date.now();

    const visibles =
        PedidosState.pedidos.filter(
            p =>
                p.estado !== "entregado"
                &&
                p.estado !== "cancelado"
        );

    PedidosRender.renderPanelCriticos(
    visibles
);

    if (!visibles.length) {
        return;
    }

    const criticos =
    PedidosSLA.obtenerPedidosCriticos();

    if (!criticos.length) {
        return;
    }

    if (
        ahora
        - PedidosState.ultimoSonidoDemora
        < 300000
    ) {
        return;
    }

    PedidosState.ultimoSonidoDemora =
        ahora;

    if (typeof sonarCriticos === "function") {
        sonarCriticos();
    }
}


// ======================================================
// 🧠 DETECTAR CUELLO BOTELLA
// ======================================================

function detectarCuelloBotella() {

    const panel =
        document.getElementById(
            "panelCuelloBotella"
        );

    if (!panel) return;

    const texto =
        document.getElementById(
            "textoCuelloBotella"
        );

    if (!texto) return;

    const pendientes =
        PedidosState.pedidos.filter(
            p => p.estado === "pendiente"
        ).length;

    const preparando =
        PedidosState.pedidos.filter(
            p => p.estado === "preparando"
        ).length;

    const listos =
        PedidosState.pedidos.filter(
            p => p.estado === "listo"
        ).length;

    let mensaje = "";

    let clase = "";

    if (listos >= 1) {

        mensaje =
            `🔴 DELIVERY DEMORADO:
            ${listos} pedidos esperando salida`;

        clase =
            "cuello-rojo";
    }

    else if (preparando >= 1) {

        mensaje =
            `🟠 COCINA SATURADA:
            ${preparando} pedidos en preparación`;

        clase =
            "cuello-naranja";
    }

    else if (pendientes >= 1) {

        mensaje =
            `🟡 DEMORA EN TOMA DE PEDIDOS:
            ${pendientes} pedidos pendientes`;

        clase =
            "cuello-amarillo";
    }

    else {

        panel.className =
            "panel-cuello oculto";

        texto.textContent =
            "";

        return;
    }

    panel.className =
        `panel-cuello ${clase}`;

    texto.textContent =
        mensaje;
}


// ======================================================
// 📊 MÉTRICAS OPERACIONALES
// ======================================================

async function renderMetricasOperacionales() {

    try {

        const res =
            await fetch(
                '/api/pedidos/metricas/resumen'
            );

        const data =
            await res.json();

        const el =
            document.getElementById(
                'metricasOperacionales'
            );

        if (!el) return;

        // ======================================================
        // 🚨 CRÍTICOS
        // ======================================================

        const cantidadCriticos =
            PedidosSLA.obtenerPedidosCriticos()
                .length;

        el.innerHTML = `

            <div class="metrica-box">
                ⏱ Promedio preparación:
                <b>${data.promedioPreparacion || 0} min</b>
            </div>

            <div class="metrica-box">
                🚚 Promedio entrega:
                <b>${data.promedioTotal || 0} min</b>
            </div>

            <div class="metrica-box">
                🚨 Pedidos críticos:
                <b>${cantidadCriticos}</b>
            </div>

            <div class="metrica-box">
                🍕 Pedidos activos:
                <b>${
                    PedidosState.pedidos.filter(
                        p =>
                            p.estado !== "entregado"
                            &&
                            p.estado !== "cancelado"
                    ).length
                }</b>
            </div>
        `;
    }

    catch (err) {

        console.error(
            '❌ Error métricas:',
            err
        );
    }
}


// ======================================================
// 🌐 EXPORT MODULE
// ======================================================

window.PedidosMonitor = {

    verificarDemorasAutomaticas,

    detectarCuelloBotella,

    renderMetricasOperacionales
};