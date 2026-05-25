// ===== DASHBOARD API =====

/**
 * =================================
 * OBTENER RESUMEN DASHBOARD
 * =================================
 */
async function obtenerResumenDashboard() {

    try {

        const response =
            await fetch(
                '/api/dashboard/resumen'
            );

        return await response.json();

    } catch (error) {

        console.error(
            'Error API dashboard:',
            error
        );

        return {

            ventasHoy: 0,

            montoVentasHoy: 0,

            cajaEstado: 'CERRADA',

            productosActivos: 0,

            productosCriticos: 0,

            productosSinStock: 0,

            valorInventario: 0
        };
    }
}

/**
 * =================================
 * OBTENER ÚLTIMAS VENTAS
 * =================================
 */
async function obtenerUltimasVentas() {

    try {

        const response =
            await fetch(
                '/api/ventas/listado'
            );

        const data =
            await response.json();

        return data.slice(0, 5);

    } catch (error) {

        console.error(
            'Error obteniendo ventas:',
            error
        );

        return [];
    }
}

/**
 * =================================
 * OBTENER MOVIMIENTOS STOCK
 * =================================
 */
async function obtenerMovimientosStock() {

    try {

        const response =
            await fetch(
                '/api/inventario/movimientos'
            );

        const data =
            await response.json();

        return data.slice(0, 5);

    } catch (error) {

        console.error(
            'Error obteniendo movimientos:',
            error
        );

        return [];
    }
}

/**
 * =================================
 * OBTENER AUDITORÍA
 * =================================
 */
async function obtenerAuditoriaAdmin() {

    try {

        const response =
            await fetch(
                '/api/inventario/auditoria'
            );

        const data =
            await response.json();

        return data.slice(0, 5);

    } catch (error) {

        console.error(
            'Error obteniendo auditoría:',
            error
        );

        return [];
    }
}

/**
 * =================================
 * OBTENER VENTAS 7 DÍAS
 * =================================
 */
async function obtenerVentas7Dias() {

    try {

        const response =
            await fetch(
                '/api/dashboard/ventas-7dias'
            );

        return await response.json();

    } catch (error) {

        console.error(
            'Error ventas 7 días:',
            error
        );

        return [];
    }
}

/**
 * =================================
 * OBTENER KPIs DASHBOARD
 * =================================
 */
async function obtenerKPIsDashboard() {

    try {

        const response =
            await fetch(
                '/api/dashboard/kpis'
            );

        return await response.json();

    } catch (error) {

        console.error(
            'Error KPIs dashboard:',
            error
        );

        return {

            ventasHoy: 0,
            ventasAyer: 0,
            montoHoy: 0,
            montoAyer: 0,
            diferenciaPorcentual: 0,
            tendencia: 'POSITIVA'
        };
    }
}

/**
 * =================================
 * OBTENER PRODUCTOS TOP
 * =================================
 */
async function obtenerProductosTop() {

    try {

        const response =
            await fetch(
                '/api/dashboard/productos-top'
            );

        return await response.json();

    } catch (error) {

        console.error(
            'Error productos top:',
            error
        );

        return [];
    }
}