import { randomBytes } from "node:crypto";
import pool from "../data/db.js";
import { ErrorHttp } from "../utils/ErrorHttp.js";
import { actualizar } from "../utils/sql.js";
import { AHORA, hora } from "../utils/fechas.js";

// Rol cliente: cotizar, comprar (pago simulado), ver sus compras y entradas, editar su perfil.
// Reglas: docs/comun/dominio.md, RN-22 a RN-30.

const fechaCorta = (iso) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

// Valida el pedido y calcula el detalle y los importes. Con "bloquear", corre dentro de la transacción
// de la compra: bloquea las tarifas del evento en los sectores pedidos (SELECT … FOR UPDATE) antes de
// leer la disponibilidad, así dos compras simultáneas no pueden vender el mismo último lugar (RN-23).
const prepararCompra = async (db, { id_evento, items }, bloquear = false) => {
  const { rows: eventos } = await db.query(
    `SELECT ev.id_evento, ev.nombre, ev.estado, e.cargo_servicio_pct
     FROM eventos ev JOIN empresas e ON e.id_empresa = ev.id_empresa
     WHERE ev.id_evento = $1 AND e.activo`,
    [id_evento]
  );
  const evento = eventos[0];
  if (!evento || !["publicado", "agotado"].includes(evento.estado)) {
    throw new ErrorHttp(404, "El evento no existe o no está a la venta");
  }
  if (evento.estado === "agotado") {
    throw new ErrorHttp(409, "Las entradas para este evento están agotadas");
  }

  const ids = items.map((i) => i.id_tarifa);
  const { rows: tarifas } = await db.query(
    `SELECT t.id_tarifa, t.id_espacio, t.id_jornada, t.nombre, t.precio, t.activa, es.nombre AS espacio, j.fecha,
            (t.venta_desde IS NULL OR t.venta_desde <= ${AHORA}) AND (t.venta_hasta IS NULL OR t.venta_hasta > ${AHORA}) AS en_venta
     FROM tarifas t
     JOIN espacios es ON es.id_espacio = t.id_espacio
     LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
     WHERE t.id_evento = $1 AND t.id_tarifa = ANY($2::INT[])`,
    [id_evento, ids]
  );
  if (tarifas.length !== ids.length) {
    throw new ErrorHttp(400, "Alguna de las entradas elegidas no es de este evento"); // RN-26: una compra, un evento
  }
  for (const t of tarifas) {
    if (!t.activa || !t.en_venta) {
      throw new ErrorHttp(409, `${t.espacio} · ${t.nombre} no está a la venta en este momento`); // RN-25
    }
  }

  const espacios = [...new Set(tarifas.map((t) => t.id_espacio))];
  if (bloquear) {
    await db.query(
      "SELECT id_tarifa FROM tarifas WHERE id_evento = $1 AND id_espacio = ANY($2::INT[]) ORDER BY id_tarifa FOR UPDATE",
      [id_evento, espacios]
    );
  }

  // Cuántos lugares se piden en cada sector y jornada. Un abono ocupa lugar en todas (RN-23).
  const { rows: jornadas } = await db.query("SELECT id_jornada FROM jornadas WHERE id_evento = $1", [id_evento]);
  const pedido = new Map();
  const sumar = (idEspacio, idJornada, cantidad) => {
    const clave = `${idEspacio}-${idJornada}`;
    pedido.set(clave, (pedido.get(clave) ?? 0) + cantidad);
  };
  const lineas = items.map((item) => {
    const t = tarifas.find((x) => x.id_tarifa === item.id_tarifa);
    const dias = t.id_jornada ? [t.id_jornada] : jornadas.map((j) => j.id_jornada);
    dias.forEach((idJornada) => sumar(t.id_espacio, idJornada, item.cantidad));
    return {
      id_tarifa: t.id_tarifa,
      nombre: t.nombre,
      espacio: t.espacio,
      fecha: t.fecha,
      precio: t.precio,
      cantidad: item.cantidad,
      importe: t.precio * item.cantidad
    };
  });

  const { rows: disponibilidad } = await db.query(
    "SELECT id_espacio, id_jornada, fecha, espacio, disponibles FROM v_disponibilidad WHERE id_evento = $1",
    [id_evento]
  );
  for (const [clave, cantidad] of pedido) {
    const d = disponibilidad.find((x) => `${x.id_espacio}-${x.id_jornada}` === clave);
    const libres = d?.disponibles ?? 0;
    if (cantidad > libres) {
      throw new ErrorHttp(
        409,
        libres > 0
          ? `En ${d.espacio} quedan ${libres} lugares para el ${fechaCorta(d.fecha)}`
          : `${d?.espacio ?? "El sector"} está agotado${d ? ` para el ${fechaCorta(d.fecha)}` : ""}`
      );
    }
  }

  // RN-27: service charge = subtotal × % de la productora; total = subtotal + service charge
  const subtotal = lineas.reduce((s, l) => s + l.importe, 0);
  const cargo = Math.round(subtotal * evento.cargo_servicio_pct) / 100;
  return {
    evento: { id_evento: evento.id_evento, nombre: evento.nombre },
    lineas,
    cantidad: lineas.reduce((s, l) => s + l.cantidad, 0),
    subtotal,
    cargo_servicio_pct: evento.cargo_servicio_pct,
    cargo_servicio: cargo,
    total: Number((subtotal + cargo).toFixed(2))
  };
};

