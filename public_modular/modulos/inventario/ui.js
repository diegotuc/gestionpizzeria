// ==============================
// UI INVENTARIO
// ==============================

// ==============================
// MOSTRAR PANEL
// ==============================
function mostrarPanel(panel) {

    const dashboard =
        document.getElementById(
            'panel-dashboard'
        );

    const historial =
        document.getElementById(
            'panel-historial'
        );

    const metricas =
        document.getElementById(
            'panel-metricas'
        );

    if (!dashboard || !historial || !metricas) {
        return;
    }

    // ==========================
    // OCULTAR TODO
    // ==========================
    dashboard.classList.add('oculto');
    historial.classList.add('oculto');
    metricas.classList.add('oculto');

    // ==========================
    // MOSTRAR PANEL
    // ==========================
    switch (panel) {

        case 'dashboard':
            dashboard.classList.remove('oculto');
            break;

        case 'historial':
            historial.classList.remove('oculto');
            break;

        case 'metricas':
            metricas.classList.remove('oculto');
            break;
    }
}

// ==============================
// NAVBAR
// ==============================
function setupNavbar() {

    document.getElementById(
        'btn-nav-dashboard'
    )?.addEventListener(

        'click',

        () => mostrarPanel('dashboard')
    );

    document.getElementById(
        'btn-nav-historial'
    )?.addEventListener(

        'click',

        () => mostrarPanel('historial')
    );

    document.getElementById(
        'btn-nav-metricas'
    )?.addEventListener(

        'click',

        () => mostrarPanel('metricas')
    );
}

// ==============================
// FILTROS
// ==============================
function setupFiltros() {

    document.getElementById(
        'busqueda-producto'
    )?.addEventListener(

        'input',

        () => {

            if (
                window.inventarioApp
                &&
                window.inventarioApp.aplicarFiltros
            ) {

                window.inventarioApp.aplicarFiltros();
            }
        }
    );

    document.getElementById(
        'filtro-estado'
    )?.addEventListener(

        'change',

        () => {

            if (
                window.inventarioApp
                &&
                window.inventarioApp.aplicarFiltros
            ) {

                window.inventarioApp.aplicarFiltros();
            }
        }
    );

    document.getElementById(
        'orden-productos'
    )?.addEventListener(

        'change',

        () => {

            if (
                window.inventarioApp
                &&
                window.inventarioApp.aplicarFiltros
            ) {

                window.inventarioApp.aplicarFiltros();
            }
        }
    );
}

// ==============================
// INIT UI
// ==============================
export function initUI() {

    setupNavbar();

    setupFiltros();

    mostrarPanel('dashboard');
}