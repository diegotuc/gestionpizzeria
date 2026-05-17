// ==============================
// API INVENTARIO - CAPA LIMPIA
// ==============================

// ==============================
// HELPERS
// ==============================
async function request(url, options = {}) {

    try {

        const res = await fetch(url, options);

        const data = await res.json();

        // fallback básico de seguridad
        if (!res.ok) {
            throw new Error(data.error || 'Error API');
        }

        return data;

    } catch (error) {
        console.error('API ERROR:', url, error);
        throw error;
    }
}

// ==============================
// PRODUCTOS
// ==============================
export function apiGetProductos() {
    return request('/api/inventario/productos-admin');
}

export function apiCrearProducto(data) {
    return request('/api/inventario/productos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

export function apiEditarProducto(id, data) {
    return request(`/api/inventario/productos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

export function apiDesactivarProducto(id) {
    return request(`/api/inventario/productos/${id}/desactivar`, {
        method: 'PUT'
    });
}

export function apiReactivarProducto(id) {
    return request(`/api/inventario/productos/${id}/reactivar`, {
        method: 'PUT'
    });
}

// ==============================
// STOCK
// ==============================
export function apiIngresarStock(data) {
    return request('/api/inventario/ingresar-stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

// ==============================
// AUDITORÍA
// ==============================
export function apiGetAuditoria() {
    return request('/api/inventario/auditoria');
}

// ==============================
// MÉTRICAS
// ==============================
export function apiGetMetricas() {
    return request('/api/inventario/metricas');
}