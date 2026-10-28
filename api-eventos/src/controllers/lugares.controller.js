import pool, { enTransaccion } from "../data/db.js";
import { ErrorHttp } from "../utils/ErrorHttp.js";
import { actualizar, insertar } from "../utils/sql.js";
import { filtrosLugaresSchema } from "../schemas/lugares.schema.js";
import { obtenerPlano } from "../utils/plano.js";

// Lo usan el superadmin (/api/admin/lugares) y la productora (/api/panel/lugares).
// Lo que cambia es el alcance, que sale del usuario del token (docs/comun/dominio.md, RN-06 y RN-07):
//   superadmin → ve todos los lugares y modifica los de la plataforma (id_empresa NULL)
//   empresa    → ve los de la plataforma y los suyos, y modifica solo los suyos.
//                Un lugar propio de otra productora no existe para ella (404).

const COLUMNAS_LUGAR = ["nombre", "tipo", "direccion", "ciudad", "provincia", "imagen_url", "activo"];
const COLUMNAS_ESCENARIO = ["nombre", "descripcion"];
const COLUMNAS_ESPACIO = ["nombre", "modalidad", "capacidad", "color"];

// null = superadmin (sin filtro); un número = la productora del usuario
const empresaDe = (req) => (req.usuario.rol === "superadmin" ? null : req.usuario.id_empresa);

// v_lugares ya trae origen, capacidad_total, cantidad_espacios, cantidad_escenarios y tiene_plano.
// Los conteos de uso, para una productora, cuentan solo sus eventos: no se le muestra la actividad de las demás.
// $1 = id_empresa del usuario, o NULL para el superadmin.
const SELECT_LUGAR = `
  SELECT v.*, e.nombre AS productora,
         (SELECT COUNT(*) FROM eventos ev
           WHERE ev.id_lugar = v.id_lugar AND ($1::INT IS NULL OR ev.id_empresa = $1))::INT AS cantidad_eventos
  FROM v_lugares v
  LEFT JOIN empresas e ON e.id_empresa = v.id_empresa
  WHERE ($1::INT IS NULL OR v.id_empresa IS NULL OR v.id_empresa = $1)`;

