import axios from "axios";

export const CLAVE_TOKEN = "backstage_token";

export const leerToken = () => localStorage.getItem(CLAVE_TOKEN);
export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token);
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN);

// Lo registra AuthContext: qué hacer cuando la API dice que la sesión venció
let alExpirarSesion = () => {};
export const onSesionExpirada = (fn) => {
  alExpirarSesion = fn;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Cada pedido lleva el token, si hay sesión
api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si la API responde 401 con un token guardado, la sesión venció: se cierra
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && leerToken()) {
      borrarToken();
      alExpirarSesion();
    }
    return Promise.reject(error);
  }
);

// Mensaje de error para mostrar: el que manda la API o uno por defecto
export const mensajeDeError = (error, porDefecto) =>
  error.response?.data?.mensaje ?? (error.response ? porDefecto : "No se pudo conectar con la API");

// Errores por campo que manda la API al validar ({ campo: mensaje })
export const erroresPorCampo = (error) =>
  Object.fromEntries((error.response?.data?.errores ?? []).map((e) => [e.campo, e.mensaje]));

export default api;
