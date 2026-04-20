// =====================================================
// MODULO REPORTE - PIZZERIA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const tabla = document.getElementById("tablaVentas");
  let grafico = null; // 🔥 control de instancia

// =====================================================
// CARGAR ESTADISTICAS
// =====================================================

async function cargarEstadisticas() {

  try {

    const response = await fetch("/estadisticas");
    const data = await response.json();

    const contenedor = document.getElementById("estadisticas");

    contenedor.innerHTML = `
      <h3>📊 Estadísticas</h3>
      <p><strong>Total vendido hoy:</strong> $${data.total_hoy}</p>
      <p><strong>Total vendido este mes:</strong> $${data.total_mes}</p>
      <p><strong>Total pizzas vendidas:</strong> ${data.total_pizzas}</p>
      <p><strong>Pizza más vendida:</strong> ${data.pizza_top}</p>
      <hr>
    `;

  } catch (error) {
    console.error("Error cargando estadísticas:", error);
  }

}

// =====================================================
// CARGAR GRAFICO VENTAS POR DIA
// =====================================================

async function cargarGrafico() {

  try {

    const response = await fetch("/ventas-por-dia");
    const datos = await response.json();

    const labels = datos.map(d => d.dia);
    const totales = datos.map(d => d.total);

    const ctx = document.getElementById("graficoVentas").getContext("2d");

    // 🔥 destruir gráfico previo si existe
    if (grafico) {
      grafico.destroy();
    }

    grafico = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Total vendido por día",
          data: totales,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

  } catch (error) {
    console.error("Error cargando gráfico:", error);
  }

}

// =====================================================
// FORMATEAR FECHA (FIX SQLITE)
// =====================================================

function formatearFecha(fecha) {
  return fecha.replace(" ", "T"); // 🔥 fix clave
}

// =====================================================
// CARGAR VENTAS
// =====================================================

async function cargarVentas() {

  try {

    const response = await fetch("/ventas");
    const ventas = await response.json();

    tabla.innerHTML = "";

    // 🔥 caso sin ventas
    if (ventas.length === 0) {
      tabla.innerHTML = `<tr><td colspan="6">Sin ventas registradas</td></tr>`;
      return;
    }

    ventas.forEach(venta => {

      const tr = document.createElement("tr");
      tr.dataset.id = venta.id;
      tr.classList.add("fila-venta");

      const fecha = new Date(formatearFecha(venta.fecha)).toLocaleString();

      tr.innerHTML = `
        <td>${venta.id}</td>
        <td>${fecha}</td>
        <td>$${venta.total_bruto}</td>
        <td>$${venta.descuento}</td>
        <td>$${venta.total_final}</td>
        <td>${venta.tipo_descuento}</td>
      `;

      tabla.appendChild(tr);

    });

  } catch (error) {
    console.error("Error cargando ventas:", error);
  }

}

// =====================================================
// FILTRAR VENTAS
// =====================================================

window.filtrarVentas = async function () {

  const desde = document.getElementById("fechaDesde").value;
  const hasta = document.getElementById("fechaHasta").value;

  if (!desde || !hasta) {
    alert("Seleccioná ambas fechas");
    return;
  }

  try {

    const response = await fetch(`/ventas-rango?desde=${desde}&hasta=${hasta}`);
    const ventas = await response.json();

    const tabla = document.getElementById("tablaVentas");
    tabla.innerHTML = "";

    ventas.forEach(venta => {

      const tr = document.createElement("tr");

      const fecha = new Date(venta.fecha.replace(" ", "T")).toLocaleString();

      tr.innerHTML = `
  <td>${venta.id}</td>
  <td>${fecha}</td>
  <td>$${venta.total_bruto || venta.total_final}</td>
  <td>$${venta.descuento || 0}</td>
  <td>$${venta.total_final}</td>
  <td>${venta.tipo_descuento || "NINGUNO"}</td>`;

      tabla.appendChild(tr);

    });

  } catch (error) {
    console.error("Error filtrando ventas:", error);
  }

};


// =====================================================
// VOLVER A TODOS LOS DATOS LUEGO DE FILTRAR
// =====================================================
window.resetearFiltro = function () {
  cargarVentas();
};

// =====================================================
// VOLVER A VENTAS.HTML
// =====================================================
window.irAVentas = function () {
  window.location.href = "/venta.html";
};

// =====================================================
// CLICK EN VENTA → MOSTRAR DETALLE
// =====================================================

tabla.addEventListener("click", async (e) => {

  const fila = e.target.closest(".fila-venta");
  if (!fila) return;

  const ventaId = fila.dataset.id;

  const existente = document.querySelector(`.detalle-${ventaId}`);
  if (existente) {
    existente.remove();
    return;
  }

  try {

    const response = await fetch(`/ventas/${ventaId}`);
    const detalle = await response.json();

    const trDetalle = document.createElement("tr");
    trDetalle.classList.add(`detalle-${ventaId}`);

    let contenido = `<td colspan="6">`;

    if (detalle.length === 0) {
      contenido += "Sin detalle";
    } else {

      contenido += "<ul>";

      detalle.forEach(prod => {
        contenido += `
          <li>
            ${prod.nombre_producto} 
            — ${prod.cantidad} x $${prod.precio_unitario}
          </li>
        `;
      });

      contenido += "</ul>";
    }

    contenido += `</td>`;

    trDetalle.innerHTML = contenido;

    fila.insertAdjacentElement("afterend", trDetalle);

  } catch (error) {
    console.error("Error obteniendo detalle:", error);
  }



});

// =====================================================
// INICIALIZACION
// =====================================================

cargarEstadisticas();
cargarGrafico();
cargarVentas();

});