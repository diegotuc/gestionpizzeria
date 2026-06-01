// ======================================================
// 🍕 SISTEMA COCINA INTELIGENTE - BASE ESTABLE FINAL
// ======================================================


// ======================================================
// 📦 ESTADO GLOBAL
// ======================================================

let pedidos = [];

const REFRESH_MS = 3000;

let ultimaActualizacion = null;
let sistemaActivo = true;

let idsAnteriores = new Set();
let primeraCarga = true;

let cargandoPedidos = false;
let actualizandoEstado = false;

let filtroEstado = "todos";

let audioHabilitado = false;
let ultimaAlertaCritica = 0;

let ultimoSonidoDemora = 0;


// ======================================================
// 🔓 AUDIO
// ======================================================

function habilitarAudio() {

    if (audioHabilitado) return;

    audioHabilitado = true;

    console.log("🔊 Audio habilitado");
}

window.addEventListener('click', () => {
    habilitarAudio();
});


// ======================================================
// 🔔 SONIDO NUEVO PEDIDO
// ======================================================

function sonarNuevoPedido() {

    if (!audioHabilitado) return;

    const audio =
        new Audio(
            '/sounds/caja_registradora.mp3'
        );

    audio.volume = 1;

    audio.play().catch((err) => {

        console.warn(
            "⚠️ Error reproduciendo sonido nuevo pedido:",
            err
        );
    });
}


// ======================================================
// 🚨 SONIDO PEDIDOS CRÍTICOS
// ======================================================

function sonarCriticos() {

    if (!audioHabilitado) return;

    const ahora = Date.now();

    if (
        ahora - ultimaAlertaCritica
        < 300000
    ) return;

    ultimaAlertaCritica = ahora;

    const audio =
        new Audio('/sounds/warning.mp3');

    audio.volume = 1;

    audio.play().catch((err) => {

        console.warn(
            "⚠️ Error reproduciendo alerta críticos:",
            err
        );
    });
}


// ======================================================
// 📡 OBTENER PEDIDOS
// ======================================================

// inicio de modificacion

async function obtenerPedidos() {

    if (cargandoPedidos) return;

    cargandoPedidos = true;

    try {

        const res =
            await fetch('/api/pedidos');

        if (!res.ok) {

            throw new Error(
                "Error obteniendo pedidos"
            );
        }

        const data =
            await res.json();

        const nuevosIds =
            new Set(
                data.map(p => p.id)
            );

        // ======================================================
        // 🔔 NUEVOS PEDIDOS
        // ======================================================

        if (!primeraCarga) {

            data.forEach(p => {

                if (!idsAnteriores.has(p.id)) {

                    sonarNuevoPedido();
                }
            });
        }

        idsAnteriores =
            nuevosIds;

        primeraCarga =
            false;

        pedidos =
            data;

        ultimaActualizacion =
            new Date();

        sistemaActivo =
            true;

        renderPedidos();

        actualizarUI();

        verificarDemorasAutomaticas();

        detectarCuelloBotella();

    }

    catch (e) {

        // esto es una modificacion

        console.error(
            "❌ ERROR obtenerPedidos:",
            e
        );

        sistemaActivo = false;

        const el =
            document.getElementById(
                'estadoSistema'
            );

        if (el) {

            el.innerText =
                "🔴 Error conexión";
        }
    }

    finally {

        cargandoPedidos =
            false;
    }
}

// hasta aqui fue modificado


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
// 🧠 PRIORIDAD OPERACIONAL
// ======================================================

function calcularPrioridadOperacional(p) {

    const minutosTotal =
        calcularMinutos(
            p.created_at
        );

    let minutosEtapa = 0;

    if (p.estado === "pendiente") {

        minutosEtapa =
            calcularMinutos(
                p.pendiente_at
                || p.created_at
            );
    }

    else if (
        p.estado === "preparando"
    ) {

        minutosEtapa =
            calcularMinutos(
                p.preparando_at
                || p.created_at
            );
    }

    else if (
        p.estado === "listo"
    ) {

        minutosEtapa =
            calcularMinutos(
                p.listo_at
                || p.created_at
            );
    }

    if (
        minutosTotal >= 25
        ||
        (
            p.estado === "listo"
            &&
            minutosEtapa >= 10
        )
    ) {

        return {
            nivel: "critica",
            texto: "🚨 PRIORIDAD CRÍTICA",
            clase: "prioridad-critica"
        };
    }

    if (
        minutosTotal >= 15
        ||
        (
            p.estado === "preparando"
            &&
            minutosEtapa >= 10
        )
    ) {

        return {
            nivel: "urgente",
            texto: "⚠ PRIORIDAD URGENTE",
            clase: "prioridad-urgente"
        };
    }

    if (
        p.estado === "pendiente"
        &&
        minutosEtapa >= 5
    ) {

        return {
            nivel: "alta",
            texto: "🟡 PRIORIDAD ALTA",
            clase: "prioridad-alta"
        };
    }

    return {

        nivel: "normal",

        texto: "🟢 PRIORIDAD NORMAL",

        clase: "prioridad-normal"
    };
}


