import pool from "../../data/db.js";
import { actualizar } from "../../utils/sql.js";

// La productora del usuario logueado. El id sale del token, nunca del body ni de la URL.
const COLUMNAS = ["nombre", "email", "telefono", "direccion", "logo_url"];

const buscar = async (idEmpresa) => {
  const { rows } = await pool.query("SELECT * FROM empresas WHERE id_empresa = $1", [idEmpresa]);
  return rows[0];
};

export const obtenerMiEmpresa = async (req, res) => {
  res.json(await buscar(req.usuario.id_empresa));
};

export const editarMiEmpresa = async (req, res) => {
  const consulta = actualizar("empresas", req.body, COLUMNAS, { id_empresa: req.usuario.id_empresa });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  res.json(await buscar(req.usuario.id_empresa));
};
