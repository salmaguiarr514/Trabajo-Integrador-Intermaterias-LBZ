import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";

// Columnas que se pueden escribir desde el body (ya validado con zod)
const COLUMNAS = ["nombre", "cuit", "email", "telefono", "direccion", "logo_url", "cargo_servicio_pct", "activo"];

export const obtenerEmpresas = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM empresas ORDER BY id_empresa");
  res.json(rows);
};

export const obtenerEmpresa = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM empresas WHERE id_empresa = $1", [req.params.id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Empresa no encontrada");
  }
  res.json(rows[0]);
};

export const crearEmpresa = async (req, res) => {
  // Solo las columnas que vinieron: las demás toman el DEFAULT de la base
  const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
  const valores = columnas.map((c) => req.body[c]);
  const marcadores = columnas.map((_, i) => `$${i + 1}`);

  const { rows } = await pool.query(
    `INSERT INTO empresas (${columnas.join(", ")}) VALUES (${marcadores.join(", ")}) RETURNING *`,
    valores
  );
  res.status(201).json(rows[0]);
};

export const editarEmpresa = async (req, res) => {
  // Los campos que no vienen en el body mantienen su valor actual.
  // Los opcionales que vienen vacíos ("" o null) se guardan como NULL.
  const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
  if (columnas.length === 0) {
    return obtenerEmpresa(req, res);
  }

  const asignaciones = columnas.map((c, i) => `${c} = $${i + 1}`);
  const valores = columnas.map((c) => req.body[c]);

  const { rows } = await pool.query(
    `UPDATE empresas SET ${asignaciones.join(", ")} WHERE id_empresa = $${columnas.length + 1} RETURNING *`,
    [...valores, req.params.id]
  );
  if (!rows[0]) {
    throw new ErrorHttp(404, "Empresa no encontrada");
  }
  res.json(rows[0]);
};

// Solo se puede borrar una productora sin datos (usuarios, lugares, artistas, eventos).
// Si tiene, la base responde con un error de FK y manejarErrores devuelve 409:
// en ese caso se da de baja con activo = false (RN-04).
export const eliminarEmpresa = async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM empresas WHERE id_empresa = $1", [req.params.id]);
  if (rowCount === 0) {
    throw new ErrorHttp(404, "Empresa no encontrada");
  }
  res.status(204).send();
};
