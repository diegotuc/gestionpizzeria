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

    // Evita reproducción sin interacción usuario
    if (!audioHabilitado) return;

    const audio = new Audio('/sounds/caja_registradora.mp3');

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

    // Evita autoplay bloqueado
    if (!audioHabilitado) return;

    const ahora = Date.now();

    // Cooldown 5 minutos
    if (ahora - ultimaAlertaCritica < 300000) return;

    ultimaAlertaCritica = ahora;

    const audio = new Audio('/sounds/warning.mp3');

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

async function obtenerPedidos() {

    if (cargandoPedidos) return;
    cargandoPedidos = true;

    try {

        const res = await fetch('/api/pedidos');
        const data = await res.json();

        const nuevosIds = new Set(data.map(p => p.id));

        if (!primeraCarga) {
            data.forEach(p => {
                if (!idsAnteriores.has(p.id)) {
                    sonarNuevoPedido();
                }
            });
        }

        idsAnteriores = nuevosIds;
        primeraCarga = false;

        pedidos = data;

        ultimaActualizacion = new Date();
        sistemaActivo = true;

        // Render principal del tablero
renderPedidos();

// Actualiza métricas y reloj UI
actualizarUI();

// Refresca inmediatamente panel críticos
// para evitar retrasos visuales
verificarDemorasAutomaticas();

    } catch (e) {

        sistemaActivo = false;

        const el = document.getElementById('estadoSistema');
        if (el) el.innerText = "🔴 Error conexión";

    } finally {
        cargandoPedidos = false;
    }
}


// ======================================================
// ⏱ UTILIDAD TIEMPO
// ======================================================

// ======================================================
// ⏱ CALCULAR MINUTOS (FIX SQLITE)
// ======================================================

function calcularMinutos(fecha) {

    if (!fecha) return 0;

    // SQLite devuelve:
    // YYYY-MM-DD HH:mm:ss
    // Algunos navegadores no parsean correctamente.
    // Se normaliza a formato ISO.
    const fechaNormalizada =
        fecha.replace(' ', 'T');

    const fechaPedido = new Date(fechaNormalizada);

    // Protección invalid date
    if (isNaN(fechaPedido.getTime())) {

        console.warn(
            "⚠️ Fecha inválida:",
            fecha
        );

        return 0;
    }

    return Math.floor(
        (Date.now() - fechaPedido.getTime()) / 60000
    );
}   

// ======================================================
// ⏱ CALCULAR SEGUNDOS (FIX SQLITE)
// ======================================================

function calcularSegundos(fecha) {

    if (!fecha) return 0;

    const fechaNormalizada =
        fecha.replace(' ', 'T');

    const fechaPedido = new Date(fechaNormalizada);

    if (isNaN(fechaPedido.getTime())) {

        console.warn(
            "⚠️ Fecha inválida:",
            fecha
        );

        return 0;
    }

    return Math.floor(
        (Date.now() - fechaPedido.getTime()) / 1000
    );
}

// ======================================================
// 📊 MOTOR INTELIGENTE
// ======================================================

// ======================================================
// 🚨 SLA OPERATIVO POR ETAPA
// ======================================================

function obtenerAlertaEtapa(p) {

    let minutosEtapa = 0;

    let alerta = "";

    let clase = "";

    // ======================================================
    // 🟠 PENDIENTE
    // ======================================================

    if (p.estado === "pendiente") {

        minutosEtapa = calcularMinutos(
            p.pendiente_at || p.created_at
        );

        if (minutosEtapa >= 5) {

            alerta =
                "⚠ Caja no liberó pedido";

            clase = "sla-alerta";
        }
    }

    // ======================================================
    // 🔵 PREPARANDO
    // ======================================================

    else if (p.estado === "preparando") {

        minutosEtapa = calcularMinutos(
            p.preparando_at || p.created_at
        );

        if (minutosEtapa >= 5) {

            alerta =
                "⚠ Cocina demorando preparación";

            clase = "sla-alerta";
        }
    }

    // ======================================================
    // 🟢 LISTO
    // ======================================================

    else if (p.estado === "listo") {

        minutosEtapa = calcularMinutos(
            p.listo_at || p.created_at
        );

        if (minutosEtapa >= 5) {

            alerta =
                "⚠ Delivery no despachó";

            clase = "sla-alerta";
        }
    }

    return {
        minutosEtapa,
        alerta,
        clase
    };
}


