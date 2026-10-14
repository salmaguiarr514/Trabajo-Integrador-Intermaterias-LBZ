import api from "./api.js";

// Solo superadmin (/api/admin). Las productoras están en empresasService.js.

// ─── Usuarios ───
export const obtenerUsuarios = (filtros) => api.get("/admin/usuarios", { params: filtros });
export const crearUsuario = (usuario) => api.post("/admin/usuarios", usuario);
export const actualizarUsuario = (id, usuario) => api.put(`/admin/usuarios/${id}`, usuario);

// ─── Lugares, escenarios y sectores ───
export const obtenerLugares = (filtros) => api.get("/admin/lugares", { params: filtros });
export const obtenerLugar = (id) => api.get(`/admin/lugares/${id}`);
export const crearLugar = (lugar) => api.post("/admin/lugares", lugar);
export const actualizarLugar = (id, lugar) => api.put(`/admin/lugares/${id}`, lugar);
export const eliminarLugar = (id) => api.delete(`/admin/lugares/${id}`);

// tipo: "escenarios" | "espacios"
export const crearParteLugar = (idLugar, tipo, datos) => api.post(`/admin/lugares/${idLugar}/${tipo}`, datos);
export const actualizarParteLugar = (idLugar, tipo, id, datos) => api.put(`/admin/lugares/${idLugar}/${tipo}/${id}`, datos);
export const eliminarParteLugar = (idLugar, tipo, id) => api.delete(`/admin/lugares/${idLugar}/${tipo}/${id}`);

// ─── Artistas, eventos y métricas ───
export const obtenerArtistas = (filtros) => api.get("/admin/artistas", { params: filtros });
export const obtenerEventos = (filtros) => api.get("/admin/eventos", { params: filtros });
export const cambiarEstadoEvento = (id, estado) => api.patch(`/admin/eventos/${id}/estado`, { estado });
export const obtenerMetricas = () => api.get("/admin/metricas");
