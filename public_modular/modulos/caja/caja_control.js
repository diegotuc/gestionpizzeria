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
// 🟡 ESTADO CAJA
// ===============================
function cargarEstadoCaja() {

    fetch(`${API}/estado`)
        .then(r => r.json())
        .then(data => {

            const estadoEl =
                document.getElementById('estadoCaja');

            // Evitar errores si no existe
            if (!estadoEl) return;

            estadoEl.innerText =
                data.estado || 'DESCONOCIDO';

            estadoEl.classList.remove(
                'positivo',
                'negativo'
            );

            estadoEl.classList.add(
                data.estado === 'ABIERTA'
                    ? 'positivo'
                    : 'negativo'
            );
        })
        .catch(err => {
            console.error(
                'Error estado caja:',
                err
            );
        });
}


// ===============================
// 🔄 AUTO REFRESH (POS REAL)
// ===============================
setInterval(() => {

    cargarEstadoCaja();

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

            document.getElementById(
                'montoApertura'
            ).value = '';
        }

        // Refresh SIEMPRE
        cargarEstadoCaja();

        verResumen();

        cargarHistorialCaja();

        cargarReporteDiario();
    })
    .catch(err => {
        console.error(err);

        showToast(
            "Error apertura caja",
            "error"
        );
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

            document.getElementById(
                'montoCierre'
            ).value = '';
        }

        // Refresh SIEMPRE
        cargarEstadoCaja();

        verResumen();

        cargarHistorialCaja();

        cargarReporteDiario();
    })
    .catch(err => {
        console.error(err);

        showToast(
            "Error cierre caja",
            "error"
        );
    });
}


// ===============================
// 💸 EGRESO
// ===============================
function registrarEgreso() {

    const monto =
        Number(document.getElementById('montoEgreso').value);

    const descripcion =
        document.getElementById('descripcionEgreso')
        .value
        .trim();

    // ===========================
    // VALIDACIONES
    // ===========================
    if (isNaN(monto) || monto <= 0) {

        showToast("Monto inválido", "error");
        return;
    }

    if (!descripcion) {

        showToast(
            "Descripción requerida",
            "error"
        );

        return;
    }

    // ===========================
    // REQUEST
    // ===========================
    fetch(`${API}/egreso`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            monto,
            descripcion
        })

    })
    .then(async r => {

        const data = await r.json();

        return {
            okHttp: r.ok,
            data
        };
    })
    .then(({ okHttp, data }) => {

        showToast(
            data.ok
                ? "Egreso registrado"
                : data.error,

            data.ok
                ? "success"
                : "error"
        );

        // =======================
        // LIMPIAR FORMULARIO
        // =======================
        if (data.ok) {

            document.getElementById(
                'montoEgreso'
            ).value = '';

            document.getElementById(
                'descripcionEgreso'
            ).value = '';
        }

        // =======================
        // REFRESH SIEMPRE
        // =======================
        cargarEstadoCaja();

        verResumen();

        cargarHistorialCaja();

        cargarReporteDiario();

    })
    .catch(err => {

        console.error(err);

        showToast(
            "Error registrando egreso",
            "error"
        );
    });
}


// ===============================
// 📊 RESUMEN
// ===============================
function verResumen() {

    fetch(`${API}/resumen`)
        .then(r => r.json())
        .then(data => {

            const aperturaEl =
                document.getElementById('resApertura');

            const ingresosEl =
                document.getElementById('resIngresos');

            const egresosEl =
                document.getElementById('resEgresos');

            const esperadoEl =
                document.getElementById('resEsperado');

            const diferenciaEl =
                document.getElementById('resDiferencia');

            // Evitar errores frontend
            if (
                !aperturaEl ||
                !ingresosEl ||
                !egresosEl ||
                !esperadoEl ||
                !diferenciaEl
            ) {
                return;
            }

            aperturaEl.innerText =
                data.apertura || 0;

            ingresosEl.innerText =
                data.ingreso || 0;

            egresosEl.innerText =
                data.egreso || 0;

            esperadoEl.innerText =
                data.esperado || 0;

            const diferencia =
                data.diferencia || 0;

            diferenciaEl.textContent =
                `$${diferencia}`;

            diferenciaEl.classList.remove(
                "positivo",
                "negativo"
            );

            diferenciaEl.classList.add(
                diferencia >= 0
                    ? "positivo"
                    : "negativo"
            );
        })
        .catch(err => {
            console.error(
                "Error resumen:",
                err
            );
        });
}


// ===============================
// 📚 HISTORIAL
// ===============================
async function cargarHistorialCaja() {

    try {

        const res =
            await fetch(`${API}/historial`);

        const data =
            await res.json();

        const contenedor =
            document.getElementById(
                'historial-caja'
            );

        if (!contenedor) return;

        if (!data.length) {

            contenedor.innerHTML =
                '<p>No hay registros</p>';

            return;
        }

        let html = `
            <table class="tabla-historial">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Apertura</th>
                        <th>Ingresos</th>
                        <th>Egresos</th>
                        <th>Cierre</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(dia => {

            html += `
                <tr>
                    <td>${dia.fecha}</td>

                    <td>
                        $${dia.apertura || 0}
                    </td>

                    <td>
                        $${dia.ingresos || 0}
                    </td>

                    <td>
                        $${dia.egresos || 0}
                    </td>

                    <td>
                        $${dia.cierre || 0}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        contenedor.innerHTML = html;

    } catch (e) {

        console.error(
            "Error historial:",
            e
        );
    }
}


// ===============================
// 📋 REPORTE DIARIO
// ===============================
async function cargarReporteDiario() {

    try {

        const res =
            await fetch(`${API}/reporte-diario`);

        const data =
            await res.json();

        const aperturaEl =
            document.getElementById('repApertura');

        const ingresosEl =
            document.getElementById('repIngresos');

        const egresosEl =
            document.getElementById('repEgresos');

        const esperadoEl =
            document.getElementById('repEsperado');

        const realEl =
            document.getElementById('repReal');

        const diferenciaEl =
            document.getElementById('repDiferencia');

        // Evitar nulls
        if (
            !aperturaEl ||
            !ingresosEl ||
            !egresosEl ||
            !esperadoEl ||
            !realEl ||
            !diferenciaEl
        ) {
            return;
        }

        aperturaEl.innerText =
            `$${data.apertura || 0}`;

        ingresosEl.innerText =
            `$${data.ingresos || 0}`;

        egresosEl.innerText =
            `$${data.egresos || 0}`;

        esperadoEl.innerText =
            `$${data.esperado || 0}`;

        realEl.innerText =
            `$${data.real || 0}`;

        diferenciaEl.innerText =
            `$${data.diferencia || 0}`;

    } catch (e) {

        console.error(
            "Error reporte diario",
            e
        );
    }
}


// ===============================
// 🚀 INICIALIZACIÓN
// ===============================
document.addEventListener(
    'DOMContentLoaded',
    () => {

        cargarEstadoCaja();

        verResumen();

        cargarHistorialCaja();

        cargarReporteDiario();
    }
);