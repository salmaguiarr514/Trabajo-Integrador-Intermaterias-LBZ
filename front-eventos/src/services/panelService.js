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
