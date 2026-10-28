import bcrypt from "bcryptjs";
import pool from "../data/db.js";
import { firmarToken } from "../middlewares/autenticar.js";
import { ErrorHttp } from "../utils/ErrorHttp.js";
import { enviarCodigo, enviarRecuperacion, MAX_INTENTOS, SEGUNDOS_ENTRE_ENVIOS } from "../utils/verificacion.js";
import { leerRestablecer, leerVerificacion } from "../utils/tokens.js";
import { configurado as correoConfigurado } from "../utils/correo.js";

// Si este servidor no tiene Gmail configurado, el mail no sale (queda en la consola de la API):
// el front lo avisa en vez de decir "te mandamos un código". No depende del email, así que no revela nada.
const estadoCorreo = () => (correoConfigurado ? "enviado" : "sin_configurar");

const SELECT_USUARIO = `
  SELECT u.*, e.nombre AS empresa, e.activo AS empresa_activa
  FROM usuarios u
  LEFT JOIN empresas e ON e.id_empresa = u.id_empresa`;

// Lo que se le devuelve al front: nunca el hash de la contraseña
const usuarioPublico = (u) => ({
  id_usuario: u.id_usuario,
  email: u.email,
  nombre: u.nombre,
  apellido: u.apellido,
  dni: u.dni,
  telefono: u.telefono,
  rol: u.rol,
  id_empresa: u.id_empresa,
  empresa: u.empresa ?? null
});

// Un usuario dado de baja, o de una productora dada de baja, no puede entrar
const verificarActivo = (u) => {
  if (!u.activo) {
    throw new ErrorHttp(403, "Tu usuario está dado de baja");
  }
  if (u.rol === "empresa" && !u.empresa_activa) {
    throw new ErrorHttp(403, "Tu productora está dada de baja");
  }
};