function calcularCargaCocina() {

    const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
    const preparando = pedidos.filter(p => p.estado === "preparando").length;

    return pendientes + (preparando * 2);
}

function estimarDemoraPromedio() {

    const hora = new Date().getHours();

    if (hora >= 12 && hora <= 14) return 18;
    if (hora >= 20 && hora <= 22) return 22;

    return 10;
}


// ======================================================
// 🎨 RENDER PEDIDOS (TABLERO)
// ======================================================

function renderPedidos() {

    const colPendientes = document.getElementById('colPendientes');
    const colPreparando = document.getElementById('colPreparando');
    const colListos = document.getElementById('colListos');

    if (!colPendientes || !colPreparando || !colListos) return;

    colPendientes.innerHTML = "";
    colPreparando.innerHTML = "";
    colListos.innerHTML = "";

    let filtrados = [...pedidos];

    if (filtroEstado !== "todos") {
        filtrados = filtrados.filter(p => p.estado === filtroEstado);
    }

    filtrados.forEach(p => {

        // 🔴 REGLA FIJA: fuera del tablero
        if (p.estado === "entregado" || p.estado === "cancelado") return;

        const card = document.createElement('div');

      //======================================================
      // 🚨 SLA ETAPA ACTUAL
      //======================================================

        const slaInfo = obtenerAlertaEtapa(p);


        const minutos = calcularMinutos(p.created_at);

        const demoraEstimada = estimarDemoraPromedio();

        // ======================================================
        // ⏱ SLA POR ETAPA (NIVEL 1 - SOLO VISUAL)
        // ======================================================

let minutosEtapa = 0;
let etiquetaEtapa = "⏳ Sin etapa";

// ------------------------------------------------------
// 🟠 PENDIENTE
// ------------------------------------------------------
if (p.estado === "pendiente") {

    minutosEtapa = calcularMinutos(p.pendiente_at || p.created_at);

    etiquetaEtapa = `🟠 Pendiente ${minutosEtapa}m`;
}

// ------------------------------------------------------
// 🔵 PREPARANDO
// ------------------------------------------------------
else if (p.estado === "preparando") {

    minutosEtapa = calcularMinutos(p.preparando_at || p.created_at);

    etiquetaEtapa = `🔵 Preparando ${minutosEtapa}m`;
}

// ------------------------------------------------------
// 🟢 LISTO
// ------------------------------------------------------
else if (p.estado === "listo") {

    minutosEtapa = calcularMinutos(p.listo_at || p.created_at);

    etiquetaEtapa = `🟢 Listo ${minutosEtapa}m`;
}

        const esCritico = minutos >= 15;
        const esAltoRiesgo = minutos >= demoraEstimada;

        card.className = `card estado-${p.estado}`;

        if (esCritico) card.classList.add("critico");
        else if (esAltoRiesgo) card.classList.add("prioridad");

        card.innerHTML = `
            <h3>🍕 Pedido #${p.id}</h3>

            <p><b>Cliente:</b> ${p.cliente}</p>
            <p><b>Detalle:</b> ${p.detalle}</p>
            <p><b>Total:</b> $${p.total}</p>

            <p><b>Estado:</b> ${p.estado}</p>

<p><b>Etapa:</b> ${etiquetaEtapa}</p>

<p><b>Tiempo:</b> ${minutos} min</p>

<p><b>Predicción:</b> ~${demoraEstimada} min</p>

${slaInfo.alerta ? `

    <div class="${slaInfo.clase}">

        ${slaInfo.alerta}

    </div>

` : ''}

            <div class="acciones">
                <button onclick="cambiarEstado(${p.id}, 'preparando')">👨‍🍳</button>
                <button onclick="cambiarEstado(${p.id}, 'listo')">✅</button>
                <button onclick="cambiarEstado(${p.id}, 'entregado')">🚚</button>
                <button onclick="cambiarEstado(${p.id}, 'cancelado')">❌</button>
            </div>
        `;

        if (p.estado === "pendiente") colPendientes.appendChild(card);
        else if (p.estado === "preparando") colPreparando.appendChild(card);
        else colListos.appendChild(card);
    });
}


