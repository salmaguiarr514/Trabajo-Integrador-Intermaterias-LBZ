import { randomBytes } from "node:crypto";
import pool, { enTransaccion } from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { AHORA, HOY, hora } from "../../utils/sql.js";
import { EN_VENTA } from "../public.controller.js";

// Compras y entradas del cliente logueado (fase 6). Todo filtra por req.usuario.id_usuario:
// una compra de otro cliente responde 404. Reglas: docs/comun/dominio.md, RN-22 a RN-30.

// Arma el pedido: verifica el evento, las tarifas y el cupo, y calcula los importes.
// Con bloquear = true (dentro de la compra) toma las tarifas de los sectores involucrados
// con FOR UPDATE: dos compras del mismo sector esperan una a la otra y no se pasan del cupo.
const armarPedido = async (db, { id_evento, items }, bloquear = false) => {
  const { rows: eventos } = await db.query(
    `SELECT ev.id_evento, ev.nombre, ev.estado, ev.fecha_fin < ${HOY} AS termino, em.cargo_servicio_pct
     FROM eventos ev JOIN empresas em ON em.id_empresa = ev.id_empresa
     WHERE ev.id_evento = $1 AND ev.estado IN ('publicado', 'agotado') AND em.activo`,
    [id_evento]
  );
  const evento = eventos[0];
  if (!evento) {
    throw new ErrorHttp(404, "Evento no encontrado");
  }
  if (evento.termino) {
    throw new ErrorHttp(409, "El evento ya pasó");
  }
  if (evento.estado === "agotado") {
    throw new ErrorHttp(409, "El evento está agotado");
  }

  const ids = items.map((i) => i.id_tarifa);
  if (bloquear) {
    await db.query(
      `SELECT 1 FROM tarifas
       WHERE id_evento = $1 AND id_espacio IN (SELECT id_espacio FROM tarifas WHERE id_evento = $1 AND id_tarifa = ANY($2::INT[]))
       ORDER BY id_tarifa FOR UPDATE`,
      [id_evento, ids]
    );
  }

  const { rows: tarifas } = await db.query(
    `SELECT t.id_tarifa, t.id_espacio, t.id_jornada, t.nombre, t.precio, (${EN_VENTA}) AS en_venta,
            es.nombre AS espacio, j.fecha AS fecha_jornada, j.fecha < ${HOY} AS jornada_paso
     FROM tarifas t
     JOIN espacios es ON es.id_espacio = t.id_espacio
     LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
     WHERE t.id_evento = $1 AND t.id_tarifa = ANY($2::INT[])`,
    [id_evento, ids]
  );
  const porId = new Map(tarifas.map((t) => [t.id_tarifa, t]));

  const lineas = items.map(({ id_tarifa, cantidad }) => {
    const t = porId.get(id_tarifa);
    if (!t) {
      throw new ErrorHttp(400, "Alguna de las tarifas no es de este evento");
    }
    if (!t.en_venta) {
      throw new ErrorHttp(409, `La tarifa "${t.nombre}" (${t.espacio}) no está a la venta`);
    }
    if (t.jornada_paso) {
      throw new ErrorHttp(409, `La jornada del ${t.fecha_jornada} ya pasó`);
    }
    return { ...t, cantidad };
  });

  // RN-23: por cada sector y jornada, lo pedido no supera lo disponible.
  // Una entrada de un día ocupa su jornada; un abono ocupa todas.
  const { rows: disponibilidad } = await db.query(
    "SELECT id_jornada, fecha, id_espacio, espacio, disponibles FROM v_disponibilidad WHERE id_evento = $1",
    [id_evento]
  );
  for (const d of disponibilidad) {
    const pedidas = lineas
      .filter((l) => l.id_espacio === d.id_espacio && (l.id_jornada === null || l.id_jornada === d.id_jornada))
      .reduce((s, l) => s + l.cantidad, 0);
    if (pedidas > d.disponibles) {
      throw new ErrorHttp(
        409,
        d.disponibles === 0
          ? `${d.espacio} está agotado para el ${d.fecha}`
          : d.disponibles === 1
            ? `En ${d.espacio} queda 1 lugar para el ${d.fecha}`
            : `En ${d.espacio} quedan ${d.disponibles} lugares para el ${d.fecha}`,
        { id_espacio: d.id_espacio, id_jornada: d.id_jornada, disponibles: d.disponibles }
      );
    }
  }

  // RN-27, en centavos para no arrastrar errores de redondeo
  const subtotal = lineas.reduce((s, l) => s + Math.round(l.precio * 100) * l.cantidad, 0);
  const cargo = Math.round((subtotal * evento.cargo_servicio_pct) / 100);
  return {
    evento: { id_evento: evento.id_evento, nombre: evento.nombre },
    items: lineas.map((l) => ({
      id_tarifa: l.id_tarifa,
      tarifa: l.nombre,
      id_espacio: l.id_espacio,
      espacio: l.espacio,
      id_jornada: l.id_jornada,
      fecha_jornada: l.fecha_jornada,
      precio: l.precio,
      cantidad: l.cantidad,
      importe: (Math.round(l.precio * 100) * l.cantidad) / 100
    })),
    subtotal: subtotal / 100,
    cargo_servicio_pct: evento.cargo_servicio_pct,
    cargo_servicio: cargo / 100,
    total: (subtotal + cargo) / 100
  };
};

