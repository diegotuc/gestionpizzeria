// ============================
// SISTEMA DE NOTIFICACIONES
// ============================
function showToast(message, type = "info") {

    const container =
        document.getElementById("toast-container");

    const toast =
        document.createElement("div");

    toast.classList.add("toast", type);

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

const API = "/api/caja";


// ===============================
// 🔄 AUTO REFRESH (POS REAL)
// ===============================
setInterval(() => {

    verResumen();
    cargarHistorialCaja();
    cargarReporteDiario();

}, 5000);


// ===============================
// 🧩 TABS
// ===============================
function mostrarTab(tab, event) {

    document
        .querySelectorAll('.tab-content')
        .forEach(el => {
            el.classList.remove('active');
        });

    document
        .querySelectorAll('.tab-btn')
        .forEach(el => {
            el.classList.remove('active');
        });

    document
        .getElementById(`tab-${tab}`)
        .classList.add('active');

    event.target.classList.add('active');

    // 👉 IMPORTANTE: cargar reporte al abrir tab
    if (tab === 'reporte') {
        cargarReporteDiario();
    }
}


// ===============================
// 🟢 APERTURA
// ===============================
function abrirCaja() {

    const monto =
        Number(document.getElementById('montoApertura').value);

    if (isNaN(monto) || monto <= 0) {

        showToast("Monto inválido", "error");
        return;
    }

    fetch(`${API}/apertura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto })
    })
    .then(r => r.json())
    .then(data => {

        showToast(
            data.ok ? "Caja abierta" : data.error,
            data.ok ? "success" : "error"
        );

        if (data.ok) {

            document.getElementById('montoApertura').value = '';

            verResumen();
            cargarHistorialCaja();
            cargarReporteDiario();
        }
    });
}


// ===============================
// 🔴 CIERRE
// ===============================
function cerrarCaja() {

    const monto =
        Number(document.getElementById('montoCierre').value);

    if (isNaN(monto) || monto <= 0) {

        showToast("Monto inválido", "error");
        return;
    }

    fetch(`${API}/cierre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto })
    })
    .then(r => r.json())
    .then(data => {

        showToast(
            data.ok ? "Caja cerrada" : data.error,
            data.ok ? "success" : "error"
        );

        if (data.ok) {

            document.getElementById('montoCierre').value = '';

            verResumen();
            cargarHistorialCaja();
            cargarReporteDiario();
        }
    });
}


// ===============================
// 📊 RESUMEN
// ===============================
function verResumen() {

    fetch(`${API}/resumen`)
        .then(r => r.json())
        .then(data => {

            document.getElementById('resApertura').innerText =
                data.apertura || 0;

            document.getElementById('resIngresos').innerText =
                data.ingreso || 0;

            document.getElementById('resEsperado').innerText =
                data.esperado || 0;

            const diferenciaEl =
                document.getElementById('resDiferencia');

            const diferencia =
                data.diferencia || 0;

            diferenciaEl.textContent = `$${diferencia}`;

            diferenciaEl.classList.remove("positivo", "negativo");

            diferenciaEl.classList.add(
                diferencia >= 0 ? "positivo" : "negativo"
            );
        });
}


// ===============================
// 📚 HISTORIAL
// ===============================
async function cargarHistorialCaja() {

    try {

        const res = await fetch(`${API}/historial`);
        const data = await res.json();

        const contenedor =
            document.getElementById('historial-caja');

        if (!data.length) {
            contenedor.innerHTML = '<p>No hay registros</p>';
            return;
        }

        let html = `
            <table class="tabla-historial">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Apertura</th>
                        <th>Ingresos</th>
                        <th>Cierre</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(dia => {
            html += `
                <tr>
                    <td>${dia.fecha}</td>
                    <td>$${dia.apertura || 0}</td>
                    <td>$${dia.ingresos || 0}</td>
                    <td>$${dia.cierre || 0}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';

        contenedor.innerHTML = html;

    } catch (e) {
        console.error(e);
    }
}


// ===============================
// 📋 REPORTE DIARIO (NUEVO)
// ===============================
async function cargarReporteDiario() {

    try {

        const res = await fetch(`${API}/reporte-diario`);
        const data = await res.json();

        document.getElementById('repApertura').innerText =
            `$${data.apertura || 0}`;

        document.getElementById('repIngresos').innerText =
            `$${data.ingresos || 0}`;

        document.getElementById('repEsperado').innerText =
            `$${data.esperado || 0}`;

        document.getElementById('repReal').innerText =
            `$${data.real || 0}`;

        document.getElementById('repDiferencia').innerText =
            `$${data.diferencia || 0}`;

    } catch (e) {
        console.error("Error reporte diario", e);
    }
}


// ===============================
// 🚀 INICIALIZACIÓN
// ===============================
document.addEventListener('DOMContentLoaded', () => {

    verResumen();
    cargarHistorialCaja();
    cargarReporteDiario();
});