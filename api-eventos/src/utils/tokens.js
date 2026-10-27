import jwt from "jsonwebtoken";
import { ErrorHttp } from "./ErrorHttp.js";

// Tokens JWT que no son la sesión: el QR de cada entrada y el enlace para verificar el email.
// Cada uno lleva su propósito ("t"), así un token de un tipo nunca sirve para otro.
// Se firman con su propia clave si está en el .env, o con JWT_SECRET.
const claveEntradas = () => process.env.ENTRADAS_SECRET || process.env.JWT_SECRET;
const claveVerificacion = () => process.env.VERIFICACION_SECRET || process.env.JWT_SECRET;

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ─── QR de la entrada ───────────────────────────────────────────────────────
// El QR es un JWT firmado con el código (UUID) de la entrada. Sin fecha de emisión: el mismo código
// da siempre el mismo QR (en la app, en el mail y si se reenvía). No vence: la entrada vale mientras
// la base diga que está válida, y cada ingreso queda registrado (RN-24).
export const firmarEntrada = (codigo) => jwt.sign({ t: "entrada", c: codigo }, claveEntradas(), { noTimestamp: true });

// Lo que llega a la puerta: el QR escaneado (un JWT) o el código escrito a mano (el UUID que se ve debajo del QR).
// Devuelve el código de la entrada y por dónde llegó. Un QR alterado o de otro sistema no pasa la firma.
export const leerEntrada = (texto) => {
  const limpio = texto.trim();
  if (ES_UUID.test(limpio.toLowerCase())) return { codigo: limpio.toLowerCase(), origen: "codigo" };
  try {
    const datos = jwt.verify(limpio, claveEntradas(), { algorithms: ["HS256"] });
    if (datos.t !== "entrada" || !ES_UUID.test(datos.c ?? "")) throw new Error("no es una entrada");
    return { codigo: datos.c, origen: "qr" };
  } catch {
    throw new ErrorHttp(400, "El QR no es de una entrada de Backstage o fue modificado");
  }
};

// ─── Enlace de verificación del email ───────────────────────────────────────
// Va en el mail del registro junto con el código de 6 números. jti = el código vigente:
// si se pide uno nuevo, el enlace anterior deja de servir; y una vez verificado el email, tampoco.
export const firmarVerificacion = (usuario, idCodigo, minutos) =>
  jwt.sign({ t: "verificar_email", sub: String(usuario.id_usuario), email: usuario.email }, claveVerificacion(), {
    jwtid: String(idCodigo),
    expiresIn: `${minutos}m`
  });

export const leerVerificacion = (token) => {
  try {
    const datos = jwt.verify(token, claveVerificacion(), { algorithms: ["HS256"] });
    if (datos.t !== "verificar_email") throw new Error("no es de verificación");
    return { id_usuario: Number(datos.sub), email: datos.email, id_codigo: Number(datos.jti) };
  } catch (error) {
    throw new ErrorHttp(400, error.name === "TokenExpiredError" ? "El enlace venció. Pedí un código nuevo" : "El enlace no es válido. Pedí un código nuevo");
  }
};
