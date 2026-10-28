import api from "./api.js";

export const login = (email, password) => api.post("/auth/login", { email, password });

export const registro = (datos) => api.post("/auth/registro", datos);

export const verificar = (email, codigo) => api.post("/auth/verificar", { email, codigo });

// El botón "Verificar mi email" del mail: un token JWT de un solo uso
export const verificarEnlace = (token) => api.post("/auth/verificar-enlace", { token });

export const reenviarCodigo = (email) => api.post("/auth/reenviar-codigo", { email });

// "¿Olvidaste tu contraseña?": manda un enlace (JWT) para elegir una nueva
export const recuperar = (email) => api.post("/auth/recuperar", { email });
export const restablecer = (token, password) => api.post("/auth/restablecer", { token, password });

export const obtenerYo = () => api.get("/auth/yo");
