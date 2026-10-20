import api from "./api.js";

// Solo productoras (/api/panel). Todo es de la productora del usuario logueado.
// Los lugares están en lugaresService.js (lo comparten superadmin y productora).

// ─── Mi productora ───
export const obtenerMiEmpresa = () => api.get("/panel/empresa");
export const actualizarMiEmpresa = (datos) => api.put("/panel/empresa", datos);

// ─── Artistas ───
export const obtenerArtistas = () => api.get("/panel/artistas");
export const crearArtista = (artista) => api.post("/panel/artistas", artista);
export const actualizarArtista = (id, artista) => api.put(`/panel/artistas/${id}`, artista);
export const eliminarArtista = (id) => api.delete(`/panel/artistas/${id}`);

// ─── Eventos (y todo lo que cuelga de cada uno) ───
export const obtenerEventos = () => api.get("/panel/eventos");
export const obtenerEvento = (id) => api.get(`/panel/eventos/${id}`);
export const crearEvento = (evento) => api.post("/panel/eventos", evento);
export const actualizarEvento = (id, evento) => api.put(`/panel/eventos/${id}`, evento);
export const eliminarEvento = (id) => api.delete(`/panel/eventos/${id}`);
export const cambiarEstadoEvento = (id, estado) => api.patch(`/panel/eventos/${id}/estado`, { estado });
export const obtenerDisponibilidad = (id) => api.get(`/panel/eventos/${id}/disponibilidad`);
export const reemplazarEscenarios = (id, escenarios) => api.put(`/panel/eventos/${id}/escenarios`, { escenarios });

// tipo: "jornadas" | "presentaciones" | "tarifas"
export const crearParteEvento = (idEvento, tipo, datos) => api.post(`/panel/eventos/${idEvento}/${tipo}`, datos);
export const actualizarParteEvento = (idEvento, tipo, id, datos) => api.put(`/panel/eventos/${idEvento}/${tipo}/${id}`, datos);
export const eliminarParteEvento = (idEvento, tipo, id) => api.delete(`/panel/eventos/${idEvento}/${tipo}/${id}`);
