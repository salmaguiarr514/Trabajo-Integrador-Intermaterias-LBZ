import { ErrorHttp } from "../utils/ErrorHttp.js";

// Se usa después de autenticar: permitir("superadmin"), permitir("empresa", "superadmin")...
export const permitir = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    throw new ErrorHttp(403, "No tenés permiso para esta acción");
  }
  next();
};
