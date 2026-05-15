// ==============================
// MEMORIA PRODUCTOS

//const { OK } = require("sqlite3");

// ==============================
let productosGlobal = [];

// ==============================
// FILTROS Y ORDENAMIENTO
// ==============================
function aplicarFiltros() {

    // ==========================
    // BUSCADOR
    // ==========================
    const texto =
        document.getElementById(
            'busqueda-producto'
        )
        .value
        .toLowerCase()
        .trim();

    // ==========================
    // FILTRO ESTADO
    // ==========================
    const filtroEstado =
        document.getElementById(
            'filtro-estado'
        ).value;

    // ==========================
    // ORDENAMIENTO
    // ==========================
    const orden =
        document.getElementById(
            'orden-productos'
        ).value;

    // ==========================
    // COPIA SEGURA
    // ==========================
    let resultado =
        [...productosGlobal];

    // ==========================
    // BUSCADOR
    // ==========================
    resultado = resultado.filter(prod =>

        prod.nombre
            .toLowerCase()
            .includes(texto)

        ||

        String(prod.id)
            .includes(texto)
    );

    // ==========================
    // FILTRO ESTADO
    // ==========================
    if (filtroEstado === 'activos') {

        resultado =
            resultado.filter(
                prod => Number(prod.activo) === 1
            );
    }

    if (filtroEstado === 'inactivos') {

        resultado =
            resultado.filter(
                prod => Number(prod.activo) === 0
            );
    }

    // ==========================
    // ORDENAMIENTO
    // ==========================
    switch (orden) {

        case 'id-desc':

            resultado.sort(
                (a, b) =>
                    Number(b.id) -
                    Number(a.id)
            );

            break;

        case 'id-asc':

            resultado.sort(
                (a, b) =>
                    Number(a.id) -
                    Number(b.id)
            );

            break;

        case 'az':

            resultado.sort(
                (a, b) =>
                    String(a.nombre)
                        .localeCompare(
                            String(b.nombre)
                        )
            );

            break;

        case 'za':

            resultado.sort(
                (a, b) =>
                    String(b.nombre)
                        .localeCompare(
                            String(a.nombre)
                        )
            );

            break;

        case 'stock-desc':

            resultado.sort(
                (a, b) =>
                    Number(b.stock) -
                    Number(a.stock)
            );

            break;

        case 'stock-asc':

            resultado.sort(
                (a, b) =>
                    Number(a.stock) -
                    Number(b.stock)
            );

            break;
    }

    // ==========================
    // RENDER FINAL
    // ==========================
    renderProductos(resultado);
}

