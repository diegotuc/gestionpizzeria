// ===============================
// 📊 MÓDULO HISTORIAL DE CAJA
// ===============================

// ===============================
// 📊 CARGAR CAJA
// ===============================
async function cargarCaja(id = null) {

    const cajaId = id || document.getElementById("selectorCaja").value;

    try {
        const res = await fetch(`/caja/resumen/${cajaId}`);
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        // INFO
        document.getElementById("infoCajaDetalle").innerHTML = `
            <p><strong>ID:</strong> ${data.caja.id}</p>
            <p><strong>Estado:</strong> ${data.caja.estado}</p>
            <p><strong>Apertura:</strong> ${data.caja.fecha_apertura}</p>
            <p><strong>Cierre:</strong> ${data.caja.fecha_cierre || '---'}</p>
        `;

        // RESUMEN
        document.getElementById("resumenCaja").innerHTML = `
            <p>💰 Ingresos: $${data.ingresos}</p>
            <p>💸 Egresos: $${data.egresos}</p>
            <p>🧾 Total: $${data.total}</p>
        `;

        // MOVIMIENTOS
        const lista = document.getElementById("listaMovimientos");
        lista.innerHTML = "";

        data.movimientos.forEach(m => {
            const li = document.createElement("li");
            li.textContent = `${m.tipo} | $${m.monto} | ${m.metodo_pago || '-'} | ${m.categoria}`;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        alert("Error cargando historial");
    }
}

// ===============================
// 🔹 CARGAR LISTADO DE CAJAS
// ===============================
async function cargarListadoCajas() {

    try {
        const res = await fetch('/caja/listado');
        const cajas = await res.json();

        const select = document.getElementById('selectorCaja');
        select.innerHTML = "";

        cajas.forEach(caja => {

            const option = document.createElement("option");

            option.value = caja.id;

            option.textContent = `
                Caja #${caja.id} | ${caja.fecha_apertura} | ${caja.estado}
            `;

            select.appendChild(option);
        });

        // ===============================
        // 🔹 AUTO CARGAR PRIMERA CAJA
        // ===============================
        if (cajas.length > 0) {
            cargarCaja(cajas[0].id);
        }

    } catch (error) {
        console.error(error);
        alert("Error cargando cajas");
    }
}

// ===============================
// 🔹 EVENTO SELECT
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    cargarListadoCajas();

    document.getElementById("selectorCaja")
        .addEventListener("change", function() {
            cargarCaja(this.value);
        });

});


    // ===============================
// 🔹 VOLVER A VENTAS
// ===============================
function volverAVentas() {
    window.location.href = "/venta.html";
}