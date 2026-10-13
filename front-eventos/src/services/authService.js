import api from "./api.js";

export const login = (email, password) => api.post("/auth/login", { email, password });

export const registro = (datos) => api.post("/auth/registro", datos);

export const obtenerYo = () => api.get("/auth/yo");
