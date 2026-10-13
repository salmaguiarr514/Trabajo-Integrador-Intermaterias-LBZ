import api from "./api.js";

// Solo superadmin
export const obtenerEmpresas = () => api.get("/admin/empresas");

export const obtenerEmpresa = (id) => api.get(`/admin/empresas/${id}`);

export const crearEmpresa = (empresa) => api.post("/admin/empresas", empresa);

export const actualizarEmpresa = (id, empresa) =>
  api.put(`/admin/empresas/${id}`, empresa);

export const eliminarEmpresa = (id) => api.delete(`/admin/empresas/${id}`);
