// ===== INICIO MÓDULO: PEDIDOS =====

/**
 * Estado interno del módulo
 */
 let ticket = [];

 /**
  * Simulación de sabores (después lo conectamos a backend)
  */
 const sabores = [
     { nombre: "Muzzarella", precio: 1000 },
     { nombre: "Napolitana", precio: 1200 },
     { nombre: "Fugazzeta", precio: 1300 }
 ];
 
 /**
  * Render sabores
  */
 function renderSabores() {
     const cont = document.getElementById('listaSabores');
     cont.innerHTML = "";
 
     sabores.forEach(s => {
         const btn = document.createElement('button');
         btn.textContent = `${s.nombre} - $${s.precio}`;
         btn.onclick = () => agregarAlTicket(s);
         cont.appendChild(btn);
     });
 }
 
 /**
  * Agregar al ticket
  */
 function agregarAlTicket(sabor) {
     ticket.push(sabor);
     renderTicket();
 }
 
 /**
  * Render ticket
  */
 function renderTicket() {
     const ul = document.getElementById('ticket');
     ul.innerHTML = "";
 
     let total = 0;
 
     ticket.forEach(item => {
         const li = document.createElement('li');
         li.textContent = `${item.nombre} - $${item.precio}`;
         ul.appendChild(li);
         total += item.precio;
     });
 
     document.getElementById('total').innerText = `$${total}`;
 }
 
 /**
  * Confirmar venta
  */
 function confirmarVenta() {
     if (ticket.length === 0) {
         mostrarMensaje("No hay productos", true);
         return;
     }
 
     const venta = {
         cliente: document.getElementById('clienteNombre').value,
         total: ticket.reduce((a, b) => a + b.precio, 0)
     };
 
     // Evento global
     App.emitir('venta_realizada', venta);
 
     mostrarMensaje("Venta realizada ✅");
 
     ticket = [];
     renderTicket();
 }
 
 /**
  * Cancelar venta
  */
 function cancelarVenta() {
     ticket = [];
     renderTicket();
     mostrarMensaje("Venta cancelada");
 }
 
 /**
  * Mensajes
  */
 function mostrarMensaje(texto, error = false) {
     const div = document.getElementById('mensajeSistema');
     div.innerText = texto;
     div.style.color = error ? "red" : "green";
 }
 
 /**
  * Volver al dashboard
  */
 function volver() {
     window.location.href = "../../dashboard/dashboard.html";
 }
 
 /**
  * Eventos UI
  */
 document.getElementById('btnConfirmar').addEventListener('click', confirmarVenta);
 document.getElementById('btnCancelar').addEventListener('click', cancelarVenta);
 
 /**
  * Init
  */
 renderSabores();
 renderTicket();
 
 // ===== FIN MÓDULO: PEDIDOS =====