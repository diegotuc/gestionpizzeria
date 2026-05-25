// ===== DASHBOARD RENDER =====

/**
 * =================================
 * FORMATEAR MONEDA
 * =================================
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
 * =================================
 * FORMATEAR FECHA AR
 * =================================
 */
function formatearFechaAR(fecha) {

    if (!fecha) return '-';

    return new Date(fecha)
        .toLocaleString(
            'es-AR',
            {
                hour12: false
            }
        );
}

/**
 * =================================
 * RENDER MÉTRICAS
 * =================================
 */
function renderMetricas(data) {

    document.getElementById(
        'ventasHoy'
    ).innerText =
        data.ventasHoy || 0;

    document.getElementById(
        'montoVentas'
    ).innerText =
        formatearMoneda(
            data.montoVentasHoy
        );

    const estadoCaja =
        document.getElementById(
            'estadoCaja'
        );

    estadoCaja.innerText =
        data.cajaEstado || 'CERRADA';

    // =========================
    // COLOR ESTADO CAJA
    // =========================
    estadoCaja.className = '';

    if (
        data.cajaEstado === 'ABIERTA'
    ) {

        estadoCaja.classList.add(
            'estado-abierta'
        );

    } else {

        estadoCaja.classList.add(
            'estado-cerrada'
        );
    }

    document.getElementById(
        'productosActivos'
    ).innerText =
        data.productosActivos || 0;

    document.getElementById(
        'productosCriticos'
    ).innerText =
        data.productosCriticos || 0;

    document.getElementById(
        'productosSinStock'
    ).innerText =
        data.productosSinStock || 0;

    document.getElementById(
        'valorInventario'
    ).innerText =
        formatearMoneda(
            data.valorInventario
        );
}

/**
 * =================================
 * RENDER ALERTAS
 * =================================
 */
function renderAlertas(data) {

    const alertas =
        document.getElementById(
            'alertas'
        );

    if (!alertas) return;

    let html = '';

    // =========================
    // CAJA CERRADA
    // =========================
    if (
        data.cajaEstado === 'CERRADA'
    ) {

        html += `
            <div class="alerta-item">
                ⚠ La caja está cerrada
            </div>
        `;
    }

    // =========================
    // SIN STOCK
    // =========================
    if (
        Number(data.productosSinStock) > 0
    ) {

        html += `
            <div class="alerta-item">
                🚫 Hay productos sin stock
            </div>
        `;
    }

    // =========================
    // STOCK CRÍTICO
    // =========================
    if (
        Number(data.productosCriticos) > 0
    ) {

        html += `
            <div class="alerta-item">
                ⚠ Hay productos con stock crítico
            </div>
        `;
    }

    // =========================
    // SISTEMA OK
    // =========================
    if (!html) {

        html = `
            <div class="ok">
                ✅ Sistema funcionando correctamente
            </div>
        `;
    }

    alertas.innerHTML = html;
}

/**
 * =================================
 * RENDER ÚLTIMAS VENTAS
 * =================================
 */
function renderUltimasVentas(ventas) {

    const contenedor =
        document.getElementById(
            'ultimasVentas'
        );

    if (!contenedor) return;

    if (
        !ventas ||
        ventas.length === 0
    ) {

        contenedor.innerHTML = `
            <p>
                Sin ventas registradas
            </p>
        `;

        return;
    }

    let html = '';

    ventas.forEach((venta) => {

        html += `
            <div class="item-dashboard">

                <div>
                    <strong>
                        #${venta.id}
                    </strong>
                    ${venta.cliente || 'Consumidor Final'}
                </div>

                <div>
                    ${formatearMoneda(venta.total)}
                </div>

                <small>
                    ${formatearFechaAR(venta.fecha)}
                </small>

            </div>
        `;
    });

    contenedor.innerHTML = html;
}

/**
 * =================================
 * RENDER MOVIMIENTOS STOCK
 * =================================
 */
