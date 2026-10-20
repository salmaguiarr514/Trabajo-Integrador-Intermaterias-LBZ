import pool from "../data/db.js";
import { ErrorHttp } from "../utils/ErrorHttp.js";
import { AHORA, HOY, hora } from "../utils/sql.js";
import { filtrosCarteleraSchema } from "../schemas/cliente.schema.js";

// Lo que ve cualquiera, sin login (fase 6): solo eventos de v_cartelera (publicados o agotados,
// de productoras activas). Un evento en borrador o de otra forma no visible responde 404.

// Una tarifa está a la venta si está activa y dentro de su período (RN-25)
export const EN_VENTA = `t.activa
  AND (t.venta_desde IS NULL OR t.venta_desde <= ${AHORA})
  AND (t.venta_hasta IS NULL OR t.venta_hasta > ${AHORA})`;

// ?q busca en el nombre del evento y en los headliners; artista y género en todo el line-up
export const obtenerCartelera = async (req, res) => {
  const f = filtrosCarteleraSchema.parse(req.query);
  const { rows } = await pool.query(
    `SELECT c.* FROM v_cartelera c
     WHERE c.fecha_fin >= ${HOY}
       AND ($1::TEXT IS NULL OR c.nombre ILIKE '%' || $1 || '%' OR c.headliners ILIKE '%' || $1 || '%')
       AND ($2::TEXT IS NULL OR c.ciudad ILIKE $2)
       AND ($3::TEXT IS NULL OR c.provincia ILIKE $3)
       AND ($4::TEXT IS NULL OR c.tipo = $4)
       AND ($5::DATE IS NULL OR c.fecha_fin >= $5)
       AND ($6::DATE IS NULL OR c.fecha_inicio <= $6)
       AND ($7::TEXT IS NULL OR EXISTS (
             SELECT 1 FROM presentaciones p JOIN artistas a ON a.id_artista = p.id_artista
             WHERE p.id_evento = c.id_evento AND a.nombre ILIKE '%' || $7 || '%'))
       AND ($8::TEXT IS NULL OR EXISTS (
             SELECT 1 FROM presentaciones p JOIN artistas a ON a.id_artista = p.id_artista
             WHERE p.id_evento = c.id_evento AND a.genero ILIKE '%' || $8 || '%'))
     ORDER BY c.fecha_inicio, c.nombre`,
    [f.q ?? null, f.ciudad ?? null, f.provincia ?? null, f.tipo ?? null, f.desde ?? null, f.hasta ?? null, f.artista ?? null, f.genero ?? null]
  );
  res.json(rows);
};

