// ===============================
// 📦 MÓDULO CAJA — FRONTEND
// ===============================

async function obtenerEstadoCaja() {
    try {
        const res = await fetch('/caja/actual');
        const data = await res.json();
        return data.caja || null;
    } catch (error) {
        console.error(error);
        return null;
    }
}


// ===============================
// 🎛️ ACTUALIZAR UI
// ===============================
async function actualizarUI() {

    const caja = await obtenerEstadoCaja();

    const btnAbrir = document.getElementById('btnAbrirCaja');
    const btnCerrar = document.getElementById('btnCerrarCaja');
    const info = document.getElementById('infoCaja');

    if (caja) {

        // 🟢 CAJA ABIERTA
        if (info) {
            info.innerHTML = `
                <h3>🟢 Caja ABIERTA</h3>
                <p>Apertura: ${caja.fecha_apertura}</p>
            `;
            info.className = "abierta";
        }

        if (btnAbrir) btnAbrir.style.display = "none";
        if (btnCerrar) btnCerrar.style.display = "inline-block";

    } else {

        // 🔴 CAJA CERRADA
        if (info) {
            info.innerHTML = `
                <h3>🔴 Caja CERRADA</h3>
            `;
            info.className = "cerrada";
        }

        if (btnAbrir) btnAbrir.style.display = "inline-block";
        if (btnCerrar) btnCerrar.style.display = "none";
    }
}


// ===============================
// 🔹 IR A HISTORIAL DE CAJA
// ===============================
function irAHistorialCaja() {
    window.location.href = "/dashboard_caja.html";
}


// ===============================
// 🚀 EVENTOS
// ===============================
document.addEventListener('DOMContentLoaded', () => {

    const btnAbrirCaja = document.getElementById('btnAbrirCaja');
    const btnCerrarCaja = document.getElementById('btnCerrarCaja');

    // 🟢 ABRIR
    if (btnAbrirCaja) {
        btnAbrirCaja.addEventListener('click', async () => {

            const res = await fetch('/caja/abrir', { method: 'POST' });
            const data = await res.json();

            alert(data.mensaje || data.error);

            actualizarUI();
        });
    }

    // 🔴 CERRAR
    if (btnCerrarCaja) {
        btnCerrarCaja.addEventListener('click', async () => {

            if (!confirm("¿Cerrar caja?")) return;

            const res = await fetch('/caja/cerrar', { method: 'POST' });
            const data = await res.json();

            alert(data.mensaje || data.error);

            actualizarUI();
        });


    }

    actualizarUI();
});