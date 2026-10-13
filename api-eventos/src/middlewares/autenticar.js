import jwt from "jsonwebtoken";
import { ErrorHttp } from "../utils/ErrorHttp.js";

// Valida el header "Authorization: Bearer <token>" y deja en req.usuario
// { id_usuario, rol, id_empresa }. La sesión vive en el token (no hay estado
// en memoria), así que la API se puede replicar sin cambios.
export const autenticar = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");
  if (tipo !== "Bearer" || !token) {
    throw new ErrorHttp(401, "Tenés que iniciar sesión");
  }

  try {
    const { id_usuario, rol, id_empresa } = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id_usuario, rol, id_empresa };
    next();
  } catch {
    throw new ErrorHttp(401, "La sesión venció o no es válida");
  }
};

export const firmarToken = (usuario) =>
  jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol, id_empresa: usuario.id_empresa },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || "8h" }
  );
