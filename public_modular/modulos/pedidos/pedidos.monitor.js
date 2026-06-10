// ======================================================
// 🚨 MONITOR OPERACIONAL
// ARCHIVO: pedidos.monitor.js
// ======================================================


// ======================================================
// 🚨 RENDER PANEL CRÍTICOS
// ======================================================

function renderPanelCriticos(
    criticos = []
) {

    const panel =
        document.getElementById(
            "panelCriticos"
        );

    const grid =
        document.getElementById(
            "gridCriticos"
        );

    const template =
        document.getElementById(
            "templateCritico"
        );

    if (
        !panel
        || !grid
        || !template
    ) return;

    // ======================================================
    // 🚫 SIN CRÍTICOS
    // ======================================================

    if (criticos.length === 0) {

        grid.innerHTML = "";

        panel.classList.add(
            "oculto"
        );

        return;
    }

    panel.classList.remove(
        "oculto"
    );

    // ======================================================
    // 🧹 LIMPIAR GRID
    // ======================================================

    grid.replaceChildren();

    // ======================================================
    // 🎨 RENDER CARDS
    // ======================================================

    criticos.forEach(p => {

        const clone =
            template.content
                .cloneNode(true);

        const item =
            clone.querySelector(
                ".critico-item"
            );

        const titulo =
            clone.querySelector(
                ".critico-titulo"
            );

        const cliente =
            clone.querySelector(
                ".critico-cliente"
            );

        const estado =
            clone.querySelector(
                ".critico-estado"
            );

        const tiempo =
            clone.querySelector(
                ".critico-tiempo"
            );

        const alerta =
            clone.querySelector(
                ".critico-alerta"
            );

        const btn =
            clone.querySelector(
                ".btn-ir-pedido"
            );

        // ======================================================
        // 🎨 COLOR SEGÚN ESTADO
        // ======================================================

        item.classList.add(
            `critico-${p.estado}`
        );

        // ======================================================
        // 📝 INFO
        // ======================================================

        titulo.textContent =
            `🍕 Pedido #${p.id}`;

        cliente.textContent =
            `👤 ${p.cliente}`;

        estado.textContent =
            `📌 ${p.estado}`;

        // ======================================================
        // ⏱ TIEMPOS
        // ======================================================

        const minutosTotal =
            calcularMinutos(
                p.created_at
            );

        let minutosEtapa = 0;

        let nombreEtapa = "";

        if (p.estado === "pendiente") {

            minutosEtapa =
                calcularMinutos(
                    p.pendiente_at
                    || p.created_at
                );

            nombreEtapa =
                "Pendiente";
        }

        else if (
            p.estado === "preparando"
        ) {

            minutosEtapa =
                calcularMinutos(
                    p.preparando_at
                    || p.created_at
                );

            nombreEtapa =
                "Preparando";
        }

        else if (
            p.estado === "listo"
        ) {

            minutosEtapa =
                calcularMinutos(
                    p.listo_at
                    || p.created_at
                );

            nombreEtapa =
                "Listo";
        }

        tiempo.innerHTML = `

            ⏱ Total sistema:
            <b>${minutosTotal} min</b>

            <br>

            🧠 Tiempo en etapa:
            <b>${minutosEtapa} min</b>
            (${nombreEtapa})

        `;

        // ======================================================
        // 🚨 SLA
        // ======================================================

        const slaInfo =
            obtenerAlertaEtapa(p);

        if (slaInfo.alerta) {

            const alertaBox =
                document.createElement("div");

            alertaBox.className =
                slaInfo.clase;

            alertaBox.textContent =
                slaInfo.alerta;

            alerta.appendChild(
                alertaBox
            );
        }

        // ======================================================
        // 🚨 PRIORIDAD
        // ======================================================

        const prioridad =
            calcularPrioridadOperacional(
                p
            );

        const prioridadEl =
            document.createElement("div");

        prioridadEl.className =
            prioridad.clase;

        prioridadEl.textContent =
            prioridad.texto;

        item.appendChild(
            prioridadEl
        );

        // ======================================================
        // 🧠 IA OPERACIONAL (CORREGIDO SIN CRASH)
        // ======================================================

        let ia = null;

        if (
            window.PedidosIA &&
            typeof PedidosIA.evaluarIAOperacional === "function"
        ) {

            ia =
                PedidosIA.evaluarIAOperacional(p);
        }

        if (ia) {

            const iaEl =
                document.createElement("div");

            iaEl.className =
                `ia-${ia.nivel}`;

            iaEl.textContent =
                `🧠 IA: ${ia.mensaje}`;

            item.appendChild(
                iaEl
            );
        }

        // ======================================================
        // 🔘 BOTÓN
        // ======================================================

        btn.onclick = () => {

            PedidosUI.irAPedido(p.id);
        };

        // ======================================================
        // 📦 INSERTAR
        // ======================================================

        grid.appendChild(
            clone
        );
    });
}


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

    renderPanelCriticos(
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
                <b>${PedidosSLA.obtenerPedidosCriticos().length}</b>
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

    renderPanelCriticos,

    verificarDemorasAutomaticas,

    detectarCuelloBotella,

    renderMetricasOperacionales
};