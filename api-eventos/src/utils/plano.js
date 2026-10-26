import pool from "../data/db.js";

// Plano de un lugar (docs/programacion-2/plan-desarrollo.md, 2.2): el tamaño del lienzo y lo que tiene dibujado
// (sectores, escenarios y elementos de referencia), en una sola consulta. null si el lugar no tiene plano.
//   const plano = await obtenerPlano("l.id_lugar = $1", [idLugar]);
//   const plano = await obtenerPlano("l.id_lugar = (SELECT id_lugar FROM eventos WHERE id_evento = $1)", [idEvento]);
export const obtenerPlano = async (donde, params, db = pool) => {
  const { rows } = await db.query(
    `SELECT l.plano_ancho AS ancho, l.plano_alto AS alto,
            COALESCE((SELECT json_agg(json_build_object('id_espacio', es.id_espacio, 'nombre', es.nombre, 'color', es.color,
                                                        'capacidad', es.capacidad, 'geometria', es.geometria) ORDER BY es.capacidad DESC)
                      FROM espacios es WHERE es.id_lugar = l.id_lugar AND es.geometria IS NOT NULL), '[]') AS espacios,
            COALESCE((SELECT json_agg(json_build_object('id_escenario', sc.id_escenario, 'nombre', sc.nombre, 'geometria', sc.geometria) ORDER BY sc.nombre)
                      FROM escenarios sc WHERE sc.id_lugar = l.id_lugar AND sc.geometria IS NOT NULL), '[]') AS escenarios,
            COALESCE((SELECT json_agg(json_build_object('id_elemento', el.id_elemento, 'tipo', el.tipo, 'etiqueta', el.etiqueta, 'geometria', el.geometria) ORDER BY el.id_elemento)
                      FROM elementos_plano el WHERE el.id_lugar = l.id_lugar), '[]') AS elementos
     FROM lugares l
     WHERE ${donde} AND l.plano_ancho IS NOT NULL`,
    params
  );
  return rows[0] ?? null;
};