// ======================================================
// 🔄 CAMBIO DE ESTADO
// ======================================================

async function cambiarEstado(id, estado) {

    if (actualizandoEstado) return;
    actualizandoEstado = true;

    try {

        await fetch(`/api/pedidos/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });

        await obtenerPedidos();

    } finally {
        actualizandoEstado = false;
    }
}

// ======================================================
// 📄 DETALLE PEDIDO
// ======================================================

async function verDetallePedido(id) {

    try {

        const res = await fetch(`/api/pedidos/${id}`);

        if (!res.ok) {
            throw new Error("Error obteniendo pedido");
        }

        const p = await res.json();

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

    } catch (err) {

        console.error(err);
        alert("❌ Error obteniendo detalle");
    }
}


// ======================================================
// 🟡 FILTRO
// ======================================================

function setFiltro(estado) {
    filtroEstado = estado;
    renderPedidos();
}


// ======================================================
// 📋 HISTORIAL (ESTABLE)
// ======================================================

async function abrirHistorial() {

    try {

        const res = await fetch('/api/pedidos/historial');
        const data = await res.json();

        const modal = document.getElementById('modalHistorial');

        if (!modal) {
            console.log(data);
            return;
        }

        const container = document.getElementById('contenidoHistorial');
        if (!container) return;

        modal.style.display = 'flex';
        container.innerHTML = "";

        data.forEach(p => {

            const div = document.createElement('div');
            div.className = 'historial-item';

            div.innerHTML = `
                <div>
                    <b>🍕 Pedido #${p.id}</b>
                    <span>${p.estado}</span>
                </div>

                <p><b>Cliente:</b> ${p.cliente}</p>
                <p><b>Total:</b> $${p.total}</p>
                <p><b>Actualizado:</b> ${p.updated_at || '-'}</p>

                <button onclick="verDetallePedido(${p.id})">
                    👁 Ver detalle
                </button>

                <hr>
            `;

            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
    }
}


// ======================================================
// 🚨 DEMORAS AUTOMÁTICAS
// ======================================================

function verificarDemorasAutomaticas() {

    const ahora = Date.now();

    // ======================================================
// 🚨 PEDIDOS CRÍTICOS MULTIESTADO
// ======================================================

const criticos = pedidos.filter(p => {

    if (!p.created_at) return false;

    const minutos = calcularMinutos(p.created_at);

    // Excluye pedidos finalizados
    if (
        p.estado === "entregado" ||
        p.estado === "cancelado"
    ) {
        return false;
    }

    // Crítico por tiempo total operativo
    return minutos >= 15;
});

    // ======================================================
    // 🚨 PANEL VISUAL CRÍTICOS
    // ======================================================

    const panel = document.getElementById("panelCriticos");

if (!panel) return;

if (criticos.length === 0) {

    panel.classList.add("oculto");
    return;
}

panel.classList.remove("oculto");

panel.innerHTML = `
    <h3>🚨 Pedidos críticos (${criticos.length})</h3>

    ${criticos.map(p => {

        const slaInfo =
            obtenerAlertaEtapa(p);

        return `

        <div class="critico-item">

            <b>🍕 Pedido #${p.id}</b><br>

            👤 ${p.cliente}<br>

            📌 Estado: ${p.estado}<br>

            ⏱ Total:
            ${calcularMinutos(p.created_at)} min<br>

            ${
                slaInfo.alerta
                ? `
                    <div class="${slaInfo.clase}">
                        ${slaInfo.alerta}
                    </div>

                    <small>
                        ⏱ Etapa:
                        ${slaInfo.minutosEtapa} min
                    </small>
                `
                : ''
            }

        </div>

        `;
    }).join('')}
`;
    // ======================================================
    // 🔊 ALERTA SONORA CADA 5 MIN
    // ======================================================

    if (ahora - ultimoSonidoDemora < 300000) return;

    ultimoSonidoDemora = ahora;

    sonarCriticos();
}


// ======================================================
// 🟢 UI SISTEMA
// ======================================================

function actualizarUI() {

    const el = document.getElementById('estadoSistema');
    if (!el) return;

    if (!ultimaActualizacion) {
        el.innerText = "🟡 Conectando...";
        return;
    }

    const diff = Date.now() - new Date(ultimaActualizacion).getTime();

    if (isNaN(diff) || diff < 0) {
        el.innerText = sistemaActivo
            ? "🟢 Activo hace 0m 0s"
            : "🔴 Sin conexión";
        return;
    }

    const seg = Math.floor(diff / 1000);
    const min = Math.floor(seg / 60);
    const segRest = seg % 60;

    el.innerText = sistemaActivo
        ? `🟢 Activo hace ${min}m ${segRest}s`
        : `🔴 Sin conexión`;

    const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
    const preparando = pedidos.filter(p => p.estado === "preparando").length;
    const listos = pedidos.filter(p => p.estado === "listo").length;
    const entregados = pedidos.filter(p => p.estado === "entregado").length;

    const c1 = document.getElementById("contadorPendientes");
    if (c1) c1.innerText = `📊 Pendientes: ${pendientes}`;

    const c2 = document.getElementById("contadorExtra");
    if (c2) c2.innerText = `👨‍🍳 Preparando: ${preparando} | ✅ Listos: ${listos} | 🚚 Entregados: ${entregados}`;

    const criticos = pedidos.filter(p => {
        if (!p.created_at) return false;
        return p.estado === "pendiente" && calcularMinutos(p.created_at) >= 15;
    }).length;

    const c3 = document.getElementById("contadorCriticos");
    if (c3) c3.innerText = `🚨 Críticos: ${criticos}`;
}

// ======================================================
// 🔁 INIT
// ======================================================

function iniciarPolling() {
    obtenerPedidos();
    setInterval(obtenerPedidos, REFRESH_MS);

    setInterval(actualizarUI, 1000);
}

// ======================================================
// 🌐 FIX GLOBAL SCOPE (ESTABLE)
// ======================================================

window.obtenerPedidos = obtenerPedidos;
window.renderPedidos = renderPedidos;
window.cambiarEstado = cambiarEstado;
window.verDetallePedido = verDetallePedido;
window.setFiltro = setFiltro;
window.actualizarUI = actualizarUI;

window.abrirHistorial = abrirHistorial;
window.cerrarHistorial = cerrarHistorial;

window.verificarDemorasAutomaticas = verificarDemorasAutomaticas;
window.calcularCargaCocina = calcularCargaCocina;
window.estimarDemoraPromedio = estimarDemoraPromedio;

window.sonarNuevoPedido = sonarNuevoPedido;
window.sonarCriticos = sonarCriticos;

window.iniciarPolling = iniciarPolling;
window.volver = volver;

// ======================================================
// 📋 FIX HISTORIAL MODAL (CRÍTICO)
// ======================================================

function cerrarHistorial() {
    const modal = document.getElementById('modalHistorial');
    if (!modal) return;
    modal.style.display = 'none';
}

// ======================================================
// 🖱 PANEL CRÍTICOS DRAGGABLE
// ======================================================

const panelCriticos = document.getElementById("panelCriticos");

let dragging = false;

let offsetX = 0;
let offsetY = 0;

// Protege el sistema si el panel no existe
if (panelCriticos) {

    panelCriticos.addEventListener("mousedown", (e) => {

        dragging = true;

        offsetX = e.clientX - panelCriticos.offsetLeft;
        offsetY = e.clientY - panelCriticos.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {

        if (!dragging) return;

        panelCriticos.style.left = (e.clientX - offsetX) + "px";
        panelCriticos.style.top = (e.clientY - offsetY) + "px";

        // Desactiva posicionamiento right
        // al mover manualmente el panel
        panelCriticos.style.right = "auto";
    });

    document.addEventListener("mouseup", () => {

        dragging = false;
    });
}






// ======================================================
// 🔙 VOLVER AL DASHBOARD
// ======================================================

function volver() {
    window.location.href = "/dashboard.html";
}

setInterval(() => {
    verificarDemorasAutomaticas();
}, 60000);
iniciarPolling();
