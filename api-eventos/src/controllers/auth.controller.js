import bcrypt from "bcryptjs";
import pool from "../data/db.js";
import { firmarToken } from "../middlewares/autenticar.js";
import { ErrorHttp } from "../utils/ErrorHttp.js";

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

export const login = async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.email = $1`, [email]);
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw new ErrorHttp(401, "Email o contraseña incorrectos");
  }
  verificarActivo(usuario);

  res.json({ token: firmarToken(usuario), usuario: usuarioPublico(usuario) });
};

export const registro = async (req, res) => {
  const { email, password, nombre, apellido, dni, telefono } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (email, password_hash, nombre, apellido, dni, telefono, rol)
     VALUES ($1, $2, $3, $4, $5, $6, 'cliente')
     RETURNING *`,
    [email, hash, nombre, apellido ?? null, dni ?? null, telefono ?? null]
  );

  // Queda logueado al registrarse
  res.status(201).json({ token: firmarToken(rows[0]), usuario: usuarioPublico(rows[0]) });
};

export const yo = async (req, res) => {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [req.usuario.id_usuario]);
  if (!rows[0]) {
    throw new ErrorHttp(401, "La sesión no es válida");
  }
  verificarActivo(rows[0]);
  res.json(usuarioPublico(rows[0]));
};
