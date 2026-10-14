import api from "./api.js";

// Lugares, escenarios y sectores. Las mismas llamadas sirven al superadmin y a la productora:
// solo cambia el prefijo (ámbito "admin" → /api/admin/lugares, "panel" → /api/panel/lugares).
// La API decide qué ve y qué puede modificar cada uno.
export const lugaresService = (ambito) => {
  const base = `/${ambito}/lugares`;
  return {
    obtenerLugares: (filtros) => api.get(base, { params: filtros }),
    obtenerLugar: (id) => api.get(`${base}/${id}`),
    crearLugar: (lugar) => api.post(base, lugar),
    actualizarLugar: (id, lugar) => api.put(`${base}/${id}`, lugar),
    eliminarLugar: (id) => api.delete(`${base}/${id}`),
    // tipo: "escenarios" | "espacios"
    crearParte: (idLugar, tipo, datos) => api.post(`${base}/${idLugar}/${tipo}`, datos),
    actualizarParte: (idLugar, tipo, id, datos) => api.put(`${base}/${idLugar}/${tipo}/${id}`, datos),
    eliminarParte: (idLugar, tipo, id) => api.delete(`${base}/${idLugar}/${tipo}/${id}`)
  };
};
