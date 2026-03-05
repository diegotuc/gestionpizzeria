// =====================================================
// MODULO VENTA - PIZZERIA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  // =====================================================
  // VARIABLES PRINCIPALES
  // =====================================================

  const ticket = {};

  const ticketList = document.getElementById("ticket");
  const totalEl = document.getElementById("total");
  const descuentoEl = document.getElementById("descuento");
  const tipoClienteEl = document.getElementById("tipoCliente");

  const clienteNombreInput = document.getElementById("clienteNombre");
  const clienteTelefonoInput = document.getElementById("clienteTelefono");

  //const cancelarBtn = document.getElementById("cancelarVenta");

  const confirmarBtn = document.querySelector(".confirmar");
  const cancelarBtn = document.querySelector(".cancelar");
    const mensajeSistema = document.getElementById("mensajeSistema");

  if (!ticketList || !totalEl || !descuentoEl || !tipoClienteEl || !confirmarBtn || !cancelarBtn) {
    console.error("Algún elemento del HTML no existe.");
    return;
  }

  // =====================================================
// BUSCAR CLIENTE POR TELEFONO
// =====================================================

  clienteTelefonoInput.addEventListener("blur", async () => {

  const telefono = clienteTelefonoInput.value.trim();

  if (!telefono) return;

  try {

    const response = await fetch(`/clientes/buscar/${telefono}`);

    if (!response.ok) return;

    const cliente = await response.json();

    // completar nombre automáticamente
    clienteNombreInput.value = cliente.nombre;

    mostrarMensaje("Cliente encontrado", "exito");

  } catch (error) {

    // si no existe el cliente no pasa nada
    console.log("Cliente nuevo");

  }

});

//=====================================
//RUTA PARA VER HISTORIAL DEL CLIENTE
//=====================================

