// ==============================
// IMPORTS API
// ==============================
import {
    apiGetProductos,
    apiCrearProducto,
    apiEditarProducto,
    apiDesactivarProducto,
    apiReactivarProducto,
    apiIngresarStock,
    apiGetAuditoria,
    apiGetMetricas
} from '/modulos/inventario/api.js';


// ==============================
// IMPORTS RENDER
// ==============================
import {
    renderProductos,
    renderAuditoria,
    renderMetricas
} from '/modulos/inventario/render.js';

// ==============================
// IMPORT UI
// ==============================
// AHORA:
// - navbar
// - paneles
// - filtros UI
// viven en ui.js
// ==============================
import {
    initUI
} from '/modulos/inventario/ui.js';

// ==============================
// ESTADO GLOBAL
// ==============================
let productosGlobal = [];

let auditoriaGlobal = [];

let metricasGlobal = {};

/*// ==============================
// FORMATEAR FECHA ARGENTINA
// ==============================
function formatearFechaArgentina(fecha) {

    if (!fecha) return '-';

    const fechaObj =
        new Date(fecha);

    return fechaObj.toLocaleString(

        'es-AR',

        {

            day: '2-digit',

            month: '2-digit',

            year: 'numeric',

            hour: '2-digit',

            minute: '2-digit',

            second: '2-digit'
        }
    );
}*/

/**
 * =================================
 * FORMATEAR FECHA ARGENTINA
 * =================================
 */
function formatearFechaArgentina(fecha) {

    if (!fecha) return '';

    const fechaObj = new Date(fecha);

    return fechaObj.toLocaleString(
        'es-AR',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',

            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',

            hour12: false
        }
    );
}

// ==============================
// FILTROS
// ==============================
// SE MANTIENE AQUÍ
// porque pertenece a lógica
// NO a manipulación visual
// ==============================
function aplicarFiltros() {

    const texto =
        document.getElementById(
            'busqueda-producto'
        )?.value?.toLowerCase() || '';

    const filtroEstado =
        document.getElementById(
            'filtro-estado'
        )?.value || 'todos';

    const orden =
        document.getElementById(
            'orden-productos'
        )?.value || 'id-desc';

    let resultado =
        [...productosGlobal];

    // ==========================
    // BUSCADOR
    // ==========================
    resultado = resultado.filter(p =>

        p.nombre
            .toLowerCase()
            .includes(texto)

        ||

        String(p.id)
            .includes(texto)
    );

    // ==========================
    // FILTRO ESTADO
    // ==========================
    if (filtroEstado === 'activos') {

        resultado =
            resultado.filter(
                p => Number(p.activo) === 1
            );
    }

    if (filtroEstado === 'inactivos') {

        resultado =
            resultado.filter(
                p => Number(p.activo) === 0
            );
    }

    // ==========================
    // ORDENAMIENTO
    // ==========================
    switch (orden) {

        case 'id-desc':

            resultado.sort(
                (a, b) => b.id - a.id
            );

            break;

        case 'id-asc':

            resultado.sort(
                (a, b) => a.id - b.id
            );

            break;

        case 'az':

            resultado.sort(
                (a, b) =>
                    a.nombre.localeCompare(
                        b.nombre
                    )
            );

            break;

        case 'za':

            resultado.sort(
                (a, b) =>
                    b.nombre.localeCompare(
                        a.nombre
                    )
            );

            break;

        case 'stock-desc':

            resultado.sort(
                (a, b) =>
                    b.stock - a.stock
            );

            break;

        case 'stock-asc':

            resultado.sort(
                (a, b) =>
                    a.stock - b.stock
            );

            break;
    }

    renderProductos(resultado);
}

// ==============================
// EXPONER FILTROS A UI.JS
// ==============================
window.inventarioApp = {

    aplicarFiltros
};

// ==============================
// LOADERS
// ==============================
async function cargarProductos() {

    const data =
        await apiGetProductos();

    productosGlobal =
        data;

    aplicarFiltros();
}

async function cargarAuditoria() {

    const data =
        await apiGetAuditoria();

    // ==========================
    // FORMATEAR FECHAS
    // ==========================
    auditoriaGlobal =
        data.map(item => ({

            ...item,

            fecha:
                formatearFechaArgentina(
                    item.fecha
                )
        }));

    renderAuditoria(
        auditoriaGlobal
    );
}

async function cargarMetricas() {

    const data =
        await apiGetMetricas();

    metricasGlobal =
        data;

    renderMetricas(
        metricasGlobal
    );
}

// ==============================
// REFRESH GLOBAL
// ==============================
async function refrescarTodo() {

    await Promise.all([

        cargarProductos(),

        cargarAuditoria(),

        cargarMetricas()
    ]);
}

// ==============================
// AUTO REFRESH
// ==============================
setInterval(() => {

    refrescarTodo();

}, 5000);

// ==============================
// CREAR PRODUCTO
// ==============================
async function crearProducto() {

    const nombre =
        document.getElementById(
            'nombre'
        )?.value;

    const precio =
        parseFloat(
            document.getElementById(
                'precio'
            )?.value
        );

    const stock =
        parseFloat(
            document.getElementById(
                'stock'
            )?.value
        );

    if (

        !nombre ||

        isNaN(precio) ||

        isNaN(stock)

    ) {

        return;
    }

    await apiCrearProducto({

        nombre,
        precio,
        stock
    });

    limpiarFormulario();

    refrescarTodo();
}

// ==============================
// LIMPIAR FORM
// ==============================
function limpiarFormulario() {

    document.getElementById(
        'nombre'
    ).value = '';

    document.getElementById(
        'precio'
    ).value = '';

    document.getElementById(
        'stock'
    ).value = '';
}

// ==============================
// UI BRIDGE
// ==============================
window.inventarioUI = {

    editar: async (
        id,
        nombre,
        precio
    ) => {

        const n =
            prompt(
                'Nombre:',
                nombre
            );

        if (!n) return;

        const p =
            prompt(
                'Precio:',
                precio
            );

        if (!p) return;

        await apiEditarProducto(

            id,

            {
                nombre: n,

                precio:
                    parseFloat(p)
            }
        );

        refrescarTodo();
    },

    desactivar: async (id) => {

        if (
            !confirm(
                '¿Desactivar producto?'
            )
        ) {
            return;
        }

        await apiDesactivarProducto(id);

        refrescarTodo();
    },

    reactivar: async (id) => {

        await apiReactivarProducto(id);

        refrescarTodo();
    },

    ingresarStock: async (
        id,
        nombre
    ) => {

        const c =
            prompt(
                `Cantidad para ${nombre}`
            );

        if (!c) return;

        await apiIngresarStock({

            producto_id: id,

            cantidad:
                parseFloat(c),

            motivo:
                'Inventario'
        });

        refrescarTodo();
    }
};

// ==============================
// EVENTOS LOCALES
// ==============================
function setupEventos() {

    document.getElementById(
        'btn-guardar'
    )?.addEventListener(

        'click',

        crearProducto
    );
}

// ==============================
// INIT
// ==============================
function init() {

    // ==========================
    // UI
    // ==========================
    initUI();

    // ==========================
    // EVENTOS
    // ==========================
    setupEventos();

    // ==========================
    // CARGA INICIAL
    // ==========================
    refrescarTodo();
}

// ==============================
// START
// ==============================
document.addEventListener(

    'DOMContentLoaded',

    init
);