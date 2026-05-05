const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// =====================
// MIDDLEWARES
// =====================
app.use(express.json());

// Archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public_modular')));

// =====================
// ROUTES (MODULOS)
// =====================

// Ventas
const ventasRoutes = require('./public_modular/modulos/ventas/ventas.routes');
app.use('/api/ventas', ventasRoutes);

// =====================
// RUTA TEST
// =====================
app.get('/api/test', (req, res) => {
    res.json({ ok: true, msg: 'Servidor funcionando correctamente' });
});

// =====================
// MANEJO DE ERRORES
// =====================
app.use((err, req, res, next) => {
    console.error("Error global:", err);
    res.status(500).json({
        ok: false,
        error: "Error interno del servidor"
    });
});

// =====================
// INICIAR SERVIDOR
// =====================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});