// ======================================================
// 🚨 SLA ETAPA
// ======================================================

function obtenerAlertaEtapa(p) {

    let minutosEtapa = 0;

    let alerta = "";

    let clase = "";

    if (p.estado === "pendiente") {

        minutosEtapa =
            calcularMinutos(
                p.pendiente_at
                || p.created_at
            );

        if (minutosEtapa >= 5) {

            alerta =
                "⚠ Caja no liberó pedido";

            clase =
                "sla-alerta";
        }
    }

    else if (
        p.estado === "preparando"
    ) {

        minutosEtapa =
            calcularMinutos(
                p.preparando_at
                || p.created_at
            );

        if (minutosEtapa >= 5) {

            alerta =
                "⚠ Cocina demorando preparación";

            clase =
                "sla-alerta";
        }
    }

    else if (
        p.estado === "listo"
    ) {

        minutosEtapa =
            calcularMinutos(
                p.listo_at
                || p.created_at
            );

        if (minutosEtapa >= 5) {

            alerta =
                "⚠ Delivery no despachó";

            clase =
                "sla-alerta";
        }
    }

    return {
        minutosEtapa,
        alerta,
        clase
    };
}


// ======================================================
// 🧠 CARGA COCINA
// ======================================================

function calcularCargaCocina() {

    const pendientes =
        pedidos.filter(
            p => p.estado === "pendiente"
        ).length;

    const preparando =
        pedidos.filter(
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

    if (
        hora >= 12
        &&
        hora <= 14
    ) return 18;

    if (
        hora >= 20
        &&
        hora <= 22
    ) return 22;

    return 10;
}


// ======================================================
// 🚨 PEDIDOS CRÍTICOS
// ======================================================

function obtenerPedidosCriticos() {

    return pedidos.filter(p => {

        if (
            p.estado === "entregado"
            ||
            p.estado === "cancelado"
        ) {

            return false;
        }

        return true;
    });
}


// ======================================================
// 🎨 PANEL CRÍTICOS
// ======================================================

function renderPanelCriticos(criticos) {

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

    // esto es una modificacion

    grid.replaceChildren();

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

        item.classList.add(
            `critico-${p.estado}`
        );

        titulo.textContent =
            `🍕 Pedido #${p.id}`;

        cliente.textContent =
            `👤 ${p.cliente}`;

        estado.textContent =
            `📌 ${p.estado}`;

        tiempo.textContent =
            `⏱ Total: ${
                calcularMinutos(
                    p.created_at
                )
            } min`;

        // esto es una modificacion

        const prioridad =
            calcularPrioridadOperacional(p);

        const prioridadEl =
            document.createElement("div");

        prioridadEl.className =
            prioridad.clase;

        prioridadEl.textContent =
            prioridad.texto;

        item.appendChild(
            prioridadEl
        );

        const slaInfo =
            obtenerAlertaEtapa(p);

        // inicio de modificacion

        if (slaInfo.alerta) {

            const alertaBox =
                document.createElement("div");

            alertaBox.className =
                slaInfo.clase;

            alertaBox.textContent =
                slaInfo.alerta;

            const etapa =
                document.createElement("small");

            etapa.textContent =
                `⏱ Etapa: ${slaInfo.minutosEtapa} min`;

            alerta.appendChild(
                alertaBox
            );

            alerta.appendChild(
                etapa
            );
        }

        // hasta aqui fue modificado

        btn.onclick = () => {
            irAPedido(p.id);
        };

        grid.appendChild(clone);
    });
}


// ======================================================
// 🎨 RENDER TABLERO
// ======================================================