// Pago simulado: una tarjeta terminada en 0000 se rechaza, cualquier otra se aprueba.
// La transferencia siempre se aprueba.
const pagoAprobado = ({ medio_pago, tarjeta_ficticia }) => medio_pago === "transferencia" || !tarjeta_ficticia.endsWith("0000");

// Hace la compra completa dentro de la transacción "db". Si el pago se rechaza, la compra
// queda registrada como rechazada y sin entradas. Se exporta para poder probarla con ROLLBACK.
export const registrarCompra = async (db, idUsuario, datos) => {
  const pedido = await armarPedido(db, datos, true);
  const aprobada = pagoAprobado(datos);

  const { rows } = await db.query(
    `INSERT INTO compras (id_usuario, id_evento, fecha, subtotal, cargo_servicio_pct, cargo_servicio, total,
                          medio_pago, referencia_pago, estado)
     VALUES ($1, $2, ${AHORA}, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id_compra, estado`,
    [
      idUsuario,
      pedido.evento.id_evento,
      pedido.subtotal,
      pedido.cargo_servicio_pct,
      pedido.cargo_servicio,
      pedido.total,
      datos.medio_pago,
      aprobada ? `SIM-${randomBytes(6).toString("hex").toUpperCase()}` : null,
      aprobada ? "pagada" : "rechazada"
    ]
  );
  const compra = rows[0];
  if (!aprobada) {
    return compra;
  }

  // RN-28: cada entrada guarda el precio que se pagó. El código (UUID) lo pone la base.
  await db.query(
    `INSERT INTO entradas (id_compra, id_evento, id_tarifa, precio_pagado)
     SELECT $1, $2, i.id_tarifa, i.precio
     FROM unnest($3::INT[], $4::NUMERIC[], $5::INT[]) AS i (id_tarifa, precio, cantidad),
          generate_series(1, i.cantidad)`,
    [
      compra.id_compra,
      pedido.evento.id_evento,
      pedido.items.map((i) => i.id_tarifa),
      pedido.items.map((i) => i.precio),
      pedido.items.map((i) => i.cantidad)
    ]
  );

  // Si no queda lugar en ningún sector, el evento pasa a agotado
  await db.query(
    `UPDATE eventos SET estado = 'agotado'
     WHERE id_evento = $1 AND estado = 'publicado'
       AND NOT EXISTS (SELECT 1 FROM v_disponibilidad d WHERE d.id_evento = $1 AND d.disponibles > 0)`,
    [pedido.evento.id_evento]
  );
  return compra;
};

