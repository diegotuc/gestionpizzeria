/**
 * ===============================
 * REPORTE ACTIVO
 * ===============================
 */
let reporteActivo = 'ventas';

/**
 * ===============================
 * FORMATEAR MONEDA
 * ===============================
 */
function formatearMoneda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            'es-AR',
            {
                style: 'currency',
                currency: 'ARS'
            }
        );
}

/**
 * ===============================
 * FORMATEAR FECHA
 * ===============================
 */
function formatearFecha(fecha) {

    if (!fecha) return '-';

    const f = new Date(fecha);

    return f.toLocaleDateString(
        'es-AR'
    );
}

/**
 * ===============================
 * OBTENER FILTROS
 * ===============================
 */
function obtenerFiltros() {

    return {

        desde:
            document.getElementById(
                'fechaDesde'
            )?.value || '',

        hasta:
            document.getElementById(
                'fechaHasta'
            )?.value || ''
    };
}

/**
 * ===============================
 * APLICAR FILTROS
 * ===============================
 */
function aplicarFiltros() {

    if (reporteActivo === 'ventas') {

        cargarReporteVentas();

    } else if (
        reporteActivo === 'caja'
    ) {

        cargarReporteCaja();

    } else if (
        reporteActivo === 'movimientos'
    ) {

        cargarReporteMovimientos();

    } else if (
        reporteActivo === 'inventario'
    ) {

        cargarReporteInventario();
    }
}

/**
 * ===============================
 * RENDER HEADERS TABLA
 * ===============================
 */
function renderHeaders(headers) {

    const thead =
        document.getElementById(
            'tablaHead'
        );

    thead.innerHTML = `
        <tr>
            ${headers.map(h =>
                `<th>${h}</th>`
            ).join('')}
        </tr>
    `;
}

/**
 * ===============================
 * RENDER RESUMEN DINÁMICO
 * ===============================
 */
function renderResumen(cards) {

    const contenedor =
        document.getElementById(
            'resumenCards'
        );

    if (!contenedor) return;

    contenedor.innerHTML =
        cards.map(card => `

            <div class="card">

                <h2>
                    ${card.titulo}
                </h2>

                <p>
                    ${card.valor}
                </p>

            </div>

        `).join('');
}

/**
 * ===============================
 * REPORTE VENTAS
 * ===============================
 */
async function cargarReporteVentas() {

    try {

        reporteActivo = 'ventas';

        const filtros =
            obtenerFiltros();

        const query =
            new URLSearchParams({

                desde:
                    filtros.desde,

                hasta:
                    filtros.hasta
            });

        const res =
            await fetch(
                `/api/reportes/ventas?${query}`
            );

        const data =
            await res.json();

        // =========================
        // HEADERS
        // =========================
        renderHeaders([
            'ID',
            'Cliente',
            'Total',
            'Fecha'
        ]);

        // =========================
        // RESUMEN
        // =========================
        renderResumen([
            {

                titulo:
                    'Total Ventas',

                valor:
                    data.totalVentas || 0
            },

            {

                titulo:
                    'Total Facturado',

                valor:
                    formatearMoneda(
                        data.totalGeneral
                    )
            }
        ]);

        // =========================
        // TABLA
        // =========================
        renderTablaVentas(
            data.ventas || []
        );

    } catch (error) {

        console.error(
            'Error reporte ventas:',
            error
        );
    }
}

/**
 * ===============================
 * TABLA VENTAS
 * ===============================
 */
