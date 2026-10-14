import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { filtrosEventosSchema } from "../../schemas/eventos.schema.js";

const SELECT_EVENTO = `
  SELECT ev.id_evento, ev.nombre, ev.tipo, ev.fecha_inicio, ev.fecha_fin, ev.estado, ev.fecha_creacion,
         ev.id_empresa, e.nombre AS productora, ev.id_lugar, l.nombre AS lugar, l.ciudad,
         (SELECT COUNT(*) FROM jornadas j WHERE j.id_evento = ev.id_evento)::INT AS cantidad_jornadas,
         (SELECT COUNT(*) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
           WHERE en.id_evento = ev.id_evento AND en.estado = 'valida' AND c.estado = 'pagada')::INT AS entradas_vendidas,
         (SELECT COALESCE(SUM(c.total), 0) FROM compras c
           WHERE c.id_evento = ev.id_evento AND c.estado = 'pagada') AS recaudado
  FROM eventos ev
  JOIN empresas e ON e.id_empresa = ev.id_empresa
  JOIN lugares  l ON l.id_lugar = ev.id_lugar`;

export const obtenerEventos = async (req, res) => {
  const { estado, id_empresa } = filtrosEventosSchema.parse(req.query);
  const { rows } = await pool.query(
    `${SELECT_EVENTO}
     WHERE ($1::TEXT IS NULL OR ev.estado = $1)
       AND ($2::INT IS NULL OR ev.id_empresa = $2)
     ORDER BY ev.fecha_inicio`,
    [estado ?? null, id_empresa ?? null]
  );
  res.json(rows);
};

// Moderación:
//   borrador  → despublicar: sale de la cartelera y la productora lo puede corregir y volver a publicar
//   cancelado → cancelar: no tiene vuelta atrás
export const cambiarEstadoEvento = async (req, res) => {
  const { estado } = req.body;
  const { rows } = await pool.query("SELECT estado FROM eventos WHERE id_evento = $1", [req.params.id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Evento no encontrado");
  }

  const actual = rows[0].estado;
  if (["cancelado", "finalizado"].includes(actual)) {
    throw new ErrorHttp(409, `El evento ya está ${actual}: no se puede cambiar`);
  }
  if (estado === "borrador" && !["publicado", "agotado"].includes(actual)) {
    throw new ErrorHttp(409, "Solo se puede despublicar un evento publicado o agotado");
  }

  await pool.query("UPDATE eventos SET estado = $1 WHERE id_evento = $2", [estado, req.params.id]);
  const actualizado = await pool.query(`${SELECT_EVENTO} WHERE ev.id_evento = $1`, [req.params.id]);
  res.json(actualizado.rows[0]);
};
