// ======================================
// ELEMENTOS KPI
// ======================================

const ventasDia = document.getElementById("ventasDia");
const totalDia = document.getElementById("totalDia");
const pizzasDia = document.getElementById("pizzasDia");
const clientesHoy = document.getElementById("clientesHoy");
const ticketPromedio = document.getElementById("ticketPromedio");
const promedioPizzas = document.getElementById("promedioPizzas");
const topPizza = document.getElementById("topPizza");


// ======================================
// ELEMENTOS TENDENCIA
// ======================================

const trendVentas = document.getElementById("trendVentas");
const trendFacturacion = document.getElementById("trendFacturacion");


// ===============================
// CARGAR ACTIVIDAD POR DIA
// ===============================

async function cargarVentasPorDia(){

const res = await fetch("/ventas/por-dia");
const datos = await res.json();

const contenedor = document.getElementById("ventasPorDia");

contenedor.innerHTML = "";

datos.forEach(d => {

const fila = document.createElement("div");

fila.innerHTML =
"<b>"+d.dia+"</b> | Compras: "+d.compras+" | Pizzas: "+d.pizzas;

contenedor.appendChild(fila);

});

}


// ======================================
// CALCULAR TENDENCIA
// ======================================

function calcularTendencia(actual, anterior, elemento){

if(!elemento) return;

if(anterior == 0){

elemento.textContent = "";
return;

}

const diferencia = actual - anterior;

const porcentaje = ((diferencia / anterior) * 100).toFixed(1);

if(diferencia > 0){

elemento.className = "trend up";
elemento.textContent = "⬆ +" + porcentaje + "% vs ayer";

}

else if(diferencia < 0){

elemento.className = "trend down";
elemento.textContent = "⬇ " + porcentaje + "% vs ayer";

}

else{

elemento.textContent = "Sin cambio";

}

}


// ======================================
// CARGAR RESUMEN PRINCIPAL
// ======================================

async function cargarDashboard(){

const res = await fetch("/dashboard/resumen");
const datos = await res.json();

ventasDia.textContent = datos.ventas;
totalDia.textContent = "$" + datos.total_dia;
pizzasDia.textContent = datos.pizzas;
clientesHoy.textContent = datos.clientes;
ticketPromedio.textContent = "$" + datos.ticket_promedio;
promedioPizzas.textContent = datos.promedio_pizzas;
topPizza.textContent = datos.top_pizza;


// ===============================
// TENDENCIAS
// ===============================

calcularTendencia(
datos.ventas,
datos.ventas_ayer,
trendVentas
);

calcularTendencia(
datos.total_dia,
datos.total_ayer,
trendFacturacion
);

}


// ======================================
// GRAFICO VENTAS SEMANA
// ======================================

async function cargarGraficoVentas(){

const res = await fetch("/dashboard/ventas-semana");
const datos = await res.json();

const labels = datos.map(d => d.dia);
const valores = datos.map(d => d.total);

new Chart(document.getElementById("graficoVentas"),{

type:"line",

data:{
labels:labels,
datasets:[{
label:"Ventas $",
data:valores
}]
}

});

}


// ======================================
// GRAFICO PIZZAS POR SABOR
// ======================================

async function cargarGraficoSabores(){

const res = await fetch("/dashboard/pizzas-sabor");
const datos = await res.json();

const labels = datos.map(d => d.sabor);
const valores = datos.map(d => d.total);

new Chart(document.getElementById("graficoSabores"),{

type:"bar",

data:{
labels:labels,
datasets:[{
label:"Pizzas vendidas",
data:valores
}]
}

});

}


// ======================================
// CARGAR TOP 5 PIZZAS
// ======================================

async function cargarTopPizzas(){

const res = await fetch("/dashboard/top-pizzas");
const datos = await res.json();

const lista = document.getElementById("topPizzas");

lista.innerHTML = "";

const medallas = ["🥇","🥈","🥉"];

datos.forEach((pizza,i)=>{

const li = document.createElement("li");

li.textContent =
(medallas[i] || (i+1)) + " " +
pizza.nombre_producto +
" (" + pizza.total + ")";

lista.appendChild(li);

});

}


// ======================================
// ACTUALIZAR TODO EL DASHBOARD
// ======================================

function actualizarDashboard(){

cargarDashboard();
cargarVentasPorDia();
cargarGraficoVentas();
cargarGraficoSabores();
cargarTopPizzas();

}


// ======================================
// INICIALIZAR DASHBOARD
// ======================================

actualizarDashboard();

setInterval(actualizarDashboard,10000);