const buscarPorEmail = async (email) => {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.email = $1`, [email]);
  return rows[0];
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const usuario = await buscarPorEmail(email);

  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw new ErrorHttp(401, "Email o contraseña incorrectos");
  }
  verificarActivo(usuario);
  // El front usa "motivo" para llevarlo a la pantalla del código
  if (!usuario.email_verificado) {
    throw new ErrorHttp(403, "Tenés que verificar tu email con el código que te mandamos", { motivo: "email_no_verificado" });
  }

  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

// El cliente queda creado sin verificar y recibe un código por mail. Recién con
// POST /verificar obtiene el token. Si el mail falla, no se crea el usuario.
// Una cuenta que nunca se verificó no bloquea el email: registrarse de nuevo la actualiza con los datos
// nuevos (contraseña incluida) y manda otro código. Una verificada, o que no es de cliente, sí lo bloquea.
export const registro = async (req, res) => {
  const { email, password, nombre, apellido, dni, telefono } = req.body;
  const existente = await buscarPorEmail(email);
  if (existente && (existente.email_verificado || existente.rol !== "cliente")) {
    throw new ErrorHttp(409, "Ya hay una cuenta con ese email: ingresá con tu contraseña");
  }
  const hash = await bcrypt.hash(password, 10);
  const datos = [email, hash, nombre, apellido ?? null, dni ?? null, telefono ?? null];

  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const { rows } = existente
      ? await db.query(
          `UPDATE usuarios SET password_hash = $2, nombre = $3, apellido = $4, dni = $5, telefono = $6
           WHERE id_usuario = $7 AND email = $1 AND NOT email_verificado
           RETURNING *`,
          [...datos, existente.id_usuario]
        )
      : await db.query(
          `INSERT INTO usuarios (email, password_hash, nombre, apellido, dni, telefono, rol)
           VALUES ($1, $2, $3, $4, $5, $6, 'cliente')
           RETURNING *`,
          datos
        );
    if (!rows[0]) {
      throw new ErrorHttp(409, "Ya hay una cuenta con ese email: ingresá con tu contraseña");
    }
    try {
      await enviarCodigo(db, rows[0]);
    } catch (error) {
      console.error(error);
      throw new ErrorHttp(503, "No pudimos mandarte el mail con el código. Probá de nuevo en un rato");
    }
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }

  res.status(201).json({ mensaje: `Te mandamos un código y un enlace a ${email}`, email, correo: estadoCorreo() });
};

// Mismo error para email inexistente o ya verificado: no revela qué emails están registrados
const CODIGO_INVALIDO = "El código no es válido o venció. Pedí uno nuevo";

export const verificar = async (req, res) => {
  const { email, codigo } = req.body;
  const usuario = await buscarPorEmail(email);
  if (!usuario || usuario.email_verificado) {
    throw new ErrorHttp(400, CODIGO_INVALIDO);
  }

  const { rows } = await pool.query(
    "SELECT id_codigo, codigo_hash, intentos FROM codigos_verificacion WHERE id_usuario = $1 AND expira > NOW()",
    [usuario.id_usuario]
  );
  const vigente = rows[0];
  if (!vigente) {
    throw new ErrorHttp(400, CODIGO_INVALIDO);
  }
  if (vigente.intentos >= MAX_INTENTOS) {
    throw new ErrorHttp(429, "Hiciste demasiados intentos. Pedí un código nuevo");
  }
  if (!(await bcrypt.compare(codigo, vigente.codigo_hash))) {
    await pool.query("UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id_codigo = $1", [vigente.id_codigo]);
    const quedan = MAX_INTENTOS - vigente.intentos - 1;
    throw new ErrorHttp(400, quedan > 0 ? `Código incorrecto. Te quedan ${quedan} intentos` : "Código incorrecto. Pedí uno nuevo");
  }

  verificarActivo(usuario);
  await pool.query("UPDATE usuarios SET email_verificado = TRUE WHERE id_usuario = $1", [usuario.id_usuario]);
  await pool.query("DELETE FROM codigos_verificacion WHERE id_usuario = $1", [usuario.id_usuario]);

  // Queda logueado al verificar
  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

// El botón del mail: un JWT firmado por la API con el id del código vigente. Sirve una sola vez:
// si ya se verificó, o se pidió un código nuevo (otro id), el enlace deja de valer.
export const verificarEnlace = async (req, res) => {
  const datos = leerVerificacion(req.body.token);
  const usuario = await buscarPorEmail(datos.email);
  if (!usuario || usuario.id_usuario !== datos.id_usuario) {
    throw new ErrorHttp(400, "El enlace no es válido. Pedí un código nuevo");
  }
  if (usuario.email_verificado) {
    throw new ErrorHttp(409, "Tu email ya está verificado: ingresá con tu contraseña", { motivo: "ya_verificado" });
  }
  const { rows } = await pool.query(
    "SELECT 1 FROM codigos_verificacion WHERE id_codigo = $1 AND id_usuario = $2 AND expira > NOW()",
    [datos.id_codigo, usuario.id_usuario]
  );
  if (!rows[0]) {
    throw new ErrorHttp(400, "Ese enlace ya no sirve: pediste un código nuevo o venció. Usá el último mail");
  }

  verificarActivo(usuario);
  await pool.query("UPDATE usuarios SET email_verificado = TRUE WHERE id_usuario = $1", [usuario.id_usuario]);
  await pool.query("DELETE FROM codigos_verificacion WHERE id_usuario = $1", [usuario.id_usuario]);
  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

// Siempre responde lo mismo (no revela si el email existe). Un envío por minuto como máximo.
export const reenviarCodigo = async (req, res) => {
  const usuario = await buscarPorEmail(req.body.email);

  if (usuario && !usuario.email_verificado && usuario.activo) {
    const { rows } = await pool.query(
      `SELECT EXTRACT(EPOCH FROM (NOW() - MAX(fecha_creacion)))::int AS segundos
       FROM codigos_verificacion WHERE id_usuario = $1`,
      [usuario.id_usuario]
    );
    const segundos = rows[0].segundos;
    if (segundos !== null && segundos < SEGUNDOS_ENTRE_ENVIOS) {
      throw new ErrorHttp(429, `Esperá ${SEGUNDOS_ENTRE_ENVIOS - segundos} segundos para pedir otro código`);
    }
    try {
      await enviarCodigo(pool, usuario);
    } catch (error) {
      console.error(error);
      throw new ErrorHttp(503, "No pudimos mandarte el mail con el código. Probá de nuevo en un rato");
    }
  }

  res.json({ mensaje: "Si el email está registrado y sin verificar, te mandamos un código nuevo", correo: estadoCorreo() });
};

// "¿Olvidaste tu contraseña?": manda un enlace para elegir una nueva. Siempre responde lo mismo
// (no revela si el email existe). Sirve también para una cuenta que nunca verificó el email.
export const recuperar = async (req, res) => {
  const usuario = await buscarPorEmail(req.body.email);
  if (usuario?.activo) {
    try {
      await enviarRecuperacion(usuario);
    } catch (error) {
      console.error(error);
      throw new ErrorHttp(503, "No pudimos mandarte el mail. Probá de nuevo en un rato");
    }
  }
  res.json({ mensaje: "Si el email está registrado, te mandamos un enlace para elegir una contraseña nueva", correo: estadoCorreo() });
};

// El enlace del mail de recuperación (un JWT que deja de servir en cuanto cambia la contraseña).
// Cambia la contraseña, deja el email verificado (el enlace prueba que el mail es suyo) e inicia sesión.
export const restablecer = async (req, res) => {
  const datos = leerRestablecer(req.body.token);
  const usuario = await buscarPorEmail(datos.email);
  if (!usuario || !datos.vigente(usuario)) {
    throw new ErrorHttp(400, "Este enlace ya se usó o no es válido. Pedí uno nuevo");
  }
  verificarActivo(usuario);
  const hash = await bcrypt.hash(req.body.password, 10);
  await pool.query("UPDATE usuarios SET password_hash = $1, email_verificado = TRUE WHERE id_usuario = $2", [hash, usuario.id_usuario]);
  await pool.query("DELETE FROM codigos_verificacion WHERE id_usuario = $1", [usuario.id_usuario]);
  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

export const yo = async (req, res) => {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [req.usuario.id_usuario]);
  if (!rows[0]) {
    throw new ErrorHttp(401, "La sesión no es válida");
  }
  verificarActivo(rows[0]);
  res.json(usuarioPublico(rows[0]));
};
