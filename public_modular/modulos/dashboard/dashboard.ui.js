// ===== DASHBOARD UI =====

// ===============================
// CONTROL INTERVAL
// ===============================
let dashboardInterval = null;

// ===============================
// CONTROL CARGA
// EVITA SOLAPAMIENTO
// ===============================
let dashboardCargando = false;

/**
 * =================================
 * CARGAR DASHBOARD
 * =================================
 */
async function cargarDashboard() {

    // =========================
    // EVITAR DOBLE EJECUCIÓN
    // =========================
    if (dashboardCargando) {
        return;
    }

    dashboardCargando = true;

    try {

        // =========================
        // VALIDAR DOM
        // =========================
        const ventasHoy =
            document.getElementById(
                'ventasHoy'
            );

        if (!ventasHoy) {

            console.warn(
                'Dashboard no disponible en DOM'
            );

            return;
        }

        // =========================
        // OBTENER DATOS BASE
        // =========================
        const data =
            await obtenerResumenDashboard();

        // =========================
        // RENDER BASE
        // =========================
        renderMetricas(data);

        renderAlertas(data);

        // =========================
        // EXTRA DATA
        // =========================
        await Promise.all([
            cargarUltimasVentas(),
            cargarMovimientosStock(),
            cargarAuditoriaAdmin(),
            cargarAnalyticsDashboard()
        ]);

    } catch (error) {

        console.error(
            'Error cargando dashboard:',
            error
        );

    } finally {

        dashboardCargando = false;
    }
}

/**
 * =================================
 * ANALYTICS DASHBOARD
 * =================================
 */
async function cargarAnalyticsDashboard() {

    try {

        // =========================
        // OBTENER ANALYTICS
        // =========================
        const [
            ventas7Dias,
            kpis,
            productosTop
        ] = await Promise.all([
            obtenerVentas7Dias(),
            obtenerKPIsDashboard(),
            obtenerProductosTop()
        ]);

        // =========================
        // RENDERS ANALYTICS
        // =========================
        renderResumenSemanal(
            ventas7Dias
        );

        renderKPIsAvanzados(
            kpis
        );

        renderProductosTop(
            productosTop
        );

    } catch (error) {

        console.error(
            'Error analytics dashboard:',
            error
        );
    }
}

/**
 * =================================
 * ÚLTIMAS VENTAS
 * =================================
 */
async function cargarUltimasVentas() {

    try {

        const response =
            await fetch(
                '/api/ventas/listado'
            );

        const ventas =
            await response.json();

        renderUltimasVentas(
            ventas.slice(0, 5)
        );

    } catch (error) {

        console.error(
            'Error ventas dashboard:',
            error
        );
    }
}

/**
 * =================================
 * MOVIMIENTOS STOCK
 * =================================
 */
async function cargarMovimientosStock() {

    try {

        const response =
            await fetch(
                '/api/inventario/movimientos'
            );

        const movimientos =
            await response.json();

        renderMovimientosStock(
            movimientos.slice(0, 5)
        );

    } catch (error) {

        console.error(
            'Error movimientos dashboard:',
            error
        );
    }
}

/**
 * =================================
 * AUDITORÍA ADMIN
 * =================================
 */
async function cargarAuditoriaAdmin() {

    try {

        const response =
            await fetch(
                '/api/inventario/auditoria'
            );

        const auditoria =
            await response.json();

        renderAuditoria(
            auditoria.slice(0, 5)
        );

    } catch (error) {

        console.error(
            'Error auditoría dashboard:',
            error
        );
    }
}

/**
 * =================================
 * INICIAR DASHBOARD
 * =================================
 */
function iniciarDashboard() {

    // =========================
    // EVITAR DOBLE INTERVAL
    // =========================
    if (dashboardInterval) {

        clearInterval(
            dashboardInterval
        );
    }

    // =========================
    // PRIMERA CARGA
    // =========================
    cargarDashboard();

    // =========================
    // POLLING
    // =========================
    dashboardInterval =
        setInterval(() => {

            cargarDashboard();

        }, 5000);
}