function renderPedidos() {

    const colPendientes =
        document.getElementById(
            'colPendientes'
        );

    const colPreparando =
        document.getElementById(
            'colPreparando'
        );

    const colListos =
        document.getElementById(
            'colListos'
        );

    if (
        !colPendientes
        || !colPreparando
        || !colListos
    ) return;

    // esto es una modificacion

    colPendientes.replaceChildren();
    colPreparando.replaceChildren();
    colListos.replaceChildren();

    let filtrados = [...pedidos];

    if (
        filtroEstado !== "todos"
    ) {

        filtrados =
            filtrados.filter(
                p =>
                    p.estado
                    === filtroEstado
            );
    }

    filtrados.forEach(p => {

        if (
            p.estado === "entregado"
            ||
            p.estado === "cancelado"
        ) return;

        // inicio de modificacion

        const card =
            document.createElement("div");

        card.className =
            `card estado-${p.estado}`;

        card.id =
            `pedido-${p.id}`;

        const minutos =
            calcularMinutos(
                p.created_at
            );

        const demoraEstimada =
            estimarDemoraPromedio();

        const prioridad =
            calcularPrioridadOperacional(p);

        const slaInfo =
            obtenerAlertaEtapa(p);

        if (minutos >= 15) {

            card.classList.add(
                "critico"
            );
        }

        else if (
            minutos >= demoraEstimada
        ) {

            card.classList.add(
                "prioridad"
            );
        }

        const titulo =
            document.createElement("h3");

        titulo.textContent =
            `🍕 Pedido #${p.id}`;

        card.appendChild(titulo);

        const cliente =
            document.createElement("p");

        cliente.textContent =
            `Cliente: ${p.cliente}`;

        card.appendChild(cliente);

        const detalle =
            document.createElement("p");

        detalle.textContent =
            `Detalle: ${p.detalle}`;

        card.appendChild(detalle);

        const total =
            document.createElement("p");

        total.textContent =
            `Total: $${p.total}`;

        card.appendChild(total);

        const estado =
            document.createElement("p");

        estado.textContent =
            `Estado: ${p.estado}`;

        card.appendChild(estado);

        const tiempo =
            document.createElement("p");

        tiempo.textContent =
            `Tiempo: ${minutos} min`;

        card.appendChild(tiempo);

        const prioridadEl =
            document.createElement("p");

        prioridadEl.className =
            prioridad.clase;

        prioridadEl.textContent =
            prioridad.texto;

        card.appendChild(
            prioridadEl
        );

        if (slaInfo.alerta) {

            const alerta =
                document.createElement("div");

            alerta.className =
                slaInfo.clase;

            alerta.textContent =
                slaInfo.alerta;

            card.appendChild(
                alerta
            );
        }

        const acciones =
            document.createElement("div");

        acciones.className =
            "acciones";

        const estados = [

            {
                icono: "👨‍🍳",
                estado: "preparando"
            },

            {
                icono: "✅",
                estado: "listo"
            },

            {
                icono: "🚚",
                estado: "entregado"
            },

            {
                icono: "❌",
                estado: "cancelado"
            }
        ];

        estados.forEach(item => {

            const btn =
                document.createElement(
                    "button"
                );

// ======================================================
// 🎨 ICONO VISUAL DEL BOTÓN
// Se muestra dentro del botón.
// Ejemplo:
// 👨‍🍳
// ✅
// 🚚
// ❌
// ======================================================

btn.textContent =
    item.icono;


// ======================================================
// 🧠 TOOLTIP NATIVO DEL NAVEGADOR
// Aparece al dejar el mouse encima.
// Funciona como fallback universal.
//
// Ejemplo:
// "Cambiar a preparando"
//
// IMPORTANTE:
// el delay lo controla el navegador.
// ======================================================

//btn.title =
//    `Cambiar a ${item.estado}`;



// ======================================================
// ⚡ TOOLTIP PERSONALIZADO CSS
// Se usa junto con:
//
// .acciones button::after
//
// Permite:
// ✅ aparición instantánea
// ✅ estilos propios
// ✅ mejor UX operacional
//
// El CSS leerá:
// attr(data-tooltip)
// ======================================================

btn.dataset.tooltip =
    `Cambiar a ${item.estado}`;



// ======================================================
// ♿ ACCESIBILIDAD
// Mejora soporte para:
//
// ✅ lectores de pantalla
// ✅ accesibilidad web
// ✅ navegación asistida
// ✅ compatibilidad futura
//
// No afecta visualmente.
// ======================================================

btn.setAttribute(
    "aria-label",
    `Cambiar a ${item.estado}`
);

            btn.onclick = () => {

                cambiarEstado(
                    p.id,
                    item.estado
                );
            };

            acciones.appendChild(btn);
        });

        card.appendChild(acciones);

        // hasta aqui fue modificado

        if (
            p.estado === "pendiente"
        ) {

            colPendientes
                .appendChild(card);
        }

        else if (
            p.estado === "preparando"
        ) {

            colPreparando
                .appendChild(card);
        }

        else {

            colListos
                .appendChild(card);
        }
    });
}


