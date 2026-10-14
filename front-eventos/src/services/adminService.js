import api from "./api.js";

// Solo superadmin (/api/admin). Las productoras están en empresasService.js.

// ─── Usuarios ───
export const obtenerUsuarios = (filtros) => api.get("/admin/usuarios", { params: filtros });
export const crearUsuario = (usuario) => api.post("/admin/usuarios", usuario);
export const actualizarUsuario = (id, usuario) => api.put(`/admin/usuarios/${id}`, usuario);

// Lugares: en lugaresService.js (lo comparten superadmin y productora)

// ─── Artistas, eventos y métricas ───
export const obtenerArtistas = (filtros) => api.get("/admin/artistas", { params: filtros });
export const obtenerEventos = (filtros) => api.get("/admin/eventos", { params: filtros });
export const cambiarEstadoEvento = (id, estado) => api.patch(`/admin/eventos/${id}/estado`, { estado });
export const obtenerMetricas = () => api.get("/admin/metricas");
