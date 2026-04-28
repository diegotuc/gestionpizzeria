// ======================================
// VARIABLES DOM
// ======================================

const btnBuscar = document.getElementById("buscarCliente");
const telefonoInput = document.getElementById("telefonoBuscar");

const infoCliente = document.getElementById("infoCliente");

const nombreCliente = document.getElementById("nombreCliente");
const telefonoCliente = document.getElementById("telefonoCliente");
const pizzasCliente = document.getElementById("pizzasCliente");

const btnHistorial = document.getElementById("verHistorial");
const historialDiv = document.getElementById("historialVentas");

const fidelizacionCard = document.getElementById("fidelizacionCard");
const mensajeFidelizacion = document.getElementById("mensajeFidelizacion");

const resumenCard = document.getElementById("resumenCard");
const resumenCompras = document.getElementById("resumenCompras");
const resumenPizzas = document.getElementById("resumenPizzas");
const resumenPromedio = document.getElementById("resumenPromedio");
const resumenUltima = document.getElementById("resumenUltima");
const resumenTipo = document.getElementById("resumenTipo");

// LISTADO
const listaClientesDiv = document.getElementById("listaClientes");
const btnFiltrar = document.getElementById("btnFiltrar");
const filtroBusqueda = document.getElementById("filtroBusqueda");
const filtroTipo = document.getElementById("filtroTipo");

let telefonoActual = null;

// ======================================
// BUSCAR CLIENTE
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

cargarResumenCliente(telefonoActual);

});

// ======================================
// HISTORIAL
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
const fecha = new Date(v.fecha).toLocaleDateString();

html += `<li>${fecha} - ${v.pizzas} pizzas</li>`;
});

html += "</ul>";
}

historialDiv.innerHTML = html;

});

// ======================================
// RESUMEN
// ======================================

async function cargarResumenCliente(telefono){

if(!telefono) return;

const res = await fetch(`/clientes/resumen/${telefono}`);
const datos = await res.json();

resumenCard.style.display="block";

resumenCompras.textContent = datos.compras;
resumenPizzas.textContent = datos.total_pizzas;
resumenPromedio.textContent = datos.promedio_pizzas;
resumenUltima.textContent = datos.ultima_compra;

fidelizacionCard.style.display="block";
mensajeFidelizacion.textContent = datos.mensaje_fidelizacion;

resumenTipo.textContent = datos.tipo_cliente;

}

// ======================================
// LISTADO CLIENTES
// ======================================

async function cargarClientes(){

const buscar = filtroBusqueda.value.trim();
const tipo = filtroTipo.value;

const res = await fetch(`/clientes?buscar=${buscar}&tipo=${tipo}`);
const clientes = await res.json();

renderClientes(clientes);

}

function renderClientes(clientes){

if(!clientes || clientes.length===0){
listaClientesDiv.innerHTML = "<p>No hay clientes</p>";
return;
}

let html = "";

clientes.forEach(c => {

let color = "#7f8c8d";

if(c.tipo_cliente==="FRECUENTE") color="#2ecc71";
if(c.tipo_cliente==="OCASIONAL") color="#f39c12";

html += `
<div onclick="seleccionarCliente('${c.telefono}')"
style="
padding:10px;
margin-bottom:10px;
background:white;
border-left:5px solid ${color};
border-radius:5px;
cursor:pointer;
">
<strong>${c.nombre}</strong> (${c.telefono})<br>
🍕 ${c.pizzas_acumuladas} pizzas |
🛒 ${c.compras} compras |
<strong>${c.tipo_cliente}</strong>
</div>
`;

});

listaClientesDiv.innerHTML = html;

}

function seleccionarCliente(telefono){

telefonoInput.value = telefono;
btnBuscar.click();

}

// eventos
btnFiltrar.addEventListener("click", cargarClientes);

// carga inicial
cargarClientes();