// Detalle para la página del evento y el checkout: jornadas, grilla (escenario × horario),
// sectores con su plano y tarifas con disponibilidad. Un abono tiene la disponibilidad
// de su peor jornada, porque ocupa lugar en todas.
export const obtenerEventoPublico = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM v_cartelera WHERE id_evento = $1", [req.params.id]);
  const evento = rows[0];
  if (!evento) {
    throw new ErrorHttp(404, "Evento no encontrado");
  }
  const id = evento.id_evento;

  const [lugar, jornadas, escenarios, presentaciones, espacios, elementos, tarifas, disponibilidad] = await Promise.all([
    pool.query(
      `SELECT l.id_lugar, l.nombre, l.tipo, l.direccion, l.ciudad, l.provincia, l.imagen_url, l.plano_ancho, l.plano_alto
       FROM lugares l WHERE l.id_lugar = $1`,
      [evento.id_lugar]
    ),
    pool.query(
      `SELECT j.id_jornada, j.fecha, to_char(j.hora_apertura, 'HH24:MI') AS hora_apertura, j.nombre
       FROM jornadas j WHERE j.id_evento = $1 ORDER BY j.fecha`,
      [id]
    ),
    pool.query(
      `SELECT sc.id_escenario, sc.nombre, sc.descripcion, sc.geometria
       FROM evento_escenarios ee JOIN escenarios sc ON sc.id_escenario = ee.id_escenario
       WHERE ee.id_evento = $1 ORDER BY sc.nombre`,
      [id]
    ),
    pool.query(
      `SELECT p.id_presentacion, p.id_jornada, p.id_escenario, p.headliner, ${hora("p.inicio")}, ${hora("p.fin")},
              a.id_artista, a.nombre AS artista, a.genero, a.imagen_url AS artista_imagen_url
       FROM presentaciones p JOIN artistas a ON a.id_artista = p.id_artista
       WHERE p.id_evento = $1 ORDER BY p.inicio`,
      [id]
    ),
    // Solo los sectores que el evento vende (con alguna tarifa activa)
    pool.query(
      `SELECT es.id_espacio, es.nombre, es.modalidad, es.capacidad, es.color, es.geometria
       FROM espacios es
       WHERE es.id_lugar = $2 AND EXISTS (SELECT 1 FROM tarifas t WHERE t.id_evento = $1 AND t.id_espacio = es.id_espacio AND t.activa)
       ORDER BY es.capacidad DESC`,
      [id, evento.id_lugar]
    ),
    pool.query("SELECT id_elemento, tipo, etiqueta, geometria FROM elementos_plano WHERE id_lugar = $1", [evento.id_lugar]),
    pool.query(
      `SELECT t.id_tarifa, t.id_espacio, t.id_jornada, t.nombre, t.precio, ${hora("t.venta_desde")}, ${hora("t.venta_hasta")},
              es.nombre AS espacio, j.fecha AS fecha_jornada,
              (${EN_VENTA}) AS en_venta,
              (SELECT MIN(d.disponibles) FROM v_disponibilidad d
                WHERE d.id_evento = t.id_evento AND d.id_espacio = t.id_espacio
                  AND (t.id_jornada IS NULL OR d.id_jornada = t.id_jornada))::INT AS disponibles
       FROM tarifas t
       JOIN espacios es ON es.id_espacio = t.id_espacio
       LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
       WHERE t.id_evento = $1 AND t.activa
       ORDER BY es.capacidad DESC, j.fecha NULLS LAST, t.precio`,
      [id]
    ),
    pool.query(
      "SELECT id_jornada, fecha, id_espacio, espacio, capacidad, vendidas, disponibles FROM v_disponibilidad WHERE id_evento = $1 ORDER BY fecha, capacidad DESC",
      [id]
    )
  ]);

  res.json({
    ...evento,
    lugar: { ...lugar.rows[0], elementos_plano: elementos.rows },
    jornadas: jornadas.rows,
    escenarios: escenarios.rows,
    presentaciones: presentaciones.rows,
    espacios: espacios.rows,
    tarifas: tarifas.rows,
    disponibilidad: disponibilidad.rows
  });
};

// Solo se ve un artista que toca en algún evento de la cartelera
export const obtenerArtistaPublico = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.id_artista, a.nombre, a.genero, a.pais, a.bio, a.imagen_url
     FROM artistas a
     WHERE a.id_artista = $1 AND a.activo
       AND EXISTS (SELECT 1 FROM presentaciones p JOIN v_cartelera c ON c.id_evento = p.id_evento WHERE p.id_artista = a.id_artista)`,
    [req.params.id]
  );
  if (!rows[0]) {
    throw new ErrorHttp(404, "Artista no encontrado");
  }

  const { rows: presentaciones } = await pool.query(
    `SELECT p.id_presentacion, p.headliner, ${hora("p.inicio")}, ${hora("p.fin")}, j.fecha, sc.nombre AS escenario,
            c.id_evento, c.nombre AS evento, c.tipo, c.imagen_url, c.lugar, c.ciudad, c.provincia, c.productora
     FROM presentaciones p
     JOIN v_cartelera c ON c.id_evento = p.id_evento
     JOIN jornadas j    ON j.id_jornada = p.id_jornada
     JOIN escenarios sc ON sc.id_escenario = p.id_escenario
     WHERE p.id_artista = $1 AND j.fecha >= ${HOY}
     ORDER BY p.inicio`,
    [rows[0].id_artista]
  );
  res.json({ ...rows[0], proximas_presentaciones: presentaciones });
};
