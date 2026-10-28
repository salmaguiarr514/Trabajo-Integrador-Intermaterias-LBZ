import { useEffect, useState } from "react";
import { AuthContext } from "./auth.js";
import { borrarToken, CLAVE_TOKEN, guardarToken, leerToken, onSesionExpirada } from "../services/api.js";
import * as authService from "../services/authService.js";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Si hay un token guardado, hay que validarlo antes de mostrar rutas protegidas
  const [cargando, setCargando] = useState(() => Boolean(leerToken()));

  useEffect(() => {
    onSesionExpirada(() => setUsuario(null));

    if (!leerToken()) return;
    authService
      .obtenerYo()
      .then(({ data }) => setUsuario(data))
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  // La sesión es una sola por navegador: si en otra pestaña se entra con otra cuenta o se sale,
  // esta se pone al día (si no, seguiría mostrando a la persona anterior con la sesión de la otra)
  useEffect(() => {
    const alCambiar = (ev) => {
      if (ev.key !== null && ev.key !== CLAVE_TOKEN) return;
      if (!leerToken()) {
        setUsuario(null);
        return;
      }
      authService
        .obtenerYo()
        .then(({ data }) => setUsuario(data))
        .catch(() => setUsuario(null));
    };
    addEventListener("storage", alCambiar);
    return () => removeEventListener("storage", alCambiar);
  }, []);

  const iniciarSesion = ({ token, usuario }) => {
    guardarToken(token);
    setUsuario(usuario);
    return usuario;
  };

  const login = async (email, password) => {
    const { data } = await authService.login(email, password);
    return iniciarSesion(data);
  };

  // El registro no inicia sesión: primero hay que verificar el email con el código que llega por mail
  const registro = async (datos) => {
    const { data } = await authService.registro(datos);
    return data;
  };

  const verificar = async (email, codigo) => {
    const { data } = await authService.verificar(email, codigo);
    return iniciarSesion(data);
  };

  const verificarEnlace = async (token) => {
    const { data } = await authService.verificarEnlace(token);
    return iniciarSesion(data);
  };

  // El enlace del mail de recuperación: contraseña nueva y sesión iniciada
  const restablecer = async (token, password) => {
    const { data } = await authService.restablecer(token, password);
    return iniciarSesion(data);
  };

  // Para reflejar cambios sin volver a loguearse (por ejemplo, el nombre de la productora)
  const actualizarUsuario = (cambios) => setUsuario((u) => ({ ...u, ...cambios }));

  const logout = () => {
    borrarToken();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, verificar, verificarEnlace, restablecer, actualizarUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
