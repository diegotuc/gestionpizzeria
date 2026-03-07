// ======================================
// ELEMENTOS DOM RANKING
// ======================================

const btnRanking = document.getElementById("cargarRanking");
const rankingLista = document.getElementById("rankingLista");


// ======================================
// CARGAR RANKING DESDE API
// Consulta: /clientes/top
// ======================================

async function cargarRanking(){

const res = await fetch("/clientes/top");
const clientes = await res.json();

let html = "";

if(clientes.length === 0){

html = "<p>No hay clientes registrados</p>";

}else{

clientes.forEach((c,i)=>{

html += `
<div class="ranking-item">

<span class="ranking-pos">
${i+1}️⃣
</span>

<span class="ranking-nombre">
${c.nombre}
</span>

<span class="ranking-pizzas">
🍕 ${c.pizzas_acumuladas}
</span>

</div>
`;

});

}

rankingLista.innerHTML = html;

}


// ======================================
// EVENTO BOTON ACTUALIZAR
// ======================================

btnRanking.addEventListener("click", cargarRanking);


// ======================================
// CARGA AUTOMATICA AL ABRIR PAGINA
// ======================================

cargarRanking();