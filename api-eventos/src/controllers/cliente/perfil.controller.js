import bcrypt from "bcryptjs";
import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { actualizar } from "../../utils/sql.js";

const COLUMNAS = ["nombre", "apellido", "dni", "telefono"];

// Mismos campos que devuelve /api/auth/yo: nunca el hash de la contraseña
const SELECT_PERFIL = `
  SELECT id_usuario, email, nombre, apellido, dni, telefono, rol, id_empresa, NULL AS empresa
  FROM usuarios WHERE id_usuario = $1`;

const buscarPerfil = async (id) => (await pool.query(SELECT_PERFIL, [id])).rows[0];

export const obtenerPerfil = async (req, res) => {
  res.json(await buscarPerfil(req.usuario.id_usuario));
};

export const editarPerfil = async (req, res) => {
  const id = req.usuario.id_usuario;
  const { password_actual, password_nueva, ...datos } = req.body;
  const cambios = { ...datos };

  if (password_nueva !== undefined) {
    const { rows } = await pool.query("SELECT password_hash FROM usuarios WHERE id_usuario = $1", [id]);
    // 400 y no 401: un 401 haría que el front cierre la sesión
    if (!(await bcrypt.compare(password_actual, rows[0].password_hash))) {
      throw new ErrorHttp(400, "La contraseña actual no es correcta");
    }
    cambios.password_hash = await bcrypt.hash(password_nueva, 10);
  }

  const consulta = actualizar("usuarios", cambios, [...COLUMNAS, "password_hash"], { id_usuario: id });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  res.json(await buscarPerfil(id));
};
