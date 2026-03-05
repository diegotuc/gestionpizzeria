// ======================================
// VARIABLES DOM CLIENTES
// ======================================

const btnBuscar = document.getElementById("buscarCliente");
const telefonoInput = document.getElementById("telefonoBuscar");

const infoCliente = document.getElementById("infoCliente");

const nombreCliente = document.getElementById("nombreCliente");
const telefonoCliente = document.getElementById("telefonoCliente");
const pizzasCliente = document.getElementById("pizzasCliente");

const btnHistorial = document.getElementById("verHistorial");
const historialDiv = document.getElementById("historialVentas");

let telefonoActual = null;


// ======================================
// ELEMENTOS DEL RESUMEN DE CLIENTE
// ======================================

const resumenCard = document.getElementById("resumenCard");
const resumenCompras = document.getElementById("resumenCompras");
const resumenPizzas = document.getElementById("resumenPizzas");
const resumenPromedio = document.getElementById("resumenPromedio");
const resumenUltima = document.getElementById("resumenUltima");


// ======================================
// BUSCAR CLIENTE
// Consulta API /clientes/buscar
// ======================================

btnBuscar.addEventListener("click", async ()=>{

const telefono = telefonoInput.value.trim();

if(!telefono){
alert("Ingrese teléfono");
return;
}

const res = await fetch(`/clientes/buscar/${telefono}`);
const cliente = await res.json();

if(!cliente){
alert("Cliente no encontrado");
return;
}

telefonoActual = telefono;

infoCliente.style.display="block";

nombreCliente.textContent = cliente.nombre;
telefonoCliente.textContent = cliente.telefono;
pizzasCliente.textContent = cliente.pizzas_acumuladas;

historialDiv.innerHTML="";

// ======================================
// CARGAR RESUMEN DEL CLIENTE
// ======================================

cargarResumenCliente(telefonoActual);

});



// ======================================
// VER HISTORIAL CLIENTE
// Consulta API /clientes/historial
// ======================================

btnHistorial.addEventListener("click", async ()=>{

if(!telefonoActual) return;

const res = await fetch(`/clientes/historial/${telefonoActual}`);
const historial = await res.json();

let html = "<h3>Historial</h3>";

if(historial.length===0){

html += "<p>Sin compras</p>";

}else{

html += "<ul>";

historial.forEach(v => {

const fechaFormateada = new Date(v.fecha).toLocaleDateString();

html += `<li>
${fechaFormateada} - ${v.pizzas} pizzas
</li>`;

});

html += "</ul>";

}

historialDiv.innerHTML = html;

});



// ======================================
// OBTENER RESUMEN INTELIGENTE DEL CLIENTE
// Consulta API /clientes/resumen
// ======================================

async function cargarResumenCliente(telefono){

if(!telefono) return;

const res = await fetch(`/clientes/resumen/${telefono}`);
const datos = await res.json();

if(datos.error){
console.log("Error obteniendo resumen");
return;
}

resumenCard.style.display="block";

resumenCompras.textContent = datos.compras;
resumenPizzas.textContent = datos.total_pizzas;
resumenPromedio.textContent = datos.promedio_pizzas;
resumenUltima.textContent = datos.ultima_compra;

}