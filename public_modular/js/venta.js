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
        li.textContent = `${item.nombre} x${item.cantidad}`;

        lista.appendChild(li);
    });

    document.getElementById('total').textContent = total;
}

// ===============================
// CONFIRMAR VENTA
// ===============================

document.getElementById('btn-confirmar').addEventListener('click', async () => {

    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    try {
        const res = await fetch('/api/ventas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: carrito })
        });

        const data = await res.json();

        alert('Venta registrada correctamente');

        // Limpiar carrito
        carrito = [];
        renderCarrito();

    } catch (error) {
        console.error('Error al confirmar venta:', error);
    }
});

// ===============================
// INIT
// ===============================

cargarProductos();