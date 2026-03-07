// ======================================
// ELEMENTOS KPI
// ======================================

const ventasDia = document.getElementById("ventasDia");
const totalDia = document.getElementById("totalDia");
const pizzasDia = document.getElementById("pizzasDia");
const topPizza = document.getElementById("topPizza");


// ===============================
// CARGAR VENTAS POR DIA
// ===============================
async function cargarVentasPorDia() {

    const res = await fetch("/ventas/por-dia");
    const datos = await res.json();

    const contenedor = document.getElementById("ventasPorDia");
    contenedor.innerHTML = "";

    datos.forEach(d => {

        const fila = document.createElement("div");

        fila.innerHTML = `
            <b>${d.dia}</b> 
            | Compras: ${d.compras}
            | Pizzas: ${d.pizzas}
        `;

        contenedor.appendChild(fila);

    });

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
topPizza.textContent = datos.top_pizza;

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
// INICIALIZAR DASHBOARD
// ======================================

cargarDashboard();
cargarVentasPorDia();
cargarGraficoVentas();
cargarGraficoSabores();


setInterval(cargarDashboard,10000);