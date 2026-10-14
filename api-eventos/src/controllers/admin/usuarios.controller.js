import bcrypt from "bcryptjs";
import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { filtrosUsuariosSchema } from "../../schemas/usuarios.schema.js";

// Nunca se devuelve el hash de la contraseña
const SELECT_USUARIO = `
  SELECT u.id_usuario, u.email, u.nombre, u.apellido, u.dni, u.telefono, u.rol,
         u.id_empresa, u.activo, u.fecha_creacion, e.nombre AS empresa
  FROM usuarios u
  LEFT JOIN empresas e ON e.id_empresa = u.id_empresa`;

const COLUMNAS = ["email", "nombre", "apellido", "dni", "telefono", "rol", "id_empresa", "activo"];

const buscarUsuario = async (id) => {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Usuario no encontrado");
  }
  return rows[0];
};

export const obtenerUsuarios = async (req, res) => {
  const { rol, id_empresa } = filtrosUsuariosSchema.parse(req.query);
  const { rows } = await pool.query(
    `${SELECT_USUARIO}
     WHERE ($1::TEXT IS NULL OR u.rol = $1)
       AND ($2::INT IS NULL OR u.id_empresa = $2)
     ORDER BY u.fecha_creacion DESC`,
    [rol ?? null, id_empresa ?? null]
  );
  res.json(rows);
};

export const obtenerUsuario = async (req, res) => {
  res.json(await buscarUsuario(req.params.id));
};

export const crearUsuario = async (req, res) => {
  const { password, ...datos } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const columnas = COLUMNAS.filter((c) => datos[c] !== undefined);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (${columnas.join(", ")}, password_hash)
     VALUES (${columnas.map((_, i) => `$${i + 1}`).join(", ")}, $${columnas.length + 1})
     RETURNING id_usuario`,
    [...columnas.map((c) => datos[c]), hash]
  );
  res.status(201).json(await buscarUsuario(rows[0].id_usuario));
};

export const editarUsuario = async (req, res) => {
  const id = req.params.id;
  const actual = await buscarUsuario(id);
  const { password, ...datos } = req.body;

  // De un cliente solo se cambia si está activo: sus datos los edita él desde su perfil
  if (actual.rol === "cliente" && Object.keys(datos).some((c) => c !== "activo")) {
    throw new ErrorHttp(400, "Los datos de un cliente los edita el cliente. Desde acá solo se puede activar o desactivar.");
  }
  // Para no quedarse afuera del panel
  if (id === req.usuario.id_usuario && (datos.activo === false || (datos.rol && datos.rol !== "superadmin"))) {
    throw new ErrorHttp(400, "No podés darte de baja ni quitarte el rol de superadmin a vos mismo");
  }
  // Si cambia a superadmin, deja de pertenecer a una productora
  if (datos.rol === "superadmin") {
    datos.id_empresa = null;
  }

  const columnas = COLUMNAS.filter((c) => datos[c] !== undefined);
  const valores = columnas.map((c) => datos[c]);
  if (password) {
    columnas.push("password_hash");
    valores.push(await bcrypt.hash(password, 10));
  }
  if (columnas.length > 0) {
    await pool.query(
      `UPDATE usuarios SET ${columnas.map((c, i) => `${c} = $${i + 1}`).join(", ")}
       WHERE id_usuario = $${columnas.length + 1}`,
      [...valores, id]
    );
  }
  res.json(await buscarUsuario(id));
};

// Los usuarios no se borran (tienen compras e historial): se dan de baja con activo = false.
