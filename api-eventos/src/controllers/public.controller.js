import pool from "../data/db.js";
import { ErrorHttp } from "../utils/ErrorHttp.js";
import { AHORA, hora } from "../utils/fechas.js";
import { filtrosCarteleraSchema } from "../schemas/cliente.schema.js";

// Sin login. Solo eventos publicados o agotados de productoras activas (v_cartelera).

// ?q=texto&ciudad=Córdoba&tipo=festival
export const obtenerCartelera = async (req, res) => {
  const { q, ciudad, tipo } = filtrosCarteleraSchema.parse(req.query);
  const texto = q ? `%${q}%` : null;
  const { rows } = await pool.query(
    `SELECT * FROM v_cartelera
     WHERE fecha_fin >= ${AHORA}::DATE
       AND ($1::TEXT IS NULL OR nombre ILIKE $1 OR headliners ILIKE $1 OR generos ILIKE $1 OR lugar ILIKE $1 OR productora ILIKE $1)
       AND ($2::TEXT IS NULL OR ciudad = $2)
       AND ($3::TEXT IS NULL OR tipo = $3)
     ORDER BY fecha_inicio`,
    [texto, ciudad ?? null, tipo ?? null]
  );
  res.json(rows);
};

// Ciudades con eventos en cartelera (para el filtro)
export const obtenerCiudades = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT ciudad FROM v_cartelera WHERE fecha_fin >= ${AHORA}::DATE ORDER BY ciudad`
  );
  res.json(rows.map((r) => r.ciudad));
};

// Detalle: jornadas, line-up y tarifas activas con su disponibilidad.
// disponibles: para una tarifa de un día, lo libre del sector ese día; para un abono, el mínimo de todos los días (RN-23).
export const obtenerEventoPublico = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, e.cargo_servicio_pct, l.direccion
     FROM v_cartelera c
     JOIN empresas e ON e.id_empresa = c.id_empresa
     JOIN lugares l  ON l.id_lugar = c.id_lugar
     WHERE c.id_evento = $1`,
    [req.params.id]
  );
  const evento = rows[0];
  if (!evento) {
    throw new ErrorHttp(404, "El evento no existe o no está publicado");
  }

  const id = evento.id_evento;
  const [jornadas, presentaciones, tarifas] = await Promise.all([
    pool.query(
      `SELECT id_jornada, fecha, to_char(hora_apertura, 'HH24:MI') AS hora_apertura, nombre
       FROM jornadas WHERE id_evento = $1 ORDER BY fecha`,
      [id]
    ),
    pool.query(
      `SELECT p.id_presentacion, p.id_jornada, p.headliner, ${hora("p.inicio")}, ${hora("p.fin")},
              a.id_artista, a.nombre AS artista, a.genero, sc.nombre AS escenario
       FROM presentaciones p
       JOIN artistas a    ON a.id_artista = p.id_artista
       JOIN escenarios sc ON sc.id_escenario = p.id_escenario
       WHERE p.id_evento = $1 ORDER BY p.inicio`,
      [id]
    ),
    pool.query(
      `SELECT t.id_tarifa, t.id_espacio, t.id_jornada, t.nombre, t.precio,
              ${hora("t.venta_desde")}, ${hora("t.venta_hasta")},
              es.nombre AS espacio, es.modalidad, es.color,
              CASE WHEN t.id_jornada IS NULL
                THEN (SELECT MIN(d.disponibles) FROM v_disponibilidad d WHERE d.id_evento = t.id_evento AND d.id_espacio = t.id_espacio)
                ELSE (SELECT d.disponibles FROM v_disponibilidad d
                       WHERE d.id_evento = t.id_evento AND d.id_espacio = t.id_espacio AND d.id_jornada = t.id_jornada)
              END::INT AS disponibles,
              (t.venta_desde IS NULL OR t.venta_desde <= ${AHORA})
                AND (t.venta_hasta IS NULL OR t.venta_hasta > ${AHORA}) AS en_venta
       FROM tarifas t
       JOIN espacios es ON es.id_espacio = t.id_espacio
       WHERE t.id_evento = $1 AND t.activa
       ORDER BY t.id_jornada NULLS LAST, es.capacidad DESC, t.precio`,
      [id]
    )
  ]);

  res.json({ ...evento, jornadas: jornadas.rows, presentaciones: presentaciones.rows, tarifas: tarifas.rows });
};
