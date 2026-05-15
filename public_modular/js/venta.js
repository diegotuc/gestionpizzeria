// ===============================
// VARIABLES GLOBALES
// ===============================

// Carrito en memoria
let carrito = [];


// ===============================
// CARGAR PRODUCTOS DESDE BACKEND
// ===============================
async function cargarProductos() {

    try {

        const res = await fetch('/api/inventario/productos');

        // ===========================
        // VALIDAR RESPUESTA
        // ===========================
        if (!res.ok) {
            throw new Error(
                'Error obteniendo productos'
            );
        }

        const productos = await res.json();

       

        const contenedor =
            document.getElementById(
                'lista-productos'
            );

        contenedor.innerHTML = '';

        // ===========================
        // SIN PRODUCTOS
        // ===========================
        if (productos.length === 0) {

            contenedor.innerHTML = `
                <p>
                    No hay productos cargados
                </p>
            `;

            return;
        }

        // ===========================
        // RENDER PRODUCTOS
        // ===========================
        productos.forEach(prod => {

            const div =
                document.createElement('div');

            div.classList.add('producto');

            div.innerHTML = `
                <span>
                    ${prod.nombre}
                      - $${prod.precio}
                        - Stock: ${prod.stock}
                </span>

                <button
                    onclick="
                        agregarAlCarrito(
                            ${prod.id},
                            '${prod.nombre}',
                            ${prod.precio}
                        )
                    "
                >
                    Agregar
                </button>
            `;

            contenedor.appendChild(div);
        });

    } catch (error) {

        console.error(
            'Error cargando productos:',
            error
        );

        const contenedor =
            document.getElementById(
                'lista-productos'
            );

        contenedor.innerHTML = `
            <p>
                Error cargando productos
            </p>
        `;
    }
}

// ===============================
// AGREGAR AL CARRITO
// ===============================
function agregarAlCarrito(
    id,
    nombre,
    precio
) {

    // ===========================
    // BUSCAR PRODUCTO EN HTML
    // ===========================
    const productos =
        document.querySelectorAll(
            '.producto'
        );

    let stockDisponible = 0;

    // ===========================
    // BUSCAR STOCK
    // ===========================
    productos.forEach(div => {

        const texto =
            div.innerText;

        if (texto.includes(nombre)) {

            // =====================
            // EXTRAER STOCK
            // =====================
            const match =
                texto.match(
                    /Stock:\s*(\d+)/i
                );

            if (match) {

                stockDisponible =
                    parseInt(match[1]);
            }
        }
    });

    // ===========================
    // ITEM EXISTENTE
    // ===========================
    const item =
        carrito.find(
            p => p.id == id
        );

    const cantidadActual =
        item
            ? item.cantidad
            : 0;

    // ===========================
    // VALIDAR STOCK
    // ===========================
    if (
        cantidadActual + 1 >
        stockDisponible
    ) {

        alert(
            `Stock insuficiente para ${nombre}`
        );

        return;
    }

    // ===========================
    // AGREGAR
    // ===========================
    if (item) {

        item.cantidad++;

    } else {

        carrito.push({

            id,

            nombre,

            precio,

            cantidad: 1
        });
    }

    renderCarrito();
}

// ===============================
// RENDER CARRITO
// ===============================
function renderCarrito() {

    const lista =
        document.getElementById(
            'carrito-lista'
        );

    lista.innerHTML = '';

    let total = 0;

    carrito.forEach(item => {

        total +=
            item.precio * item.cantidad;

        const li =
            document.createElement('li');

        li.innerHTML = `
            ${item.nombre}
            x${item.cantidad}

            <button
                onclick="
                    eliminarItem(${item.id})
                "
            >
                ❌
            </button>
        `;

        lista.appendChild(li);
    });

    document.getElementById(
        'total'
    ).textContent = total;
}

// ===============================
// ELIMINAR ITEM DEL CARRITO
// ===============================
function eliminarItem(id) {

    carrito = carrito.filter(
        item => item.id !== id
    );

    renderCarrito();
}

// ===============================
// CONFIRMAR VENTA
// ===============================
document.getElementById(
    'btn-confirmar'
).addEventListener(
    'click',

    async () => {

        // ===========================
        // VALIDAR CARRITO
        // ===========================
        if (carrito.length === 0) {

            alert(
                'El carrito está vacío'
            );

            return;
        }

        // ===========================
        // FORMATO BACKEND
        // ===========================
        const data = {
            total: 0,
            detalle: []
        };

        carrito.forEach(item => {

            data.total +=
                item.precio * item.cantidad;

            data.detalle.push({

                producto_id: item.id,

                cantidad: item.cantidad,

                precio: item.precio
            });
        });

        try {

            // =======================
            // ENVIAR VENTA
            // =======================
            const res = await fetch(
                '/api/ventas',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(data)
                }
            );

            // =======================
            // VALIDAR RESPUESTA
            // =======================
            if (!res.ok) {

                const errorData =
    await res.json();

throw new Error(
    errorData.error ||
    'Error del servidor'
);
            }

            const result =
                await res.json();

            // =======================
            // OK
            // =======================
            alert(
                '✅ Venta registrada correctamente'
            );

            // Recargar productos actualizados
await cargarProductos();

            carrito = [];

            renderCarrito();

        } catch (error) {

            console.error(
                'Error al confirmar venta:',
                error
            );

            alert(
    `❌ ${error.message}`
);
        }
    }
);

// ===============================
// INIT
// ===============================
cargarProductos();

// ===============================
// AUTO REFRESH PRODUCTOS
// ===============================
setInterval(() => {

    cargarProductos();

}, 5000);

// ===============================
// INIT
// ===============================
cargarProductos();