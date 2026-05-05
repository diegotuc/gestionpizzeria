// ===== INICIO MÓDULO: DASHBOARD =====

/**
 * Navegación a pedidos
 */
 function irPedidos(){
    window.location.href = "pedidos.html";
}

/**
 * Obtener ventas desde backend
 */
async function cargarVentas(){
    try {
        const res = await fetch('/api/ventas');
        const data = await res.json();

        document.getElementById('total').innerText = data.length;

    } catch (error) {
        console.error("Error cargando ventas:", error);
    }
}

/**
 * Eventos
 */
document.getElementById('btnPedidos').addEventListener('click', irPedidos);

/**
 * Inicializar
 */
cargarVentas();

// ===== FIN MÓDULO: DASHBOARD =====