import api from "./api.js";

// Solo clientes (/api/cliente)
// items: [{ id_tarifa, cantidad }]
export const cotizar = (id_evento, items) => api.post("/cliente/compras/cotizar", { id_evento, items });
export const comprar = (compra) => api.post("/cliente/compras", compra);
export const obtenerCompras = () => api.get("/cliente/compras");
export const obtenerEntradas = () => api.get("/cliente/entradas");
export const actualizarPerfil = (datos) => api.put("/cliente/perfil", datos);
// Manda por mail las entradas válidas de un evento (al mail de la cuenta)
export const enviarEntradasPorMail = (id_evento) => api.post("/cliente/entradas/enviar", { id_evento });