function renderTablaVentas(ventas) {

    const tabla =
        document.getElementById(
            'tablaVentas'
        );

    if (!ventas.length) {

        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    No hay ventas registradas
                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML =
        ventas.map(venta => `

            <tr>

                <td>
                    ${venta.id}
                </td>

                <td>
                    ${venta.cliente || '-'}
                </td>

                <td>
                    ${formatearMoneda(
                        venta.total
                    )}
                </td>

                <td>
                    ${formatearFecha(
                        venta.fecha
                    )}
                </td>

            </tr>

        `).join('');
}

/**
 * ===============================
 * REPORTE CAJA
 * ===============================
 */
async function cargarReporteCaja() {

    try {

        reporteActivo = 'caja';

        const filtros =
            obtenerFiltros();

        const query =
            new URLSearchParams({

                desde:
                    filtros.desde,

                hasta:
                    filtros.hasta
            });

        const res =
            await fetch(
                `/api/reportes/caja?${query}`
            );

        const data =
            await res.json();

        renderHeaders([
            'Fecha',
            'Apertura',
            'Ingresos',
            'Egresos',
            'Cierre'
        ]);

        // =========================
        // RESUMEN
        // =========================
        const totalIngresos =
            data.reduce(
                (acc, item) =>
                    acc + Number(item.ingresos || 0),
                0
            );

        const totalEgresos =
            data.reduce(
                (acc, item) =>
                    acc + Number(item.egresos || 0),
                0
            );

        const balance =
            totalIngresos - totalEgresos;

        renderResumen([
            {

                titulo:
                    'Ingresos',

                valor:
                    formatearMoneda(
                        totalIngresos
                    )
            },

            {

                titulo:
                    'Egresos',

                valor:
                    formatearMoneda(
                        totalEgresos
                    )
            },

            {

                titulo:
                    'Balance',

                valor:
                    formatearMoneda(
                        balance
                    )
            }
        ]);

        const tabla =
            document.getElementById(
                'tablaVentas'
            );

        if (!data.length) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay movimientos de caja
                    </td>
                </tr>
            `;

            return;
        }

        tabla.innerHTML =
            data.map(item => `

                <tr>

                    <td>
                        ${formatearFecha(item.fecha)}
                    </td>

                    <td>
                        ${formatearMoneda(item.apertura)}
                    </td>

                    <td>
                        ${formatearMoneda(item.ingresos)}
                    </td>

                    <td>
                        ${formatearMoneda(item.egresos)}
                    </td>

                    <td>
                        ${formatearMoneda(item.cierre)}
                    </td>

                </tr>

            `).join('');

    } catch (error) {

        console.error(
            'Error reporte caja:',
            error
        );
    }
}

/**
 * ===============================
 * REPORTE INVENTARIO
 * ===============================
 */
async function cargarReporteInventario() {

    try {

        reporteActivo = 'inventario';

        const res =
            await fetch(
                '/api/reportes/inventario'
            );

        const data =
            await res.json();

        renderHeaders([
            'ID',
            'Producto',
            'Stock',
            'Precio',
            'Valorizado'
        ]);

        // =========================
        // RESUMEN
        // =========================
        const stockTotal =
            data.reduce(
                (acc, item) =>
                    acc + Number(item.stock || 0),
                0
            );

        const valorizacionTotal =
            data.reduce(
                (acc, item) =>
                    acc + Number(item.valorizado || 0),
                0
            );

        renderResumen([
            {

                titulo:
                    'Productos',

                valor:
                    data.length
            },

            {

                titulo:
                    'Stock Total',

                valor:
                    stockTotal
            },

            {

                titulo:
                    'Valorización',

                valor:
                    formatearMoneda(
                        valorizacionTotal
                    )
            }
        ]);

        const tabla =
            document.getElementById(
                'tablaVentas'
            );

        if (!data.length) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay productos
                    </td>
                </tr>
            `;

            return;
        }

        tabla.innerHTML =
            data.map(item => `

                <tr>

                    <td>${item.id}</td>

                    <td>${item.nombre}</td>

                    <td>${item.stock}</td>

                    <td>
                        ${formatearMoneda(item.precio)}
                    </td>

                    <td>
                        ${formatearMoneda(item.valorizado)}
                    </td>

                </tr>

            `).join('');

    } catch (error) {

        console.error(
            'Error reporte inventario:',
            error
        );
    }
}

/**
 * ===============================
 * REPORTE MOVIMIENTOS
 * ===============================
 */
async function cargarReporteMovimientos() {

    try {

        reporteActivo = 'movimientos';

        const filtros =
            obtenerFiltros();

        const query =
            new URLSearchParams({

                desde:
                    filtros.desde,

                hasta:
                    filtros.hasta
            });

        const res =
            await fetch(
                `/api/reportes/movimientos?${query}`
            );

        const data =
            await res.json();

        renderHeaders([
            'ID',
            'Producto',
            'Tipo',
            'Cantidad',
            'Motivo'
        ]);

        // =========================
        // RESUMEN
        // =========================
        const entradas =
            data.filter(
                item =>
                    item.tipo === 'entrada'
            ).length;

        const salidas =
            data.filter(
                item =>
                    item.tipo === 'venta' ||
                    item.tipo === 'salida'
            ).length;

        renderResumen([
            {

                titulo:
                    'Movimientos',

                valor:
                    data.length
            },

            {

                titulo:
                    'Entradas',

                valor:
                    entradas
            },

            {

                titulo:
                    'Salidas',

                valor:
                    salidas
            }
        ]);

        const tabla =
            document.getElementById(
                'tablaVentas'
            );

        if (!data.length) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay movimientos
                    </td>
                </tr>
            `;

            return;
        }

        tabla.innerHTML =
            data.map(item => `

                <tr>

                    <td>${item.id}</td>

                    <td>${item.producto}</td>

                    <td>${item.tipo}</td>

                    <td>${item.cantidad}</td>

                    <td>${item.motivo || '-'}</td>

                </tr>

            `).join('');

    } catch (error) {

        console.error(
            'Error movimientos:',
            error
        );
    }
}

/**
 * ===============================
 * IMPRIMIR
 * ===============================
 */
function imprimirReporte() {

    window.print();
}

/**
 * ===============================
 * VOLVER DASHBOARD
 * ===============================
 */
function volverDashboard() {

    window.location.href =
        'dashboard.html';
}

/**
 * ===============================
 * INIT
 * ===============================
 */
cargarReporteVentas();