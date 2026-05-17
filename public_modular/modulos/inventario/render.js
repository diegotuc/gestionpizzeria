// ==============================
// HELPERS
// ==============================
function safe(value) {

    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function escapeQuotes(texto) {

    return safe(texto)
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');
}

// ==============================
// RENDER PRODUCTOS
// ==============================
export function renderProductos(productos = []) {

    const tbody =
        document.getElementById(
            'tabla-productos'
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    productos.forEach(prod => {

        const tr =
            document.createElement('tr');

        // ==========================
        // STOCK VISUAL
        // ==========================
        let estadoStock = '';
        let claseStock = '';

        const stock =
            Number(prod.stock);

        if (stock <= 5) {

            estadoStock =
                '🔴 CRÍTICO';

            claseStock =
                'stock-critico';

        } else if (stock < 10) {

            estadoStock =
                '🟠 BAJO';

            claseStock =
                'stock-bajo';

        } else {

            estadoStock =
                '🟢 ALTO';

            claseStock =
                'stock-alto';
        }

        tr.classList.add(claseStock);

        // ==========================
        // ESTADO
        // ==========================
        const activoTexto =
            Number(prod.activo) === 1
                ? 'Sí'
                : 'No';

        // ==========================
        // NOMBRE SEGURO
        // ==========================
        const nombreSeguro =
            escapeQuotes(prod.nombre);

        // ==========================
        // HTML
        // ==========================
        tr.innerHTML = `

            <td>
                ${safe(prod.id)}
            </td>

            <td>
                ${safe(prod.nombre)}
            </td>

            <td>
                $${safe(prod.precio)}
            </td>

            <td>

                ${stock}

                <div class="badge-stock">

                    ${estadoStock}

                </div>

            </td>

            <td>
                ${activoTexto}
            </td>

            <td>

                <button
                    onclick="
                        window.inventarioUI.editar(
                            ${prod.id},
                            '${nombreSeguro}',
                            ${prod.precio}
                        )
                    "
                >
                    Editar
                </button>

                ${
                    Number(prod.activo) === 1

                    ?

                    `
                        <button
                            onclick="
                                window.inventarioUI.desactivar(
                                    ${prod.id}
                                )
                            "
                        >
                            Desactivar
                        </button>
                    `

                    :

                    `
                        <button
                            onclick="
                                window.inventarioUI.reactivar(
                                    ${prod.id}
                                )
                            "
                        >
                            Reactivar
                        </button>
                    `
                }

            </td>

            <td>

                <button
                    onclick="
                        window.inventarioUI.ingresarStock(
                            ${prod.id},
                            '${nombreSeguro}'
                        )
                    "
                >
                    Ingresar
                </button>

            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ==============================
// RENDER AUDITORÍA
// ==============================
export function renderAuditoria(datos = []) {

    const tbody =
        document.getElementById(
            'tabla-auditoria'
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    datos.forEach(item => {

        const tr =
            document.createElement('tr');

        tr.innerHTML = `

            <td>
                ${safe(item.id)}
            </td>

            <td>
                ${safe(item.producto_nombre || '-')}
            </td>

            <td>
                ${safe(item.accion)}
            </td>

            <td>
                <pre>
${safe(item.valor_anterior || '-')}
                </pre>
            </td>

            <td>
                <pre>
${safe(item.valor_nuevo || '-')}
                </pre>
            </td>

            <td>
                ${safe(item.fecha)}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ==============================
// RENDER MÉTRICAS
// ==============================
export function renderMetricas(metricas = {}) {

    const container =
        document.getElementById(
            'metricas-inventario'
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="card-metrica">

            <h3>
                ✅ Activos
            </h3>

            <p>
                ${safe(metricas.productosActivos || 0)}
            </p>

        </div>

        <div class="card-metrica">

            <h3>
                ⛔ Inactivos
            </h3>

            <p>
                ${safe(metricas.productosInactivos || 0)}
            </p>

        </div>

        <div class="card-metrica alerta">

            <h3>
                🔴 Críticos
            </h3>

            <p>
                ${safe(metricas.productosCriticos || 0)}
            </p>

        </div>

        <div class="card-metrica alerta">

            <h3>
                📦 Sin Stock
            </h3>

            <p>
                ${safe(metricas.productosSinStock || 0)}
            </p>

        </div>

        <div class="card-metrica total">

            <h3>
                💰 Inventario
            </h3>

            <p>
                $${safe(metricas.valorTotalInventario || 0)}
            </p>

        </div>
    `;
}