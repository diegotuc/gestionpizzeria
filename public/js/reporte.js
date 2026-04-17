// =====================================================
// MODULO REPORTE - PIZZERIA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const tabla = document.getElementById("tablaVentas");

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

    new Chart(ctx, {
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
  // CARGAR VENTAS
  // =====================================================

  async function cargarVentas() {

    try {

      const response = await fetch("/ventas");
      const ventas = await response.json();

      tabla.innerHTML = "";

      ventas.forEach(venta => {

        const tr = document.createElement("tr");
        tr.dataset.id = venta.id;
        tr.classList.add("fila-venta");

        tr.innerHTML = `
          <td>${venta.id}</td>
          <td>${new Date(venta.fecha).toLocaleString()}</td>
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
  // CLICK EN VENTA → MOSTRAR DETALLE
  // =====================================================

  tabla.addEventListener("click", async (e) => {

    const fila = e.target.closest(".fila-venta");
    if (!fila) return;

    const ventaId = fila.dataset.id;

    // Si ya existe detalle, lo elimina (toggle)
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
  cargarGrafico()
  cargarVentas();

});