// =====================================================
// MODULO VENTA - PIZZERIA (FIX TOTAL)
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const ticket = {};

  const ticketList = document.getElementById("ticket");
  const totalEl = document.getElementById("total");
  const descuentoEl = document.getElementById("descuento");
  const tipoClienteEl = document.getElementById("tipoCliente");

  const clienteNombreInput = document.getElementById("clienteNombre");
  const clienteTelefonoInput = document.getElementById("clienteTelefono");

  const confirmarBtn = document.querySelector(".confirmar");
  const cancelarBtn = document.querySelector(".cancelar");
  const mensajeSistema = document.getElementById("mensajeSistema");

  // =====================================================
  // MENSAJES
  // =====================================================

  function mostrarMensaje(texto, tipo) {
    mensajeSistema.textContent = texto;
    mensajeSistema.className = "mensaje " + tipo;

    setTimeout(() => {
      mensajeSistema.className = "mensaje oculto";
    }, 2500);
  }

  // =====================================================
  // 🔍 BUSCAR CLIENTE POR TELEFONO (FIX)
  // =====================================================

  clienteTelefonoInput.addEventListener("blur", async () => {

    const telefono = clienteTelefonoInput.value.trim();

    if (!telefono) return;

    try {

      const response = await fetch(`/clientes/buscar/${telefono}`);

      if (!response.ok) {
        console.error("Ruta no encontrada:", response.status);
        return;
      }

      const cliente = await response.json();

      if (cliente) {
        clienteNombreInput.value = cliente.nombre || "";
        tipoClienteEl.value = cliente.tipo_cliente || "minorista";
        mostrarMensaje("Cliente encontrado ✔", "exito");
      }

    } catch (error) {
      console.error("Error buscando cliente:", error);
    }

  });

  // =====================================================
  // CARGAR PRODUCTOS
  // =====================================================

  async function cargarSabores() {

    const response = await fetch("/productos");
    const productos = await response.json();

    const contenedor = document.getElementById("listaSabores");
    contenedor.innerHTML = "";

    productos.forEach(prod => {

      const btn = document.createElement("button");
      btn.classList.add("sabor-btn");
      btn.textContent = `${prod.nombre} - $${prod.precio}`;

      btn.addEventListener("click", () => {

        if (!ticket[prod.nombre]) {
          ticket[prod.nombre] = {
            cantidad: 1,
            precio: prod.precio
          };
        } else {
          ticket[prod.nombre].cantidad++;
        }

        renderTicket();
      });

      contenedor.appendChild(btn);
    });
  }

  // =====================================================
  // CALCULAR TOTALES
  // =====================================================

  function calcularTotales() {

    let total = 0;
    let totalPizzas = 0;
    let precioBase = 0;

    for (let sabor in ticket) {
      const item = ticket[sabor];
      total += item.cantidad * item.precio;
      totalPizzas += item.cantidad;
      precioBase = item.precio;
    }

    let descuento = 0;
    let tipo_descuento = "NINGUNO";

    if (tipoClienteEl.value === "minorista" && totalPizzas >= 5) {
      descuento = precioBase * 0.25;
      tipo_descuento = "PROMO_5_PIZZAS";
    }

    return {
      total_bruto: total,
      descuento,
      total_final: total - descuento,
      tipo_descuento
    };
  }

  // =====================================================
  // RENDER TICKET (FIX BOTONES)
  // =====================================================

  function renderTicket() {

    ticketList.innerHTML = "";

    const totales = calcularTotales();

    for (let sabor in ticket) {

      const item = ticket[sabor];
      const subtotal = item.cantidad * item.precio;

      const li = document.createElement("li");
      li.classList.add("ticket-item");

      li.innerHTML = `
      <div> <strong>${sabor}</strong><br> Cantidad: ${item.cantidad} 
      </div> 
      <div> <button class="restar" data-sabor="${sabor}">➖</button> <button class="sumar" data-sabor="${sabor}">➕</button> <button class="eliminar" data-sabor="${sabor}">❌</button> </div> 
      <div>$${subtotal}</div>
      `;

      ticketList.appendChild(li);
    }

    descuentoEl.textContent = `-$${totales.descuento}`;
    totalEl.textContent = `$${totales.total_final}`;
  }

  // =====================================================
  // 🔥 CONTROL UNICO DE BOTONES (FIX DUPLICADOS)
  // =====================================================

  ticketList.addEventListener("click", (e) => {

    const sabor = e.target.dataset.sabor;
    if (!sabor) return;

    if (e.target.classList.contains("sumar")) {
      ticket[sabor].cantidad++;
    }

    if (e.target.classList.contains("restar")) {
      ticket[sabor].cantidad--;
      if (ticket[sabor].cantidad <= 0) {
        delete ticket[sabor];
      }
    }

    if (e.target.classList.contains("eliminar")) {
      delete ticket[sabor];
    }

    renderTicket();
  });

  // =====================================================
  // CANCELAR
  // =====================================================

  cancelarBtn.addEventListener("click", () => {

    for (let key in ticket) delete ticket[key];

    renderTicket();

    clienteNombreInput.value = "";
    clienteTelefonoInput.value = "";

    mostrarMensaje("Venta cancelada", "error");
  });

  // =====================================================
  // CONFIRMAR VENTA
  // =====================================================

  confirmarBtn.addEventListener("click", async () => {

    if (Object.keys(ticket).length === 0) return;

    const totales = calcularTotales();

    const productosDetalle = [];

    for (let sabor in ticket) {
      productosDetalle.push({
        nombre: sabor,
        cantidad: ticket[sabor].cantidad,
        precio: ticket[sabor].precio
      });
    }

    const datosVenta = {
      nombre: clienteNombreInput.value,
      telefono: clienteTelefonoInput.value,
      tipo_cliente: tipoClienteEl.value,
      productos: productosDetalle,
      metodo_pago: document.getElementById("metodoPago").value,
      total_bruto: totales.total_bruto,
      descuento: totales.descuento,
      total_final: totales.total_final,
      tipo_descuento: totales.tipo_descuento
    };

    try {

      const res = await fetch('/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosVenta)
      });

      const data = await res.json();

      if (data.error) {
        mostrarMensaje(data.error, "error");
        return;
      }

      mostrarMensaje("Venta realizada ✔", "exito");

      for (let key in ticket) delete ticket[key];

      renderTicket();

      clienteNombreInput.value = "";
      clienteTelefonoInput.value = "";

    } catch (err) {
      console.error(err);
      mostrarMensaje("Error en la venta", "error");
    }

  });

  // =====================================================
  // INIT
  // =====================================================

  cargarSabores();
  renderTicket();

});