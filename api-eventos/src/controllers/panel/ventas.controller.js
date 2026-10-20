import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { AHORA, hora } from "../../utils/fechas.js";

// Fase 7: ventas de un evento y control de acceso en la puerta. Todo de la productora del usuario.

const fechaCorta = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// Una entrada "vendida" es válida y de una compra pagada (como en v_disponibilidad y v_asistencia)
const VENDIDA = "en.estado = 'valida' AND c.estado = 'pagada'";

export const obtenerVentasEvento = async (req, res) => {
  const { rows: eventos } = await pool.query(
    "SELECT id_evento, nombre, estado FROM eventos WHERE id_evento = $1 AND id_empresa = $2",
    [req.params.id, req.usuario.id_empresa]
  );
  if (!eventos[0]) {
    throw new ErrorHttp(404, "Evento no encontrado");
  }
  const id = eventos[0].id_evento;

  const [totales, porTarifa, ocupacion, asistencia, porDia, ultimas] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE estado = 'pagada')::INT                    AS compras,
         COUNT(*) FILTER (WHERE estado = 'rechazada')::INT                 AS rechazadas,
         COALESCE(SUM(subtotal)       FILTER (WHERE estado = 'pagada'), 0) AS subtotal,
         COALESCE(SUM(cargo_servicio) FILTER (WHERE estado = 'pagada'), 0) AS service_charge,
         COALESCE(SUM(total)          FILTER (WHERE estado = 'pagada'), 0) AS total,
         (SELECT COUNT(*) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
           WHERE en.id_evento = $1 AND ${VENDIDA})::INT                    AS entradas
       FROM compras WHERE id_evento = $1`,
      [id]
    ),
    pool.query(
      `SELECT t.id_tarifa, t.nombre, t.precio, t.activa, t.id_jornada, j.fecha, es.nombre AS espacio,
              (SELECT COUNT(*) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
                WHERE en.id_tarifa = t.id_tarifa AND ${VENDIDA})::INT AS vendidas,
              (SELECT COALESCE(SUM(en.precio_pagado), 0) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
                WHERE en.id_tarifa = t.id_tarifa AND ${VENDIDA}) AS importe
       FROM tarifas t
       JOIN espacios es ON es.id_espacio = t.id_espacio
       LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
       WHERE t.id_evento = $1
       ORDER BY j.fecha NULLS LAST, es.capacidad DESC, t.precio`,
      [id]
    ),
    pool.query("SELECT * FROM v_disponibilidad WHERE id_evento = $1 ORDER BY fecha, capacidad DESC", [id]),
    pool.query("SELECT * FROM v_asistencia WHERE id_evento = $1 ORDER BY fecha", [id]),
    // Ventas por día de compra (hora de Argentina)
    pool.query(
      `SELECT c.fecha::DATE AS dia, COUNT(DISTINCT c.id_compra)::INT AS compras, COUNT(en.id_entrada)::INT AS entradas,
              COALESCE(SUM(en.precio_pagado), 0) AS importe
       FROM compras c JOIN entradas en ON en.id_compra = c.id_compra
       WHERE c.id_evento = $1 AND ${VENDIDA}
       GROUP BY c.fecha::DATE ORDER BY dia`,
      [id]
    ),
    // Sin datos del comprador: qué, cuándo, cómo y por cuánto
    pool.query(
      `SELECT c.id_compra, ${hora("c.fecha")}, c.subtotal, c.medio_pago, c.estado,
              (SELECT COUNT(*) FROM entradas en WHERE en.id_compra = c.id_compra)::INT AS cantidad
       FROM compras c WHERE c.id_evento = $1
       ORDER BY c.fecha DESC LIMIT 20`,
      [id]
    )
  ]);

  res.json({
    evento: eventos[0],
    ...totales.rows[0],
    por_tarifa: porTarifa.rows,
    ocupacion: ocupacion.rows,
    asistencia: asistencia.rows,
    por_dia: porDia.rows,
    ultimas_compras: ultimas.rows
  });
};

// Control de acceso (RN-24): una entrada de un día entra una vez, en su jornada; un abono, una vez por jornada.
// La base lo garantiza (trigger ingresos_validos y UNIQUE (id_entrada, id_jornada)); acá se arman mensajes
// claros para la persona de la puerta antes de intentar el ingreso.
export const validarEntrada = async (req, res) => {
  const { codigo, id_jornada } = req.body;

  const { rows: jornadas } = await pool.query(
    `SELECT j.id_jornada, j.fecha, j.id_evento, ev.nombre AS evento
     FROM jornadas j JOIN eventos ev ON ev.id_evento = j.id_evento
     WHERE j.id_jornada = $1 AND ev.id_empresa = $2`,
    [id_jornada, req.usuario.id_empresa]
  );
  const jornada = jornadas[0];
  if (!jornada) {
    throw new ErrorHttp(404, "Esa jornada no es de tus eventos");
  }

  const { rows: entradas } = await pool.query(
    `SELECT en.id_entrada, en.estado, en.id_evento, c.estado AS estado_compra, ev.id_empresa, ev.nombre AS evento,
            t.id_jornada AS jornada_tarifa, t.nombre AS tarifa, es.nombre AS espacio, jt.fecha AS fecha_tarifa,
            u.nombre, u.apellido,
            (SELECT to_char(i.fecha_hora, 'HH24:MI') FROM ingresos i
              WHERE i.id_entrada = en.id_entrada AND i.id_jornada = $2) AS ya_ingreso
     FROM entradas en
     JOIN compras c   ON c.id_compra = en.id_compra
     JOIN usuarios u  ON u.id_usuario = c.id_usuario
     JOIN eventos ev  ON ev.id_evento = en.id_evento
     JOIN tarifas t   ON t.id_tarifa = en.id_tarifa
     JOIN espacios es ON es.id_espacio = t.id_espacio
     LEFT JOIN jornadas jt ON jt.id_jornada = t.id_jornada
     WHERE en.codigo = $1`,
    [codigo, id_jornada]
  );
  const e = entradas[0];

  // Una entrada de otra productora "no existe" para esta (no se revela de quién es)
  if (!e || e.id_empresa !== req.usuario.id_empresa) {
    throw new ErrorHttp(404, "No es una entrada válida de tus eventos");
  }
  if (e.id_evento !== jornada.id_evento) {
    throw new ErrorHttp(409, `Es una entrada de otro evento: ${e.evento}`);
  }
  if (e.estado !== "valida" || e.estado_compra !== "pagada") {
    throw new ErrorHttp(409, "La entrada está anulada");
  }
  if (e.jornada_tarifa && e.jornada_tarifa !== jornada.id_jornada) {
    throw new ErrorHttp(409, `Es una entrada para el ${fechaCorta(e.fecha_tarifa)}, no para esta jornada`);
  }
  if (e.ya_ingreso) {
    throw new ErrorHttp(409, `Ya ingresó en esta jornada, a las ${e.ya_ingreso}`);
  }

  // La hora se guarda explícita en hora de Argentina (el DEFAULT NOW() de la base quedaría en UTC)
  const { rows } = await pool.query(
    `INSERT INTO ingresos (id_entrada, id_evento, id_jornada, fecha_hora) VALUES ($1, $2, $3, ${AHORA})
     RETURNING to_char(fecha_hora, 'HH24:MI') AS hora`,
    [e.id_entrada, e.id_evento, jornada.id_jornada]
  );
  const { rows: contador } = await pool.query("SELECT entradas, ingresos FROM v_asistencia WHERE id_jornada = $1", [jornada.id_jornada]);

  res.status(201).json({
    valida: true,
    hora: rows[0].hora,
    espacio: e.espacio,
    tarifa: e.tarifa,
    abono: e.jornada_tarifa === null,
    // Para pedir el documento si hace falta: nombre e inicial del apellido
    titular: `${e.nombre}${e.apellido ? ` ${e.apellido[0]}.` : ""}`,
    ...contador[0]
  });
};
