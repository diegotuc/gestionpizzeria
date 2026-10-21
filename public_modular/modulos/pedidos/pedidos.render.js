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
                typeof cambiarEstado
                === 'function'
            ) {

                cambiarEstado(
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

    pedidos.forEach(pedido => {

        // ======================================================
        // 🚫 OCULTAR FINALIZADOS
        // ======================================================

        if (

            pedido.estado === 'entregado'

            ||

            pedido.estado === 'cancelado'

        ) {

            return;
        }

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
// 🌐 EXPORT GLOBAL
// ======================================================

window.PedidosRender = {

    renderPedidos,

    crearCardPedido,

    obtenerAccionesPedido,

    obtenerClaseTiempo
};