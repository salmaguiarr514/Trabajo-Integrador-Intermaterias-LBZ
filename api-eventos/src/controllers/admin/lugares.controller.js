import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { actualizar, insertar } from "../../utils/sql.js";
import { filtrosLugaresSchema } from "../../schemas/lugares.schema.js";

// El superadmin ve todos los lugares, pero solo modifica los de la plataforma (id_empresa NULL).
// Los propios son de cada productora: los ve, no los toca (matriz de permisos del plan).

const COLUMNAS_LUGAR = ["nombre", "tipo", "direccion", "ciudad", "provincia", "imagen_url", "activo"];
const COLUMNAS_ESCENARIO = ["nombre", "descripcion"];
const COLUMNAS_ESPACIO = ["nombre", "modalidad", "capacidad", "color"];

// v_lugares ya trae origen, capacidad_total, cantidad_espacios, cantidad_escenarios y tiene_plano
const SELECT_LUGAR = `
  SELECT v.*, e.nombre AS productora,
         (SELECT COUNT(*) FROM eventos ev WHERE ev.id_lugar = v.id_lugar)::INT AS cantidad_eventos
  FROM v_lugares v
  LEFT JOIN empresas e ON e.id_empresa = v.id_empresa`;

const buscarLugar = async (id) => {
  const { rows } = await pool.query(`${SELECT_LUGAR} WHERE v.id_lugar = $1`, [id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Lugar no encontrado");
  }
  return rows[0];
};

const lugarDePlataforma = async (id) => {
  const lugar = await buscarLugar(id);
  if (lugar.origen !== "plataforma") {
    throw new ErrorHttp(403, "Es un lugar propio de una productora: solo ella lo puede modificar");
  }
  return lugar;
};

const contar = async (sql, params) => (await pool.query(sql, params)).rows[0].cantidad;

export const obtenerLugares = async (req, res) => {
  const { origen } = filtrosLugaresSchema.parse(req.query);
  const { rows } = await pool.query(
    `${SELECT_LUGAR}
     WHERE ($1::TEXT IS NULL OR v.origen = $1)
     ORDER BY v.origen, v.provincia, v.nombre`,
    [origen ?? null]
  );
  res.json(rows);
};

export const obtenerLugar = async (req, res) => {
  const lugar = await buscarLugar(req.params.id);
  const [escenarios, espacios] = await Promise.all([
    pool.query(
      `SELECT sc.*, (SELECT COUNT(*) FROM evento_escenarios ee WHERE ee.id_escenario = sc.id_escenario)::INT AS cantidad_eventos
       FROM escenarios sc WHERE sc.id_lugar = $1 ORDER BY sc.nombre`,
      [lugar.id_lugar]
    ),
    pool.query(
      `SELECT es.*, (SELECT COUNT(*) FROM tarifas t WHERE t.id_espacio = es.id_espacio)::INT AS cantidad_tarifas
       FROM espacios es WHERE es.id_lugar = $1 ORDER BY es.capacidad DESC`,
      [lugar.id_lugar]
    )
  ]);
  res.json({ ...lugar, escenarios: escenarios.rows, espacios: espacios.rows });
};

// Un lugar nuevo de la plataforma arranca con el sector "General" (con la capacidad enviada)
// y el escenario "Principal". Todo en una transacción.
export const crearLugar = async (req, res) => {
  const { capacidad, ...datos } = req.body;
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const { texto, valores } = insertar("lugares", datos, COLUMNAS_LUGAR);
    const { rows } = await cliente.query(texto, valores);
    const id = rows[0].id_lugar;
    await cliente.query("INSERT INTO espacios (id_lugar, nombre, capacidad) VALUES ($1, 'General', $2)", [id, capacidad]);
    await cliente.query("INSERT INTO escenarios (id_lugar, nombre) VALUES ($1, 'Principal')", [id]);
    await cliente.query("COMMIT");
    res.status(201).json(await buscarLugar(id));
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
};

export const editarLugar = async (req, res) => {
  await lugarDePlataforma(req.params.id);
  const consulta = actualizar("lugares", req.body, COLUMNAS_LUGAR, { id_lugar: req.params.id });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  res.json(await buscarLugar(req.params.id));
};

export const eliminarLugar = async (req, res) => {
  const lugar = await lugarDePlataforma(req.params.id);
  if (lugar.cantidad_eventos > 0) {
    throw new ErrorHttp(409, "El lugar tiene eventos: dalo de baja en lugar de eliminarlo");
  }
  await pool.query("DELETE FROM lugares WHERE id_lugar = $1", [lugar.id_lugar]);
  res.status(204).send();
};

// ─── Escenarios ─────────────────────────────────────────────────────────────
export const crearEscenario = async (req, res) => {
  await lugarDePlataforma(req.params.id);
  const { texto, valores } = insertar("escenarios", req.body, COLUMNAS_ESCENARIO, { id_lugar: req.params.id });
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(rows[0]);
};

export const editarEscenario = async (req, res) => {
  await lugarDePlataforma(req.params.id);
  const donde = { id_escenario: req.params.idHijo, id_lugar: req.params.id };
  const consulta = actualizar("escenarios", req.body, COLUMNAS_ESCENARIO, donde);
  const { rows } = consulta
    ? await pool.query(consulta.texto, consulta.valores)
    : await pool.query("SELECT * FROM escenarios WHERE id_escenario = $1 AND id_lugar = $2", Object.values(donde));
  if (!rows[0]) {
    throw new ErrorHttp(404, "Escenario no encontrado");
  }
  res.json(rows[0]);
};

export const eliminarEscenario = async (req, res) => {
  await lugarDePlataforma(req.params.id);
  const enUso = await contar(
    "SELECT COUNT(*)::INT AS cantidad FROM evento_escenarios WHERE id_escenario = $1",
    [req.params.idHijo]
  );
  if (enUso > 0) {
    throw new ErrorHttp(409, "El escenario está habilitado en algún evento: no se puede eliminar");
  }
  const { rowCount } = await pool.query(
    "DELETE FROM escenarios WHERE id_escenario = $1 AND id_lugar = $2",
    [req.params.idHijo, req.params.id]
  );
  if (rowCount === 0) {
    throw new ErrorHttp(404, "Escenario no encontrado");
  }
  res.status(204).send();
};

// ─── Espacios (sectores) ────────────────────────────────────────────────────
export const crearEspacio = async (req, res) => {
  await lugarDePlataforma(req.params.id);
  const { texto, valores } = insertar("espacios", req.body, COLUMNAS_ESPACIO, { id_lugar: req.params.id });
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(rows[0]);
};

export const editarEspacio = async (req, res) => {
  await lugarDePlataforma(req.params.id);
  const donde = { id_espacio: req.params.idHijo, id_lugar: req.params.id };
  const consulta = actualizar("espacios", req.body, COLUMNAS_ESPACIO, donde);
  const { rows } = consulta
    ? await pool.query(consulta.texto, consulta.valores)
    : await pool.query("SELECT * FROM espacios WHERE id_espacio = $1 AND id_lugar = $2", Object.values(donde));
  if (!rows[0]) {
    throw new ErrorHttp(404, "Sector no encontrado");
  }
  res.json(rows[0]);
};

export const eliminarEspacio = async (req, res) => {
  const lugar = await lugarDePlataforma(req.params.id);
  if (lugar.cantidad_espacios <= 1) {
    throw new ErrorHttp(409, "Un lugar necesita al menos un sector: agregá otro antes de eliminar este");
  }
  const conTarifas = await contar("SELECT COUNT(*)::INT AS cantidad FROM tarifas WHERE id_espacio = $1", [req.params.idHijo]);
  if (conTarifas > 0) {
    throw new ErrorHttp(409, "El sector tiene tarifas en algún evento: no se puede eliminar");
  }
  const { rowCount } = await pool.query(
    "DELETE FROM espacios WHERE id_espacio = $1 AND id_lugar = $2",
    [req.params.idHijo, req.params.id]
  );
  if (rowCount === 0) {
    throw new ErrorHttp(404, "Sector no encontrado");
  }
  res.status(204).send();
};
