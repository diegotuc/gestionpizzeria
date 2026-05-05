// =====================================================
// 🔹 OBTENER ESTADO DE CAJA
// =====================================================

async function obtenerEstadoCaja() {
    try {
      const res = await fetch("/caja/actual");
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error caja:", error);
      return null;
    }
  }
  
  // =====================================================
  // 🔹 ACTUALIZAR UI
  // =====================================================
  
  async function actualizarUI() {
  
    const caja = await obtenerEstadoCaja();
    const info = document.getElementById("infoCaja");
  
    if (!info) return;
  
    if (!caja || !caja.abierta) {
      info.innerHTML = "🟥 Caja cerrada";
      return;
    }
  
    info.innerHTML = `
      🟢 Caja abierta <br>
      Apertura: ${caja.fecha_apertura || "-"} <br>
      Monto inicial: $${caja.monto_inicial ?? 0}
    `;
  }
  
  // =====================================================
  // 🔹 ABRIR CAJA
  // =====================================================
  
  async function abrirCaja() {
  
    try {
  
      const res = await fetch("/caja/abrir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ monto_inicial: 0 })
      });
  
      const data = await res.json();
  
      if (!data || !data.ok) {
        alert("Error al abrir caja");
        return;
      }
  
      alert("Caja abierta correctamente");
      actualizarUI();
  
    } catch (error) {
      console.error(error);
    }
  
  }
  
  // =====================================================
  // 🔹 CERRAR CAJA
  // =====================================================
  
  async function cerrarCaja() {
  
    try {
  
      const res = await fetch("/caja/cerrar", {
        method: "POST"
      });
  
      const data = await res.json();
  
      if (!data || !data.ok) {
        alert(data?.mensaje || "Error al cerrar caja");
        return;
      }
  
      alert("Caja cerrada");
      actualizarUI();
  
    } catch (error) {
      console.error(error);
    }
  
  }
  
  // =====================================================
  // 🔹 EVENTOS
  // =====================================================
  
  document.addEventListener("DOMContentLoaded", () => {
  
    actualizarUI();
  
    const btnAbrir = document.getElementById("btnAbrirCaja");
    if (btnAbrir) btnAbrir.addEventListener("click", abrirCaja);
  
    const btnCerrar = document.getElementById("btnCerrarCaja");
    if (btnCerrar) btnCerrar.addEventListener("click", cerrarCaja);
  
  });