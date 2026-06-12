// ======================================================
// 🍕 PEDIDOS RENDER
// ARCHIVO: pedidos.render.js
// ======================================================


// ======================================================
// 📍 COLUMNAS
// ======================================================

function obtenerColumnas() {

    return {

        pendientes:
            document.getElementById(
                'colPendientes'
            ),

        preparando:
            document.getElementById(
                'colPreparando'
            ),

        listos:
            document.getElementById(
                'colListos'
            )
    };
}


// ======================================================
// 🧹 LIMPIAR TABLERO
// ======================================================

function limpiarColumnas() {

    const cols =
        obtenerColumnas();

    cols.pendientes?.replaceChildren();

    cols.preparando?.replaceChildren();

    cols.listos?.replaceChildren();
}


// ======================================================
// 🎨 CLASE TIEMPO
// ======================================================

function obtenerClaseTiempo(
    minutos
) {

    if (minutos >= 15) {

        return 'tiempo-critico';
    }

    if (minutos >= 10) {

        return 'tiempo-alerta';
    }

    if (minutos >= 5) {

        return 'tiempo-atencion';
    }

    return 'tiempo-normal';
}


// ======================================================
// 🎛 CONFIGURAR BOTÓN
// ======================================================

function configurarBotonAccion(
    btn,
    estado
) {

    btn.dataset.tooltip =
        `Cambiar a ${estado}`;

    btn.setAttribute(
        'aria-label',
        `Cambiar a ${estado}`
    );
}


// ======================================================
// 🔘 BOTONES POR ESTADO
// ======================================================

function obtenerAccionesPedido(
    pedido
) {

    if (
        pedido.estado === 'pendiente'
    ) {

        return [

            {
                icono: '👨‍🍳',
                estado: 'preparando'
            },

            {
                icono: '❌',
                estado: 'cancelado'
            }
        ];
    }

    if (
        pedido.estado === 'preparando'
    ) {

        return [

            {
                icono: '🟠',
                estado: 'pendiente'
            },

            {
                icono: '✅',
                estado: 'listo'
            },

            {
                icono: '❌',
                estado: 'cancelado'
            }
        ];
    }

    if (
        pedido.estado === 'listo'
    ) {

        return [

            {
                icono: '🔵',
                estado: 'preparando'
            },

            {
                icono: '🚚',
                estado: 'entregado'
            }
        ];
    }

    return [];
}


// ======================================================
// 🎛 CREAR ACCIONES
// ======================================================

function crearAccionesPedido(
    pedido
) {

    const acciones =
        document.createElement('div');

    acciones.className =
        'acciones';

    const estados =
        obtenerAccionesPedido(
            pedido
        );

    estados.forEach(item => {

        const btn =
            document.createElement(
                'button'
            );

        btn.textContent =
            item.icono;

        btn.classList.add(
            `accion-${item.estado}`
        );

        configurarBotonAccion(
            btn,
            item.estado
        );

        btn.onclick = () => {

            
            if (

    window.PedidosActions

    &&

    PedidosActions.cambiarEstado

) {

    PedidosActions.cambiarEstado(

        pedido.id,

        item.estado
    );
}
        };

        acciones.appendChild(btn);
    });

    return acciones;
}


// ======================================================
// 🎨 CREAR CARD
// ======================================================