app.get("/clientes/historial/:telefono", (req, res) => {

  const telefono = req.params.telefono;

  const cliente = clientes.find(c => c.telefono === telefono);

  if (!cliente) {
    return res.json({ historial: [] });
  }

  res.json(cliente.historial);
});


  // =====================================================
  // MENSAJES DEL SISTEMA (UX)
  // =====================================================

  function mostrarMensaje(texto, tipo) {
    if (!mensajeSistema) return;

    mensajeSistema.textContent = texto;
    mensajeSistema.className = "mensaje " + tipo;

  setTimeout(() => {
     mensajeSistema.className = "mensaje oculto";
    }, 2500);
  }



  

  // =====================================================
  // CARGAR PRODUCTOS DESDE BACKEND
  // =====================================================

  async function cargarSabores() {

    try {
      const response = await fetch("/productos");
      const productos = await response.json();

      const contenedor = document.getElementById("listaSabores");
      contenedor.innerHTML = "";

      productos.forEach(prod => {

        const btn = document.createElement("button");
        btn.classList.add("sabor-btn");
        btn.textContent = `${prod.nombre} - $${prod.precio}`;
        btn.dataset.sabor = prod.nombre;
        btn.dataset.precio = prod.precio;

        // -------------------------
        // AGREGAR PRODUCTO AL TICKET
        // -------------------------

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

    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  }

  // =====================================================
  // RENDERIZAR TICKET (ORDEN ALFABETICO)
  // =====================================================

  function renderTicket() {

    ticketList.innerHTML = "";

    let total = 0;
    let totalPizzas = 0;
    let precioDescuento = 0;

    // -------------------------
    // ORDENAR PRODUCTOS ALFABETICAMENTE
    // -------------------------

    const saboresOrdenados = Object.keys(ticket).sort();

    for (let sabor of saboresOrdenados) {

      const item = ticket[sabor];
      const subtotal = item.cantidad * item.precio;

      total += subtotal;
      totalPizzas += item.cantidad;
      precioDescuento = item.precio;

      const li = document.createElement("li");
      li.classList.add("ticket-item");

      li.innerHTML = `
        <div>
          <strong>${sabor}</strong><br>
          Cantidad: ${item.cantidad}
        </div>

        <div>
          <button class="restar" data-sabor="${sabor}">➖</button>
          <button class="sumar" data-sabor="${sabor}">➕</button>
          <button class="eliminar" data-sabor="${sabor}">❌</button>
        </div>

        <div>
          $${subtotal}
        </div>
      `;

      ticketList.appendChild(li);
    }

    // -------------------------
    // CALCULO DESCUENTO
    // -------------------------

    let descuento = 0;

    if (tipoClienteEl.value === "minorista" && totalPizzas >= 5) {
      descuento = precioDescuento * 0.25;
    }

    descuentoEl.textContent = `-$${descuento.toFixed(0)}`;
    totalEl.textContent = `$${(total - descuento).toFixed(0)}`;

    // -------------------------
    // ACTIVAR / DESACTIVAR BOTONES
    // -------------------------

    const sinProductos = Object.keys(ticket).length === 0;
    confirmarBtn.disabled = sinProductos;
    cancelarBtn.disabled = sinProductos;
  }


// =====================================================
// AUTOCOMPLETAR CLIENTE POR TELEFONO
// =====================================================

clienteTelefonoInput.addEventListener("blur", async () => {

  const telefono = clienteTelefonoInput.value.trim();

  if (!telefono) return;

  try {

    const response = await fetch(`/clientes/buscar/${telefono}`);
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
  // CONTROLES DEL TICKET (SUMAR / RESTAR / ELIMINAR)
  // =====================================================

  ticketList.addEventListener("click", (e) => {

    const sabor = e.target.dataset.sabor;
    if (!sabor) return;

    // SUMAR
    if (e.target.classList.contains("sumar")) {
      ticket[sabor].cantidad++;
    }

    // RESTAR
    if (e.target.classList.contains("restar")) {
      ticket[sabor].cantidad--;
      if (ticket[sabor].cantidad <= 0) {
        delete ticket[sabor];
      }
    }

    // ELIMINAR COMPLETO
    if (e.target.classList.contains("eliminar")) {
      delete ticket[sabor];
    }

    renderTicket();
  });

  // =====================================================
  // CANCELAR VENTA CODIGO VIEJO
  // =====================================================

  //cancelarBtn.addEventListener("click", () => {
  //  for (let key in ticket) delete ticket[key];
  //  renderTicket();
  //});

  // =====================================================
// CANCELAR VENTA
// =====================================================

cancelarBtn.addEventListener("click", () => {

  // limpiar ticket
  for (let key in ticket) delete ticket[key];

  renderTicket();

  // limpiar cliente
  clienteNombreInput.value = "";
  clienteTelefonoInput.value = "";

  // reiniciar totales
  actualizarTotales();

  // mensaje
  mostrarMensaje("❌ Venta cancelada", "error");

});

  // =====================================================
  // =====================================================
// CONFIRMAR VENTA (GUARDA VENTA + DETALLE)
// =====================================================

confirmarBtn.addEventListener("click", async () => {

  if (Object.keys(ticket).length === 0) return;

  let total = 0;
  let totalPizzas = 0;
  let precioDescuento = 0;

  // -------------------------
  // CALCULAR TOTALES
  // -------------------------

  for (let sabor in ticket) {
    const item = ticket[sabor];
    total += item.cantidad * item.precio;
    totalPizzas += item.cantidad;
    precioDescuento = item.precio;
  }

  let descuento = 0;
  let tipo_descuento = "ninguno";

  if (tipoClienteEl.value === "minorista" && totalPizzas >= 5) {
    descuento = precioDescuento * 0.25;
    tipo_descuento = "tarjeta";
  }

  const total_final = total - descuento;

  // -------------------------
  // PREPARAR DETALLE DE PRODUCTOS
  // -------------------------

  const productosDetalle = [];

  for (let sabor in ticket) {
    productosDetalle.push({
      nombre: sabor,
      cantidad: ticket[sabor].cantidad,
      precio: ticket[sabor].precio
    });
  }

  // -------------------------
  // ENVIAR AL BACKEND
  // -------------------------

  try {

    const nombre = clienteNombreInput.value.trim();
    const telefono = clienteTelefonoInput.value.trim();
  
    if (!telefono) {
      mostrarMensaje("⚠️ Ingresá el teléfono del cliente", "error");
      return;
    }
  
    const response = await fetch("/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombre,
        telefono: telefono,
        tipo_cliente: tipoClienteEl.value,
        productos: productosDetalle
      })
    });
  
    const data = await response.json();
  
    mostrarMensaje("✅ Venta guardada correctamente", "exito");

// LIMPIAR TICKET
for (let key in ticket) delete ticket[key];

// LIMPIAR CAMPOS CLIENTE
clienteNombreInput.value = "";
clienteTelefonoInput.value = "";

// REINICIAR TICKET
renderTicket();



   // -------------------------
   // LIMPIAR TICKET Y CLIENTE
   // -------------------------

    for (let key in ticket) delete ticket[key];

    clienteNombreInput.value = "";
    clienteTelefonoInput.value = "";

    renderTicket();
  
  } catch (error) {
    console.error("Error al guardar venta:", error);
    mostrarMensaje("❌ Error al guardar venta", "error");
  }

});

  // =====================================================
  // INICIALIZACION
  // =====================================================

  renderTicket();
  cargarSabores();

});