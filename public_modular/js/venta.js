// ===============================
// VARIABLES GLOBALES
// ===============================

// Carrito en memoria
let carrito = [];

// ===============================
// CARGAR PRODUCTOS DESDE BACKEND
// ===============================
/*🔴 DESACTIVADO TEMPORALMENTE (no existe /api/productos)
async function cargarProductos() {
    try {
        const res = await fetch('/api/productos'); // endpoint existente
        const productos = await res.json();

        const contenedor = document.getElementById('lista-productos');
        contenedor.innerHTML = '';

        productos.forEach(prod => {

            const div = document.createElement('div');
            div.classList.add('producto');

            div.innerHTML = `
                <span>${prod.nombre} - $${prod.precio}</span>
                <button onclick="agregarAlCarrito(${prod.id}, '${prod.nombre}', ${prod.precio})">
                    Agregar
                </button>
            `;

            contenedor.appendChild(div);
        });

    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}*/

// ===============================
// MOCK DE PRODUCTOS (TEMPORAL)
// ===============================
function cargarProductosMock() {

    const productos = [
        { id: 1, nombre: "Pizza Muzza", precio: 1000 },
        { id: 2, nombre: "Pizza Especial", precio: 1500 },
        { id: 3, nombre: "Bebida", precio: 500 }
    ];

    const contenedor = document.getElementById('lista-productos');
    contenedor.innerHTML = '';

    productos.forEach(prod => {

        const div = document.createElement('div');
        div.classList.add('producto');

        div.innerHTML = `
            <span>${prod.nombre} - $${prod.precio}</span>
            <button onclick="agregarAlCarrito(${prod.id}, '${prod.nombre}', ${prod.precio})">
                Agregar
            </button>
        `;

        contenedor.appendChild(div);
    });
}

// ===============================
// AGREGAR AL CARRITO
// ===============================

function agregarAlCarrito(id, nombre, precio) {

    const item = carrito.find(p => p.id === id);

    if (item) {
        item.cantidad++;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1 });
    }

    renderCarrito();
}

// ===============================
// RENDER CARRITO
// ===============================

function renderCarrito() {

    const lista = document.getElementById('carrito-lista');
    lista.innerHTML = '';

    let total = 0;

    carrito.forEach(item => {

        total += item.precio * item.cantidad;

        const li = document.createElement('li');
        // Creamos contenido con botón eliminar
li.innerHTML = `
    ${item.nombre} x${item.cantidad}
    <button onclick="eliminarItem(${item.id})">❌</button>
`;

        lista.appendChild(li);
    });

    document.getElementById('total').textContent = total;
}

// ===============================
// ELIMINAR ITEM DEL CARRITO
// ===============================
function eliminarItem(id) {

    // Filtramos el carrito sacando el producto
    carrito = carrito.filter(item => item.id !== id);

    // Volvemos a renderizar
    renderCarrito();
}

// ===============================
// CONFIRMAR VENTA
// ===============================

// ===============================
// CONFIRMAR VENTA (VERSIÓN CORRECTA PARA BACKEND)
// ===============================

document.getElementById('btn-confirmar').addEventListener('click', async () => {

    // Validación básica
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    // ===============================
    // TRANSFORMAR DATOS AL FORMATO DEL BACKEND
    // ===============================
    const data = {
        total: 0,
        detalle: []
    };

    carrito.forEach(item => {

        // Sumamos al total
        data.total += item.precio * item.cantidad;

        // Armamos detalle como espera SQLite/backend
        data.detalle.push({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio: item.precio
        });
    });

    try {
        // ===============================
        // ENVÍO AL BACKEND
        // ===============================
        const res = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) // 👈 ahora correcto
        });

        if (!res.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const result = await res.json();

        // ===============================
        // FEEDBACK AL USUARIO
        // ===============================
        alert('✅ Venta registrada correctamente');

        // ===============================
        // RESET DEL CARRITO
        // ===============================
        carrito = [];
        renderCarrito();

    } catch (error) {
        console.error('Error al confirmar venta:', error);
        alert('❌ Error al registrar la venta');
    }
});

// ===============================
// INIT
// ===============================

//cargarProductos();
// Usamos mock porque backend de productos no está listo
cargarProductosMock();