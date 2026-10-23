import api from "./api.js";

// Sin login (/api/public): solo eventos publicados o agotados
export const obtenerCartelera = (filtros) => api.get("/public/eventos", { params: filtros });
export const obtenerCiudades = () => api.get("/public/ciudades");

// El detalle se pide por adelantado al pasar el mouse (o llegar con Tab) por la tarjeta de la cartelera,
// así al hacer clic ya viene en camino. Cada pedido adelantado se usa una sola vez y dura 15 s,
// para no mostrar una disponibilidad vieja.
const adelantados = new Map();
export const obtenerEventoPublico = (id) => {
  const previo = adelantados.get(String(id));
  adelantados.delete(String(id));
  if (previo && Date.now() - previo.cuando < 15_000) return previo.pedido;
  return api.get(`/public/eventos/${id}`);
};
export const adelantarEvento = (id) => {
  if (adelantados.has(String(id))) return;
  const pedido = api.get(`/public/eventos/${id}`);
  pedido.catch(() => adelantados.delete(String(id)));
  adelantados.set(String(id), { pedido, cuando: Date.now() });
};
