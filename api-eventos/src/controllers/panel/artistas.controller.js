import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { actualizar, insertar } from "../../utils/sql.js";

// Artistas de la productora del usuario (RN-12). Todo filtra por req.usuario.id_empresa:
// un artista de otra productora responde 404, como si no existiera.

const COLUMNAS = ["nombre", "genero", "pais", "bio", "imagen_url", "activo"];

const SELECT_ARTISTA = `
  SELECT a.*,
         (SELECT COUNT(*) FROM presentaciones p WHERE p.id_artista = a.id_artista)::INT AS cantidad_presentaciones
  FROM artistas a
  WHERE a.id_empresa = $1`;

const buscarArtista = async (req, id) => {
  const { rows } = await pool.query(`${SELECT_ARTISTA} AND a.id_artista = $2`, [req.usuario.id_empresa, id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Artista no encontrado");
  }
  return rows[0];
};

export const obtenerArtistas = async (req, res) => {
  const { rows } = await pool.query(`${SELECT_ARTISTA} ORDER BY a.nombre`, [req.usuario.id_empresa]);
  res.json(rows);
};

export const obtenerArtista = async (req, res) => {
  res.json(await buscarArtista(req, req.params.id));
};

export const crearArtista = async (req, res) => {
  const { texto, valores } = insertar("artistas", req.body, COLUMNAS, { id_empresa: req.usuario.id_empresa });
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(await buscarArtista(req, rows[0].id_artista));
};

export const editarArtista = async (req, res) => {
  await buscarArtista(req, req.params.id);
  const donde = { id_artista: req.params.id, id_empresa: req.usuario.id_empresa };
  const consulta = actualizar("artistas", req.body, COLUMNAS, donde);
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  res.json(await buscarArtista(req, req.params.id));
};

// Un artista con presentaciones no se borra: se da de baja (activo = false), así el line-up no pierde datos
export const eliminarArtista = async (req, res) => {
  const artista = await buscarArtista(req, req.params.id);
  if (artista.cantidad_presentaciones > 0) {
    throw new ErrorHttp(409, "El artista tiene presentaciones en algún evento: dalo de baja en lugar de eliminarlo");
  }
  await pool.query("DELETE FROM artistas WHERE id_artista = $1 AND id_empresa = $2", [artista.id_artista, req.usuario.id_empresa]);
  res.status(204).send();
};