// ==============================
// RENDER PRODUCTOS
// ==============================
function renderProductos(productos) {

    const tbody =
        document.getElementById(
            'tabla-productos'
        );

    tbody.innerHTML = '';

    productos.forEach(prod => {

        const tr =
            document.createElement('tr');

        // ==========================
        // ALERTAS VISUALES STOCK
        // ==========================
        let estadoStock = '';
        let claseStock = '';

        if (Number(prod.stock) <= 5) {

            estadoStock = '🔴 CRÍTICO (REPONER)';
            claseStock = 'stock-critico';

        } else if (Number(prod.stock) < 10) {

            estadoStock = '🟠 BAJO (REPONER EN BREVE)';
            claseStock = 'stock-bajo';
        }else if (Number(prod.stock) >= 10) {

            estadoStock = '🟢 ALTO';
            claseStock = 'stock-bajo';
        }

    

        // ==========================
        // APLICAR CLASE VISUAL
        // ==========================
        tr.classList.add(claseStock);

        tr.innerHTML = `

            <td>${prod.id}</td>

            <td>${prod.nombre}</td>

            <td>$${prod.precio}</td>

            <td>

                ${prod.stock}

                ${estadoStock
                    ? `<div class="badge-stock">${estadoStock}</div>`
                    : ''
                }

            </td>

            <td>
                ${Number(prod.activo) === 1 ? 'Sí' : 'No'}
            </td>

            <td>

                <button
                    onclick="
                        editarProducto(
                            ${prod.id},
                            '${prod.nombre}',
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
                                desactivarProducto(
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
                                reactivarProducto(
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
                        ingresarStock(
                            ${prod.id},
                            '${prod.nombre}'
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
// CARGAR PRODUCTOS
// ==============================
async function cargarProductos() {

    try {

        const res = await fetch(
            '/api/inventario/productos-admin'
        );

        const productos =
            await res.json();

        // ======================
        // GUARDAR MEMORIA
        // ======================
        productosGlobal = productos;

        // ======================
        // APLICAR FILTROS
        // ======================
        aplicarFiltros();

    } catch (error) {

        console.error(
            'Error cargando productos:',
            error
        );
    }
}

// ==============================
// GUARDAR PRODUCTO
// ==============================
document.getElementById(
    'btn-guardar'
).addEventListener(

    'click',

    async () => {

        const nombre =
            document.getElementById(
                'nombre'
            ).value;

        const precio =
            parseFloat(
                document.getElementById(
                    'precio'
                ).value
            );

        const stock =
            parseFloat(
                document.getElementById(
                    'stock'
                ).value
            );

        try {

            const res = await fetch(

                '/api/inventario/productos',

                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        nombre,
                        precio,
                        stock
                    })
                }
            );

            const data =
                await res.json();

            if (!data.ok) {

                alert(data.error);

                return;
            }

            alert(
                '✅ Producto creado'
            );

            document.getElementById(
                'nombre'
            ).value = '';

            document.getElementById(
                'precio'
            ).value = '';

            document.getElementById(
                'stock'
            ).value = '';

            cargarProductos();

        } catch (error) {

            console.error(
                'Error creando producto:',
                error
            );

            alert(
                'Error creando producto'
            );
        }
    }
);

// ==============================
// EDITAR PRODUCTO
// ==============================
async function editarProducto(

    id,

    nombreActual,

    precioActual

) {

    // ==========================
    // NUEVO NOMBRE
    // ==========================
    const nuevoNombre = prompt(

        'Nuevo nombre:',

        nombreActual
    );

    if (nuevoNombre === null) {
        return;
    }

    if (nuevoNombre.trim() === '') {

        alert(
            'Nombre inválido'
        );

        return;
    }

    // ==========================
    // NUEVO PRECIO
    // ==========================
    const nuevoPrecio = prompt(

        'Nuevo precio:',

        precioActual
    );

    if (nuevoPrecio === null) {
        return;
    }

    const precioNumero =
        parseFloat(nuevoPrecio);

    if (isNaN(precioNumero)) {

        alert(
            'Precio inválido'
        );

        return;
    }

    try {

        const res = await fetch(

            `/api/inventario/productos/${id}`,

            {

                method: 'PUT',

                headers: {

                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    nombre:
                        nuevoNombre,

                    precio:
                        precioNumero
                })
            }
        );

        const data =
            await res.json();

        if (!data.ok) {

            alert(data.error);

            return;
        }

        alert(
            '✅ Producto actualizado'
        );

        cargarProductos();

    } catch (error) {

        console.error(
            'Error editando producto:',
            error
        );

        alert(
            'Error editando producto'
        );
    }
}

// ==============================
// DESACTIVAR PRODUCTO
// ==============================
async function desactivarProducto(id) {

    const confirmar = confirm(
        '¿Desactivar producto?'
    );

    if (!confirmar) {
        return;
    }

    try {

        const res = await fetch(

            `/api/inventario/productos/${id}/desactivar`,

            {
                method: 'PUT'
            }
        );

        const data = await res.json();

        if (!data.ok) {

            alert(data.error);

            return;
        }

        alert(
            '✅ Producto desactivado'
        );

        cargarProductos();

    } catch (error) {

        console.error(
            'Error desactivando producto:',
            error
        );

        alert(
            'Error desactivando producto'
        );
    }
}

// ==============================
// REACTIVAR PRODUCTO
// ==============================
async function reactivarProducto(id) {

    try {

        const res = await fetch(

            `/api/inventario/productos/${id}/reactivar`,

            {
                method: 'PUT'
            }
        );

        const data = await res.json();

        if (!data.ok) {

            alert(data.error);

            return;
        }

        alert(
            '✅ Producto reactivado'
        );

        cargarProductos();

    } catch (error) {

        console.error(
            'Error reactivando producto:',
            error
        );

        alert(
            'Error reactivando producto'
        );
    }
}

// ==============================
// INGRESAR STOCK
// ==============================
async function ingresarStock(

    productoId,

    nombreProducto

) {

    const cantidad = prompt(

        `Ingresar cantidad para:\n${nombreProducto}`

    );

    if (cantidad === null) {
        return;
    }

    const cantidadNumero =
        parseFloat(cantidad);

    if (

        isNaN(cantidadNumero)

        ||

        cantidadNumero <= 0

    ) {

        alert(
            'Cantidad inválida'
        );

        return;
    }

    try {

        const res = await fetch(

            '/api/inventario/ingresar-stock',

            {

                method: 'POST',

                headers: {

                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    producto_id:
                        productoId,

                    cantidad:
                        cantidadNumero,

                    motivo:
                        'Ingreso desde panel'
                })
            }
        );

        const data =
            await res.json();

        if (!data.ok) {

            alert(data.error);

            return;
        }

        alert(
            '✅ Stock actualizado'
        );

        cargarProductos();

    } catch (error) {

        console.error(
            'Error ingresando stock:',
            error
        );

        alert(
            'Error ingresando stock'
        );
    }
}

// ==============================
// BUSCADOR
// ==============================
document.getElementById(
    'busqueda-producto'
).addEventListener(

    'input',

    aplicarFiltros
);

// ==============================
// FILTRO ESTADO
// ==============================
document.getElementById(
    'filtro-estado'
).addEventListener(

    'change',

    aplicarFiltros
);

// ==============================
// ORDENAMIENTO
// ==============================
document.getElementById(
    'orden-productos'
).addEventListener(

    'change',

    aplicarFiltros
);

// ==============================
// INIT
// ==============================
cargarProductos();