const SELECT_COMPRA = `
  SELECT c.id_compra, c.id_evento, ev.nombre AS evento, ev.fecha_inicio, ev.fecha_fin, ev.estado AS estado_evento,
         ev.imagen_url, l.nombre AS lugar, l.ciudad, ${hora("c.fecha")}, c.subtotal, c.cargo_servicio_pct,
         c.cargo_servicio, c.total, c.medio_pago, c.referencia_pago, c.estado,
         (SELECT COUNT(*) FROM entradas en WHERE en.id_compra = c.id_compra)::INT AS cantidad_entradas
  FROM compras c
  JOIN eventos ev ON ev.id_evento = c.id_evento
  JOIN lugares l  ON l.id_lugar = ev.id_lugar
  WHERE c.id_usuario = $1`;

const SELECT_ENTRADA = `
  SELECT en.id_entrada, en.codigo, en.precio_pagado, en.estado, en.id_compra,
         ev.id_evento, ev.nombre AS evento, ev.fecha_inicio, ev.fecha_fin, ev.estado AS estado_evento, ev.imagen_url,
         l.nombre AS lugar, l.direccion, l.ciudad,
         t.nombre AS tarifa, es.nombre AS espacio, t.id_jornada, j.fecha AS fecha_jornada, j.nombre AS jornada,
         to_char(j.hora_apertura, 'HH24:MI') AS hora_apertura,
         (SELECT COUNT(*) FROM ingresos i WHERE i.id_entrada = en.id_entrada)::INT AS ingresos
  FROM entradas en
  JOIN compras c   ON c.id_compra = en.id_compra
  JOIN eventos ev  ON ev.id_evento = en.id_evento
  JOIN lugares l   ON l.id_lugar = ev.id_lugar
  JOIN tarifas t   ON t.id_tarifa = en.id_tarifa
  JOIN espacios es ON es.id_espacio = t.id_espacio
  LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
  WHERE c.id_usuario = $1`;

const ORDEN_ENTRADAS = "ORDER BY ev.fecha_inicio, j.fecha NULLS FIRST, en.id_entrada";

const buscarCompra = async (idUsuario, id) => {
  const { rows } = await pool.query(`${SELECT_COMPRA} AND c.id_compra = $2`, [idUsuario, id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Compra no encontrada");
  }
  const { rows: entradas } = await pool.query(`${SELECT_ENTRADA} AND c.id_compra = $2 ${ORDEN_ENTRADAS}`, [idUsuario, id]);
  return { ...rows[0], entradas };
};

// ─── Endpoints ──────────────────────────────────────────────────────────────

// Lo que va a pagar, antes de pagar (no bloquea nada ni guarda nada)
export const cotizar = async (req, res) => {
  res.json(await armarPedido(pool, req.body));
};

export const comprar = async (req, res) => {
  const compra = await enTransaccion((db) => registrarCompra(db, req.usuario.id_usuario, req.body));
  if (compra.estado === "rechazada") {
    throw new ErrorHttp(402, "El pago fue rechazado. Probá con otra tarjeta", { id_compra: compra.id_compra });
  }
  res.status(201).json(await buscarCompra(req.usuario.id_usuario, compra.id_compra));
};

export const obtenerCompras = async (req, res) => {
  const { rows } = await pool.query(`${SELECT_COMPRA} ORDER BY c.fecha DESC`, [req.usuario.id_usuario]);
  res.json(rows);
};

export const obtenerCompra = async (req, res) => {
  res.json(await buscarCompra(req.usuario.id_usuario, req.params.id));
};

// Mis entradas: solo las de compras pagadas, con el código para mostrar como QR
export const obtenerEntradas = async (req, res) => {
  const { rows } = await pool.query(`${SELECT_ENTRADA} AND c.estado = 'pagada' ${ORDEN_ENTRADAS}`, [req.usuario.id_usuario]);
  res.json(rows);
};