function renderMovimientosStock(movimientos) {

    const contenedor =
        document.getElementById(
            'movimientosStock'
        );

    if (!contenedor) return;

    if (
        !movimientos ||
        movimientos.length === 0
    ) {

        contenedor.innerHTML = `
            <p>
                Sin movimientos
            </p>
        `;

        return;
    }

    let html = '';

    movimientos.forEach((mov) => {

        html += `
            <div class="item-dashboard">

                <div>
                    <strong>
                        ${mov.producto_nombre}
                    </strong>
                </div>

                <div>
                    ${mov.tipo}
                    (${mov.cantidad})
                </div>

                <small>
                    ${formatearFechaAR(mov.fecha)}
                </small>

            </div>
        `;
    });

    contenedor.innerHTML = html;
}

/**
 * =================================
 * RENDER AUDITORÍA
 * =================================
 */
function renderAuditoria(auditorias) {

    const contenedor =
        document.getElementById(
            'auditoriaAdmin'
        );

    if (!contenedor) return;

    if (
        !auditorias ||
        auditorias.length === 0
    ) {

        contenedor.innerHTML = `
            <p>
                Sin auditoría
            </p>
        `;

        return;
    }

    let html = '';

    auditorias.forEach((item) => {

        html += `
            <div class="item-dashboard">

                <div>
                    <strong>
                        ${item.producto_nombre}
                    </strong>
                </div>

                <div>
                    ${item.accion}
                </div>

                <small>
                    ${formatearFechaAR(item.fecha)}
                </small>

            </div>
        `;
    });

    contenedor.innerHTML = html;
}
/**
 * =================================
 * RENDER KPIs AVANZADOS
 * =================================
 */
function renderKPIsAvanzados(data) {

    const ventasAyer =
        document.getElementById(
            'ventasAyer'
        );

    const montoAyer =
        document.getElementById(
            'montoAyer'
        );

    const tendencia =
        document.getElementById(
            'tendenciaVentas'
        );

    const diferencia =
        document.getElementById(
            'diferenciaVentas'
        );

    if (
        ventasAyer
    ) {

        ventasAyer.innerText =
            data.ventasAyer || 0;
    }

    if (
        montoAyer
    ) {

        montoAyer.innerText =
            formatearMoneda(
                data.montoAyer
            );
    }

    if (
        tendencia
    ) {

        tendencia.innerText =
            data.tendencia || '-';

        tendencia.className = '';

        if (
            data.tendencia === 'POSITIVA'
        ) {

            tendencia.classList.add(
                'tendencia-positiva'
            );

        } else {

            tendencia.classList.add(
                'tendencia-negativa'
            );
        }
    }

    if (
        diferencia
    ) {

        diferencia.innerText =
            `${data.diferenciaPorcentual || 0}%`;
    }
}

/**
 * =================================
 * RENDER PRODUCTOS TOP
 * =================================
 */
function renderProductosTop(productos) {

    const contenedor =
        document.getElementById(
            'productosTop'
        );

    if (!contenedor) return;

    if (
        !productos ||
        productos.length === 0
    ) {

        contenedor.innerHTML = `
            <p>
                Sin estadísticas
            </p>
        `;

        return;
    }

    let html = '';

    productos.forEach((producto, index) => {

        html += `
            <div class="item-dashboard">

                <div>
                    <strong>
                        #${index + 1}
                    </strong>

                    ${producto.nombre}
                </div>

                <div>
                    ${producto.totalVendido} ventas
                </div>

            </div>
        `;
    });

    contenedor.innerHTML = html;
}

/**
 * =================================
 * RENDER RESUMEN SEMANAL
 * =================================
 */
function renderResumenSemanal(ventas) {

    const contenedor =
        document.getElementById(
            'resumenSemanal'
        );

    if (!contenedor) return;

    if (
        !ventas ||
        ventas.length === 0
    ) {

        contenedor.innerHTML = `
            <p>
                Sin datos semanales
            </p>
        `;

        return;
    }

    let totalSemana = 0;

    let cantidadVentas = 0;

    ventas.forEach((dia) => {

        totalSemana +=
            Number(dia.totalVentas || 0);

        cantidadVentas +=
            Number(dia.cantidadVentas || 0);
    });

    contenedor.innerHTML = `
        <div class="item-dashboard">

            <div>
                <strong>
                    Total semanal
                </strong>
            </div>

            <div>
                ${formatearMoneda(totalSemana)}
            </div>

        </div>

        <div class="item-dashboard">

            <div>
                <strong>
                    Ventas semana
                </strong>
            </div>

            <div>
                ${cantidadVentas}
            </div>

        </div>
    `;
}