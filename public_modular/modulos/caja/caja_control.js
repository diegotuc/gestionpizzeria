const API = "/api/caja";

// ===============================
// 🟢 APERTURA
// ===============================
function abrirCaja() {
    const monto = Number(document.getElementById('montoApertura').value);

    fetch(`${API}/apertura`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ monto })
    })
    .then(r => r.json())
    .then(data => {
        alert(data.ok ? "Caja abierta" : data.error);

        if (data.ok) {
            document.getElementById('montoApertura').value = '';
            verResumen();
        }
    });
}

// ===============================
// 🔴 CIERRE
// ===============================
function cerrarCaja() {
    const monto = Number(document.getElementById('montoCierre').value);

    fetch(`${API}/cierre`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ monto })
    })
    .then(r => r.json())
    .then(data => {
        alert(data.ok ? "Caja cerrada" : data.error);

        if (data.ok) {
            document.getElementById('montoCierre').value = '';
            verResumen();
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
            document.getElementById('resApertura').innerText = data.apertura || 0;
            document.getElementById('resIngresos').innerText = data.ingreso || 0;
            document.getElementById('resEsperado').innerText = data.esperado || 0;
            document.getElementById('resDiferencia').innerText = data.diferencia || 0;
        });
}