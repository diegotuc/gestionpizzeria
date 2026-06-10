// ======================================================
// 🟢 UI PEDIDOS
// pedidos.ui.js
// ======================================================


// ======================================================
// 🟢 ACTUALIZAR UI GENERAL
// ======================================================

function actualizarUI() {

    const el =
        document.getElementById(
            'estadoSistema'
        );

    if (!el) return;

    // ======================================================
    // 🟡 SIN ACTUALIZACIÓN
    // ======================================================

    if (!PedidosState.ultimaActualizacion) {

        el.innerText =
            "🟡 Conectando...";

        return;
    }

    // ======================================================
    // ⏱ DIFERENCIA TIEMPO
    // ======================================================

    const diff =
        Date.now()
        - new Date(
            PedidosState.ultimaActualizacion
        ).getTime();

    // ======================================================
    // 🚫 ERROR FECHA
    // ======================================================

    if (
        isNaN(diff)
        ||
        diff < 0
    ) {

        el.innerText =
            PedidosState.sistemaActivo
                ? "🟢 Activo hace 0m 0s"
                : "🔴 Sin conexión";

        return;
    }

    // ======================================================
    // ⏱ TIEMPO ACTIVO
    // ======================================================

    const seg =
        Math.floor(diff / 1000);

    const min =
        Math.floor(seg / 60);

    const segRest =
        seg % 60;

    el.innerText =
        PedidosState.sistemaActivo
            ? `🟢 Activo hace ${min}m ${segRest}s`
            : `🔴 Sin conexión`;

    // ======================================================
    // 📊 CONTADORES
    // ======================================================

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

    const entregados =
        PedidosState.pedidos.filter(
            p => p.estado === "entregado"
        ).length;

    const criticos =
        PedidosSLA.obtenerPedidosCriticos()
            .length;

    // ======================================================
    // 📦 CONTADOR PENDIENTES
    // ======================================================

    const c1 =
        document.getElementById(
            "contadorPendientes"
        );

    if (c1) {

        c1.innerText =
            `📊 Pendientes: ${pendientes}`;
    }

    // ======================================================
    // 👨‍🍳 CONTADOR OPERACIONAL
    // ======================================================

    const c2 =
        document.getElementById(
            "contadorExtra"
        );

    if (c2) {

        c2.innerText =
            `👨‍🍳 Preparando: ${preparando} | ✅ Listos: ${listos} | 🚚 Entregados: ${entregados}`;
    }

    // ======================================================
    // 🚨 CONTADOR CRÍTICOS
    // ======================================================

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
// 🟡 FILTRO ESTADO
// ======================================================

function setFiltro(estado) {

    PedidosState.filtroEstado =
        estado;

    const botones =
        document.querySelectorAll(
            "[data-filtro]"
        );

    botones.forEach(btn => {

        btn.classList.remove(
            "filtro-activo"
        );

        if (
            btn.dataset.filtro
            === estado
        ) {

            btn.classList.add(
                "filtro-activo"
            );
        }
    });

    PedidosRender.renderPedidos(
        PedidosState.pedidos
    );
}


// ======================================================
// 📋 ABRIR HISTORIAL
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

        container.replaceChildren();

        data.forEach(p => {

            const div =
                document.createElement(
                    'div'
                );

            div.className =
                'historial-item';

            // ======================================================
            // 🍕 TITULO
            // ======================================================

            const titulo =
                document.createElement(
                    'div'
                );

            titulo.textContent =
                `🍕 Pedido #${p.id} - ${p.estado}`;

            div.appendChild(titulo);

            // ======================================================
            // 👤 CLIENTE
            // ======================================================

            const cliente =
                document.createElement(
                    'p'
                );

            cliente.textContent =
                `Cliente: ${p.cliente}`;

            div.appendChild(cliente);

            // ======================================================
            // 💰 TOTAL
            // ======================================================

            const total =
                document.createElement(
                    'p'
                );

            total.textContent =
                `Total: $${p.total}`;

            div.appendChild(total);

            // ======================================================
            // 🕒 FECHA
            // ======================================================

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

            // ======================================================
            // 👁 DETALLE
            // ======================================================

            const btn =
                document.createElement(
                    'button'
                );

            btn.textContent =
                '👁 Ver detalle';

            

              btn.onclick = () => {

    if (

        window.PedidosActions

        &&

        PedidosActions.verDetallePedido

    ) {

        PedidosActions.verDetallePedido(
            p.id
        );
    }
};

            div.appendChild(btn);

            // ======================================================
            // 📏 SEPARADOR
            // ======================================================

            const hr =
                document.createElement(
                    'hr'
                );

            div.appendChild(hr);

            container.appendChild(div);
        });

     } // ← cierre del try
    

    catch (err) {

        console.error(
            '❌ Error historial:',
            err
        );
    }
}


// ======================================================
// ❌ CERRAR HISTORIAL
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
// 🔙 VOLVER DASHBOARD
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
// 📦 NAMESPACE UI
// ======================================================

window.PedidosUI = {

    actualizarUI,

    setFiltro,

    abrirHistorial,

    cerrarHistorial,

    volver,

    irAPedido
};


// ======================================================
// 🌐 BRIDGES HTML LEGACY
// ======================================================

window.setFiltro =
    (...args) =>
        PedidosUI.setFiltro(...args);

window.abrirHistorial =
    (...args) =>
        PedidosUI.abrirHistorial(...args);

window.cerrarHistorial =
    (...args) =>
        PedidosUI.cerrarHistorial(...args);

window.volver =
    (...args) =>
        PedidosUI.volver(...args);