export const cotizar = async (req, res) => {
  res.json(await prepararCompra(pool, req.body));
};

// Pago simulado: una tarjeta terminada en 0000 se rechaza; cualquier otra, y la transferencia, se aprueban.
// La compra rechazada queda registrada (sin entradas) para que el cliente la vea en su historial.
export const comprar = async (req, res) => {
  const { medio_pago, tarjeta } = req.body;
  const aprobada = medio_pago === "transferencia" || !tarjeta.numero.endsWith("0000");
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const detalle = await prepararCompra(cliente, req.body, true);

    const { rows } = await cliente.query(
      `INSERT INTO compras (id_usuario, id_evento, subtotal, cargo_servicio_pct, cargo_servicio, total, medio_pago, referencia_pago, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_compra, ${hora("fecha")}, estado, referencia_pago`,
      [
        req.usuario.id_usuario,
        detalle.evento.id_evento,
        detalle.subtotal,
        detalle.cargo_servicio_pct,
        detalle.cargo_servicio,
        detalle.total,
        medio_pago,
        aprobada ? `SIM-${randomBytes(5).toString("hex").toUpperCase()}` : null,
        aprobada ? "pagada" : "rechazada"
      ]
    );
    const compra = rows[0];

    if (aprobada) {
      // Una entrada por unidad, con el precio del momento (RN-28) y un código UUID (RN-29, lo pone la base)
      for (const l of detalle.lineas) {
        await cliente.query(
          `INSERT INTO entradas (id_compra, id_evento, id_tarifa, precio_pagado)
           SELECT $1, $2, $3, $4 FROM generate_series(1, $5)`,
          [compra.id_compra, detalle.evento.id_evento, l.id_tarifa, l.precio, l.cantidad]
        );
      }
      // Si ya no queda lugar en ningún sector y jornada, el evento pasa a agotado
      await cliente.query(
        `UPDATE eventos SET estado = 'agotado'
         WHERE id_evento = $1 AND estado = 'publicado'
           AND NOT EXISTS (SELECT 1 FROM v_disponibilidad WHERE id_evento = $1 AND disponibles > 0)`,
        [detalle.evento.id_evento]
      );
    }
    await cliente.query("COMMIT");

    res.status(201).json({
      ...detalle,
      ...compra,
      mensaje: aprobada ? "¡Listo! Tus entradas ya están en Mis entradas" : "El pago fue rechazado. Probá con otra tarjeta"
    });
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
};

export const obtenerCompras = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id_compra, ${hora("c.fecha")}, c.subtotal, c.cargo_servicio_pct, c.cargo_servicio, c.total,
            c.medio_pago, c.referencia_pago, c.estado, ev.id_evento, ev.nombre AS evento, ev.fecha_inicio,
            (SELECT COUNT(*) FROM entradas en WHERE en.id_compra = c.id_compra)::INT AS cantidad
     FROM compras c JOIN eventos ev ON ev.id_evento = c.id_evento
     WHERE c.id_usuario = $1
     ORDER BY c.fecha DESC`,
    [req.usuario.id_usuario]
  );
  res.json(rows);
};

// Entradas de compras pagadas, con lo necesario para mostrarlas y el QR (el código)
export const obtenerEntradas = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT en.id_entrada, en.codigo, en.estado, en.precio_pagado, c.id_compra,
            t.nombre AS tarifa, t.id_jornada, j.fecha AS fecha_jornada, es.nombre AS espacio,
            ev.id_evento, ev.nombre AS evento, ev.fecha_inicio, ev.fecha_fin, ev.estado AS estado_evento,
            l.nombre AS lugar, l.direccion, l.ciudad,
            (SELECT COUNT(*) FROM ingresos i WHERE i.id_entrada = en.id_entrada)::INT AS ingresos,
            (SELECT COUNT(*) FROM jornadas jj WHERE jj.id_evento = ev.id_evento)::INT AS cantidad_jornadas
     FROM entradas en
     JOIN compras c   ON c.id_compra = en.id_compra
     JOIN tarifas t   ON t.id_tarifa = en.id_tarifa
     JOIN espacios es ON es.id_espacio = t.id_espacio
     LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
     JOIN eventos ev  ON ev.id_evento = en.id_evento
     JOIN lugares l   ON l.id_lugar = ev.id_lugar
     WHERE c.id_usuario = $1 AND c.estado = 'pagada'
     ORDER BY ev.fecha_inicio, j.fecha NULLS FIRST, en.id_entrada`,
    [req.usuario.id_usuario]
  );
  res.json(rows);
};

export const editarPerfil = async (req, res) => {
  const consulta = actualizar("usuarios", req.body, ["nombre", "apellido", "dni", "telefono"], { id_usuario: req.usuario.id_usuario });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  const { rows } = await pool.query(
    "SELECT id_usuario, email, nombre, apellido, dni, telefono, rol FROM usuarios WHERE id_usuario = $1",
    [req.usuario.id_usuario]
  );
  res.json(rows[0]);
};
