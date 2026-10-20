import api from "./api.js";

// Sin login (/api/public): solo eventos publicados o agotados
export const obtenerCartelera = (filtros) => api.get("/public/eventos", { params: filtros });
export const obtenerCiudades = () => api.get("/public/ciudades");
export const obtenerEventoPublico = (id) => api.get(`/public/eventos/${id}`);