const buscarLugar = async (req, id) => {
  const { rows } = await pool.query(`${SELECT_LUGAR} AND v.id_lugar = $2`, [empresaDe(req), id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Lugar no encontrado");
  }
  return rows[0];
};

// El lugar que se quiere modificar tiene que ser del usuario
const lugarEditable = async (req, id) => {
  const lugar = await buscarLugar(req, id);
  const idEmpresa = empresaDe(req);
  if (lugar.id_empresa !== idEmpresa) {
    throw new ErrorHttp(
      403,
      idEmpresa === null
        ? "Es un lugar propio de una productora: solo ella lo puede modificar"
        : "Es un lugar de la plataforma: lo puede usar en sus eventos, pero solo lo modifica el equipo de Backstage"
    );
  }
  return lugar;
};

const contar = async (sql, params) => (await pool.query(sql, params)).rows[0].cantidad;

// ?origen=plataforma | propio
// Primero van los que el usuario puede modificar: los de la plataforma para el superadmin, los propios para la productora.
export const obtenerLugares = async (req, res) => {
  const { origen } = filtrosLugaresSchema.parse(req.query);
  const { rows } = await pool.query(
    `${SELECT_LUGAR} AND ($2::TEXT IS NULL OR v.origen = $2)
     ORDER BY CASE WHEN $1::INT IS NULL THEN v.id_empresa IS NOT NULL ELSE v.id_empresa IS NULL END,
              v.provincia, v.nombre`,
    [empresaDe(req), origen ?? null]
  );
  res.json(rows);
};

export const obtenerLugar = async (req, res) => {
  const lugar = await buscarLugar(req, req.params.id);
  const params = [lugar.id_lugar, empresaDe(req)];
  const [escenarios, espacios, elementos] = await Promise.all([
    pool.query(
      `SELECT sc.*,
              (SELECT COUNT(*) FROM evento_escenarios ee JOIN eventos ev ON ev.id_evento = ee.id_evento
                WHERE ee.id_escenario = sc.id_escenario AND ($2::INT IS NULL OR ev.id_empresa = $2))::INT AS cantidad_eventos
       FROM escenarios sc WHERE sc.id_lugar = $1 ORDER BY sc.nombre`,
      params
    ),
    pool.query(
      `SELECT es.*,
              (SELECT COUNT(*) FROM tarifas t JOIN eventos ev ON ev.id_evento = t.id_evento
                WHERE t.id_espacio = es.id_espacio AND ($2::INT IS NULL OR ev.id_empresa = $2))::INT AS cantidad_tarifas
       FROM espacios es WHERE es.id_lugar = $1 ORDER BY es.capacidad DESC`,
      params
    ),
    pool.query("SELECT * FROM elementos_plano WHERE id_lugar = $1 ORDER BY id_elemento", [lugar.id_lugar])
  ]);
  res.json({ ...lugar, escenarios: escenarios.rows, espacios: espacios.rows, elementos: elementos.rows });
};

// Un lugar nuevo arranca con el sector "General" (con la capacidad enviada) y el escenario "Principal".
// Todo en una transacción. Es de la plataforma si lo crea el superadmin, o propio si lo crea una productora.
export const crearLugar = async (req, res) => {
  const { capacidad, ...datos } = req.body;
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const { texto, valores } = insertar("lugares", datos, COLUMNAS_LUGAR, { id_empresa: empresaDe(req) });
    const { rows } = await cliente.query(texto, valores);
    const id = rows[0].id_lugar;
    await cliente.query("INSERT INTO espacios (id_lugar, nombre, capacidad) VALUES ($1, 'General', $2)", [id, capacidad]);
    await cliente.query("INSERT INTO escenarios (id_lugar, nombre) VALUES ($1, 'Principal')", [id]);
    await cliente.query("COMMIT");
    res.status(201).json(await buscarLugar(req, id));
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
};

export const editarLugar = async (req, res) => {
  await lugarEditable(req, req.params.id);
  const consulta = actualizar("lugares", req.body, COLUMNAS_LUGAR, { id_lugar: req.params.id });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  res.json(await buscarLugar(req, req.params.id));
};

export const eliminarLugar = async (req, res) => {
  const lugar = await lugarEditable(req, req.params.id);
  const conEventos = await contar("SELECT COUNT(*)::INT AS cantidad FROM eventos WHERE id_lugar = $1", [lugar.id_lugar]);
  if (conEventos > 0) {
    throw new ErrorHttp(409, "El lugar tiene eventos: dalo de baja en lugar de eliminarlo");
  }
  await pool.query("DELETE FROM lugares WHERE id_lugar = $1", [lugar.id_lugar]);
  res.status(204).send();
};

// ─── Escenarios ─────────────────────────────────────────────────────────────
export const crearEscenario = async (req, res) => {
  await lugarEditable(req, req.params.id);
  const { texto, valores } = insertar("escenarios", req.body, COLUMNAS_ESCENARIO, { id_lugar: req.params.id });
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(rows[0]);
};

export const editarEscenario = async (req, res) => {
  await lugarEditable(req, req.params.id);
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
  await lugarEditable(req, req.params.id);
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
  await lugarEditable(req, req.params.id);
  const { texto, valores } = insertar("espacios", req.body, COLUMNAS_ESPACIO, { id_lugar: req.params.id });
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(rows[0]);
};

export const editarEspacio = async (req, res) => {
  await lugarEditable(req, req.params.id);
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
  const lugar = await lugarEditable(req, req.params.id);
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

// ─── Plano ──────────────────────────────────────────────────────────────────
// Guarda el plano completo (planoSchema): el tamaño del lienzo, la forma de cada sector y escenario dibujado
// y los elementos de referencia. Reemplaza lo que había, todo en una transacción.
export const guardarPlano = async (req, res) => {
  const lugar = await lugarEditable(req, req.params.id);
  const { ancho, alto, espacios, escenarios, elementos } = req.body;
  const id = lugar.id_lugar;

  await enTransaccion(async (cliente) => {
    await cliente.query("UPDATE lugares SET plano_ancho = $1, plano_alto = $2 WHERE id_lugar = $3", [ancho, alto, id]);
    // Cada sector y escenario que viene tiene que ser de este lugar; los que no vienen quedan sin dibujar
    for (const [tabla, columna, lista, nombre] of [
      ["espacios", "id_espacio", espacios, "sector"],
      ["escenarios", "id_escenario", escenarios, "escenario"]
    ]) {
      await cliente.query(`UPDATE ${tabla} SET geometria = NULL WHERE id_lugar = $1`, [id]);
      if (lista.length === 0) continue;
      const { rowCount } = await cliente.query(
        `UPDATE ${tabla} t SET geometria = v.geometria
         FROM jsonb_to_recordset($2::jsonb) AS v (${columna} INT, geometria JSONB)
         WHERE t.${columna} = v.${columna} AND t.id_lugar = $1`,
        [id, JSON.stringify(lista)]
      );
      if (rowCount !== new Set(lista.map((x) => x[columna])).size) {
        throw new ErrorHttp(400, `Hay un ${nombre} que no es de este lugar (o está repetido)`);
      }
    }
    await cliente.query("DELETE FROM elementos_plano WHERE id_lugar = $1", [id]);
    if (elementos.length > 0) {
      await cliente.query(
        `INSERT INTO elementos_plano (id_lugar, tipo, etiqueta, geometria)
         SELECT $1, v.tipo, v.etiqueta, v.geometria FROM jsonb_to_recordset($2::jsonb) AS v (tipo TEXT, etiqueta TEXT, geometria JSONB)`,
        [id, JSON.stringify(elementos)]
      );
    }
  });
  res.json(await obtenerPlano("l.id_lugar = $1", [id]));
};