// ======================================================
// 🔄 CAMBIAR ESTADO
// ======================================================

async function cambiarEstado(
    id,
    estado
) {

    if (
        actualizandoEstado
    ) return;

    actualizandoEstado =
        true;

    try {

        await fetch(
            `/api/pedidos/${id}/estado`,
            {
                method: 'PATCH',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    estado
                })
            }
        );

        await obtenerPedidos();
    }

    finally {

        actualizandoEstado =
            false;
    }
}


// ======================================================
// 📄 DETALLE PEDIDO
// ======================================================

async function verDetallePedido(id) {

    try {

        const res =
            await fetch(
                `/api/pedidos/${id}`
            );

        if (!res.ok) {

            throw new Error(
                "Error obteniendo pedido"
            );
        }

        const p =
            await res.json();

        alert(`

🍕 PEDIDO #${p.id}

👤 Cliente: ${p.cliente}
📞 Teléfono: ${p.telefono || '-'}
📍 Dirección: ${p.direccion || '-'}

📦 Detalle: ${p.detalle || '-'}

💰 Total: $${p.total}
📌 Estado: ${p.estado}

🕒 Creado: ${p.created_at || '-'}
🔄 Actualizado: ${p.updated_at || '-'}

📝 Observaciones: ${p.observaciones || '-'}

        `);
    }

    catch (err) {

        console.error(err);

        alert(
            "❌ Error obteniendo detalle"
        );
    }
}


// ======================================================
// 🟡 FILTRO
// ======================================================

function setFiltro(estado) {

    filtroEstado =
        estado;

    renderPedidos();
}


// ======================================================
// 📋 HISTORIAL
// ======================================================

async function abrirHistorial() {

    try {

        const res =
            await fetch(
                '/api/pedidos/historial'
            );

        const data =
            await res.json();

        const modal =
            document.getElementById(
                'modalHistorial'
            );

        if (!modal) return;

        const container =
            document.getElementById(
                'contenidoHistorial'
            );

        if (!container) return;

        modal.style.display =
            'flex';

        // esto es una modificacion

        container.replaceChildren();

        data.forEach(p => {

            // inicio de modificacion

            const div =
                document.createElement(
                    'div'
                );

            div.className =
                'historial-item';

            const titulo =
                document.createElement(
                    'div'
                );

            titulo.textContent =
                `🍕 Pedido #${p.id} - ${p.estado}`;

            div.appendChild(titulo);

            const cliente =
                document.createElement(
                    'p'
                );

            cliente.textContent =
                `Cliente: ${p.cliente}`;

            div.appendChild(cliente);

            const total =
                document.createElement(
                    'p'
                );

            total.textContent =
                `Total: $${p.total}`;

            div.appendChild(total);

            const actualizado =
                document.createElement(
                    'p'
                );

            actualizado.textContent =
                `Actualizado: ${
                    p.updated_at || '-'
                }`;

            div.appendChild(
                actualizado
            );

            const btn =
                document.createElement(
                    'button'
                );

            btn.textContent =
                '👁 Ver detalle';

            btn.onclick = () => {
                verDetallePedido(p.id);
            };

            div.appendChild(btn);

            const hr =
                document.createElement(
                    'hr'
                );

            div.appendChild(hr);

            container.appendChild(div);

            // hasta aqui fue modificado
        });
    }

    catch (err) {

        console.error(err);
    }
}


// ======================================================
// 🚨 DEMORAS
// ======================================================

function verificarDemorasAutomaticas() {

    const ahora =
        Date.now();

    const criticos =
        obtenerPedidosCriticos();

    renderPanelCriticos(
        criticos
    );

    if (criticos.length === 0) {
    return;
}

    if (
        ahora - ultimoSonidoDemora
        < 300000
    ) return;

    ultimoSonidoDemora =
        ahora;

    sonarCriticos();
}


