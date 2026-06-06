// ======================================================
// 🍕 PEDIDOS API
// ARCHIVO: pedidos.api.js
// ======================================================


// ======================================================
// 📡 BASE REQUEST
// ======================================================

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(url, {

            headers: {

                'Content-Type':
                    'application/json',

                ...(options.headers || {})
            },

            ...options
        });

    // ======================================================
    // ❌ ERROR HTTP
    // ======================================================

    if (!response.ok) {

        let mensaje =
            'Error de servidor';

        try {

            const error =
                await response.json();

            mensaje =
                error.error
                || mensaje;
        }

        catch (_) {}

        throw new Error(mensaje);
    }

    return response.json();
}


// ======================================================
// 📋 OBTENER PEDIDOS
// ======================================================

async function obtenerPedidosAPI() {

    return apiRequest(
        '/api/pedidos'
    );
}


// ======================================================
// 📋 OBTENER HISTORIAL
// ======================================================

async function obtenerHistorialAPI() {

    return apiRequest(
        '/api/pedidos/historial'
    );
}


// ======================================================
// 📄 OBTENER DETALLE
// ======================================================

async function obtenerDetallePedidoAPI(
    id
) {

    return apiRequest(
        `/api/pedidos/${id}`
    );
}


// ======================================================
// ➕ CREAR PEDIDO
// ======================================================

async function crearPedidoAPI(
    data
) {

    return apiRequest(
        '/api/pedidos',
        {

            method: 'POST',

            body: JSON.stringify(data)
        }
    );
}


// ======================================================
// 🔄 CAMBIAR ESTADO
// ======================================================

async function cambiarEstadoPedidoAPI(
    id,
    estado
) {

    return apiRequest(
        `/api/pedidos/${id}/estado`,
        {

            method: 'PATCH',

            body: JSON.stringify({
                estado
            })
        }
    );
}


// ======================================================
// 📊 MÉTRICAS OPERACIONALES
// ======================================================

async function obtenerMetricasAPI() {

    return apiRequest(
        '/api/pedidos/metricas/resumen'
    );
}


// ======================================================
// 📦 EXPORTS GLOBALES
// ======================================================

window.PedidosAPI = {

    obtenerPedidos:
        obtenerPedidosAPI,

    obtenerHistorial:
        obtenerHistorialAPI,

    obtenerDetalle:
        obtenerDetallePedidoAPI,

    crearPedido:
        crearPedidoAPI,

    cambiarEstado:
        cambiarEstadoPedidoAPI,

    obtenerMetricas:
        obtenerMetricasAPI
};