const totalInput = document.getElementById("totalVenta");
const recibidoInput = document.getElementById("montoRecibido");
const vueltoInput = document.getElementById("vuelto");
const btnCobrar = document.getElementById("btnCobrar");
const mensaje = document.getElementById("mensaje");
const ventaIdInput = document.getElementById("ventaId");

// 🧮 Calcular vuelto en tiempo real
recibidoInput.addEventListener("input", () => {
  const total = parseFloat(totalInput.value) || 0;
  const recibido = parseFloat(recibidoInput.value) || 0;

  const vuelto = recibido - total;
  vueltoInput.value = vuelto >= 0 ? vuelto : "Falta dinero";
});




// 💰 Cobrar venta
btnCobrar.addEventListener("click", async () => {
  const ventaId = ventaIdInput.value;
  const total = parseFloat(totalInput.value);
  const recibido = parseFloat(recibidoInput.value);

  if (!ventaId || !total || !recibido) {
    mensaje.textContent = "⚠️ Completar todos los campos";
    return;
  }

  if (recibido < total) {
    mensaje.textContent = "⚠️ Dinero insuficiente";
    return;
  }

  try {
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        venta_id: ventaId,
        monto: total
      })
    });

    const data = await res.json();

    if (res.ok) {
      mensaje.textContent = "✅ Venta cobrada correctamente";
      limpiarCampos();
    } else {
      mensaje.textContent = data.error || "❌ Error al cobrar";;
    }

  } catch (error) {
    console.error(error);
    mensaje.textContent = "❌ Error del servidor";
  }
});



function limpiarCampos() {
  ventaIdInput.value = "";
  totalInput.value = "";
  recibidoInput.value = "";
  vueltoInput.value = "";
}