// ======================================================
// 🧠 CUELLO BOTELLA
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
        pedidos.filter(
            p => p.estado === "pendiente"
        ).length;

    const preparando =
        pedidos.filter(
            p => p.estado === "preparando"
        ).length;

    const listos =
        pedidos.filter(
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

    else if (
        preparando >= 1
    ) {

        mensaje =
            `🟠 COCINA SATURADA:
            ${preparando} pedidos en preparación`;

        clase =
            "cuello-naranja";
    }

    else if (
        pendientes >= 1
    ) {

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
// 🟢 UI
// ======================================================

function actualizarUI() {

    const el =
        document.getElementById(
            'estadoSistema'
        );

    if (!el) return;

    if (!ultimaActualizacion) {

        el.innerText =
            "🟡 Conectando...";

        return;
    }

    const diff =
        Date.now()
        - new Date(
            ultimaActualizacion
        ).getTime();

    if (
        isNaN(diff)
        ||
        diff < 0
    ) {

        el.innerText =
            sistemaActivo
                ? "🟢 Activo hace 0m 0s"
                : "🔴 Sin conexión";

        return;
    }

    const seg =
        Math.floor(diff / 1000);

    const min =
        Math.floor(seg / 60);

    const segRest =
        seg % 60;

    el.innerText =
        sistemaActivo
            ? `🟢 Activo hace ${min}m ${segRest}s`
            : `🔴 Sin conexión`;

    const pendientes =
        pedidos.filter(
            p => p.estado === "pendiente"
        ).length;

    const preparando =
        pedidos.filter(
            p => p.estado === "preparando"
        ).length;

    const listos =
        pedidos.filter(
            p => p.estado === "listo"
        ).length;

    const entregados =
        pedidos.filter(
            p => p.estado === "entregado"
        ).length;

    const criticos =
        obtenerPedidosCriticos()
            .length;

    const c1 =
        document.getElementById(
            "contadorPendientes"
        );

    if (c1) {

        c1.innerText =
            `📊 Pendientes: ${pendientes}`;
    }

    const c2 =
        document.getElementById(
            "contadorExtra"
        );

    if (c2) {

        c2.innerText =
            `👨‍🍳 Preparando: ${preparando} | ✅ Listos: ${listos} | 🚚 Entregados: ${entregados}`;
    }

    const c3 =
        document.getElementById(
            "contadorCriticos"
        );

    if (c3) {

        c3.innerText =
            `🚨 Críticos: ${criticos}`;
    }
}


// ======================================================
// 🔁 INIT
// ======================================================

function iniciarPolling() {

    obtenerPedidos();

    setInterval(
        obtenerPedidos,
        REFRESH_MS
    );

    setInterval(
        actualizarUI,
        1000
    );
}


// ======================================================
// 📋 HISTORIAL MODAL
// ======================================================

function cerrarHistorial() {

    const modal =
        document.getElementById(
            'modalHistorial'
        );

    if (!modal) return;

    modal.style.display =
        'none';
}


// ======================================================
// 🔙 VOLVER
// ======================================================

function volver() {

    window.location.href =
        "/dashboard.html";
}


// ======================================================
// 🎯 IR A PEDIDO
// ======================================================

function irAPedido(id) {

    const elemento =
        document.getElementById(
            `pedido-${id}`
        );

    if (!elemento) return;

    elemento.scrollIntoView({

        behavior: "smooth",

        block: "center"
    });

    elemento.classList.add(
        "flash-pedido"
    );

    setTimeout(() => {

        elemento.classList.remove(
            "flash-pedido"
        );

    }, 3000);
}


// ======================================================
// 🌐 GLOBAL
// ======================================================

window.obtenerPedidos =
    obtenerPedidos;

window.renderPedidos =
    renderPedidos;

window.cambiarEstado =
    cambiarEstado;

window.verDetallePedido =
    verDetallePedido;

window.setFiltro =
    setFiltro;

window.actualizarUI =
    actualizarUI;

window.abrirHistorial =
    abrirHistorial;

window.cerrarHistorial =
    cerrarHistorial;

window.verificarDemorasAutomaticas =
    verificarDemorasAutomaticas;

window.calcularCargaCocina =
    calcularCargaCocina;

window.estimarDemoraPromedio =
    estimarDemoraPromedio;

window.sonarNuevoPedido =
    sonarNuevoPedido;

window.sonarCriticos =
    sonarCriticos;

window.iniciarPolling =
    iniciarPolling;

window.volver =
    volver;


// ======================================================
// ⏱ INTERVALOS
// ======================================================

setInterval(() => {

    verificarDemorasAutomaticas();

    detectarCuelloBotella();

}, 60000);


// ======================================================
// 🚀 START
// ======================================================

iniciarPolling();