function crearCardPedido(
    pedido
) {

    const card =
        document.createElement('div');

    card.className =
        `card estado-${pedido.estado}`;

    card.id =
        `pedido-${pedido.id}`;

    // ======================================================
    // ⏱ MÉTRICAS SLA
    // ======================================================

    const sla =
        pedido.sla || {};

    const prioridad =
        sla.prioridad || {};

    const etapa =
        sla.etapa || {};

    const minutosTotal =
    Math.floor(
        (
            sla.tiempoCola || 0
        )
        +
        (
            sla.tiempoCocina || 0
        )
        +
        (
            sla.tiempoSalida || 0
        )
    );
    
    // ======================================================
    // 🚨 ESTILO VISUAL
    // ======================================================

    if (
        prioridad.nivel === 'critica'
    ) {

        card.classList.add(
            'critico'
        );
    }

    else if (
        prioridad.nivel === 'urgente'
    ) {

        card.classList.add(
            'prioridad'
        );
    }

    // ======================================================
    // 🍕 TÍTULO
    // ======================================================

    const titulo =
        document.createElement('h3');

    titulo.textContent =
        `🍕 Pedido #${pedido.id}`;

    card.appendChild(titulo);

    // ======================================================
    // 👤 CLIENTE
    // ======================================================

    const cliente =
        document.createElement('p');

    cliente.textContent =
        `Cliente: ${pedido.cliente}`;

    card.appendChild(cliente);

    // ======================================================
    // 📦 DETALLE
    // ======================================================

    const detalle =
        document.createElement('p');

    detalle.textContent =
        `Detalle: ${pedido.detalle}`;

    card.appendChild(detalle);

    // ======================================================
    // 💰 TOTAL
    // ======================================================

    const total =
        document.createElement('p');

    total.textContent =
        `Total: $${pedido.total}`;

    card.appendChild(total);

    // ======================================================
    // 📌 ESTADO
    // ======================================================

    const estado =
        document.createElement('p');

    estado.textContent =
        `Estado: ${pedido.estado}`;

    card.appendChild(estado);

    // ======================================================
    // ⏱ TIEMPO TOTAL
    // ======================================================

    const tiempo =
        document.createElement('p');

    tiempo.className =
        obtenerClaseTiempo(
            minutosTotal
        );

    tiempo.textContent =
        `⏱ Total: ${minutosTotal} min`;

    card.appendChild(tiempo);

    // ======================================================
// 📍 SLA OPERACIONAL
// ======================================================

const etapaTiempo =
    document.createElement('p');

if (pedido.estado === 'pendiente') {

    etapaTiempo.textContent =
        `📍 Cola cocina: ${sla.tiempoCola || 0} min`;
}

else if (pedido.estado === 'preparando') {

    etapaTiempo.textContent =
        `👨‍🍳 Cocina: ${sla.tiempoCocina || 0} min`;
}

else if (pedido.estado === 'listo') {

    etapaTiempo.textContent =
        `🚚 Esperando entrega`;
}

card.appendChild(
    etapaTiempo
);

 
// ======================================================
// 🧠 PRIORIDAD SLA
// ======================================================

const prioridadEl =
    document.createElement('div');

if (sla.nivel === 'critico') {

    prioridadEl.className =
        'prioridad-critica';

    prioridadEl.textContent =
        '🚨 PRIORIDAD CRÍTICA';
}

else if (sla.nivel === 'atencion') {

    prioridadEl.className =
        'prioridad-urgente';

    prioridadEl.textContent =
        '⚠ PRIORIDAD URGENTE';
}

else {

    prioridadEl.className =
        'prioridad-normal';

    prioridadEl.textContent =
        '🟢 PRIORIDAD NORMAL';
}

card.appendChild(
    prioridadEl
);


    

    // ======================================================
    // 🎛 ACCIONES
    // ======================================================

    card.appendChild(
        crearAccionesPedido(
            pedido
        )
    );

    return card;
}


// ======================================================
// 📦 INSERTAR EN COLUMNA
// ======================================================

function insertarPedidoEnColumna(
    pedido,
    card
) {

    const cols =
        obtenerColumnas();

    if (
        pedido.estado === 'pendiente'
    ) {

        cols.pendientes
            ?.appendChild(card);

        return;
    }

    if (
        pedido.estado === 'preparando'
    ) {

        cols.preparando
            ?.appendChild(card);

        return;
    }

    if (
        pedido.estado === 'listo'
    ) {

        cols.listos
            ?.appendChild(card);
    }
}


// ======================================================
// 🎨 RENDER PEDIDOS
// ======================================================

function renderPedidos(
    pedidos = []
) {

    limpiarColumnas();

    // ======================================================
    // 🎯 FILTRAR PEDIDOS
    // ======================================================

    const pedidosFiltrados =
        pedidos.filter(pedido => {

            // ======================================================
            // 🚫 OCULTAR FINALIZADOS
            // ======================================================

            if (

                pedido.estado === 'entregado'

                ||

                pedido.estado === 'cancelado'

            ) {

                return false;
            }

            // ======================================================
            // 🎛 FILTRO ACTIVO
            // ======================================================

            if (

                PedidosState.filtroEstado !== 'todos'

                &&

                pedido.estado
                !== PedidosState.filtroEstado

            ) {

                return false;
            }

            return true;
        });

    // ======================================================
    // 🎨 RENDER
    // ======================================================

    pedidosFiltrados.forEach(pedido => {

        const card =
            crearCardPedido(
                pedido
            );

        insertarPedidoEnColumna(
            pedido,
            card
        );
    });
}

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
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosRender = {

    renderPedidos,

    crearCardPedido,

    obtenerAccionesPedido,

    obtenerClaseTiempo,

    renderPanelCriticos
};