import pool from "../../data/db.js";
import { ErrorHttp } from "../../utils/ErrorHttp.js";
import { actualizar, insertar } from "../../utils/sql.js";

// Eventos de la productora del usuario (fase 5): el evento y todo lo que cuelga de él
// (jornadas, escenarios habilitados, line-up y tarifas). Todo filtra por req.usuario.id_empresa:
// un evento de otra productora responde 404. Reglas: docs/comun/dominio.md, RN-13 a RN-22.

const COLUMNAS_EVENTO = ["nombre", "descripcion", "tipo", "id_lugar", "fecha_inicio", "fecha_fin", "imagen_url"];
const COLUMNAS_JORNADA = ["fecha", "hora_apertura", "nombre"];
const COLUMNAS_PRESENTACION = ["id_jornada", "id_escenario", "id_artista", "inicio", "fin", "headliner"];
const COLUMNAS_TARIFA = ["id_espacio", "id_jornada", "nombre", "precio", "venta_desde", "venta_hasta", "activa"];

// Los TIMESTAMP se devuelven como texto "2027-02-13T22:30": son horas de Argentina sin huso,
// y si viajaran como Date el navegador las correría.
const hora = (col, alias = col.split(".").pop()) => `to_char(${col}, 'YYYY-MM-DD"T"HH24:MI') AS ${alias}`;

const SELECT_EVENTO = `
  SELECT ev.*, l.nombre AS lugar, l.ciudad, l.provincia,
         (SELECT COUNT(*) FROM jornadas j WHERE j.id_evento = ev.id_evento)::INT AS cantidad_jornadas,
         (SELECT COUNT(*) FROM presentaciones p WHERE p.id_evento = ev.id_evento)::INT AS cantidad_presentaciones,
         (SELECT COUNT(*) FROM tarifas t WHERE t.id_evento = ev.id_evento)::INT AS cantidad_tarifas,
         (SELECT COUNT(*) FROM compras c WHERE c.id_evento = ev.id_evento)::INT AS cantidad_compras,
         (SELECT COUNT(*) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
           WHERE en.id_evento = ev.id_evento AND en.estado = 'valida' AND c.estado = 'pagada')::INT AS entradas_vendidas
  FROM eventos ev
  JOIN lugares l ON l.id_lugar = ev.id_lugar
  WHERE ev.id_empresa = $1`;

const contar = async (sql, params) => (await pool.query(sql, params)).rows[0].cantidad;

const buscarEvento = async (req, id) => {
  const { rows } = await pool.query(`${SELECT_EVENTO} AND ev.id_evento = $2`, [req.usuario.id_empresa, id]);
  if (!rows[0]) {
    throw new ErrorHttp(404, "Evento no encontrado");
  }
  return rows[0];
};

// Un evento cancelado o finalizado ya no se toca
const eventoModificable = async (req, id) => {
  const evento = await buscarEvento(req, id);
  if (["cancelado", "finalizado"].includes(evento.estado)) {
    throw new ErrorHttp(409, `El evento está ${evento.estado}: ya no se puede modificar`);
  }
  return evento;
};

// RN-18: el lugar es de la plataforma o propio, y está activo
const verificarLugar = async (cliente, req, idLugar) => {
  const { rows } = await cliente.query(
    "SELECT activo FROM lugares WHERE id_lugar = $1 AND (id_empresa IS NULL OR id_empresa = $2)",
    [idLugar, req.usuario.id_empresa]
  );
  if (!rows[0]) {
    throw new ErrorHttp(400, "Elegí un lugar de la plataforma o uno de los tuyos");
  }
  if (!rows[0].activo) {
    throw new ErrorHttp(400, "Ese lugar está dado de baja: elegí otro");
  }
};

// Habilita todos los escenarios del lugar (después se ajusta en el paso de escenarios)
const habilitarTodosLosEscenarios = (cliente, idEvento, idLugar) =>
  cliente.query(
    `INSERT INTO evento_escenarios (id_evento, id_escenario, id_lugar)
     SELECT $1, id_escenario, id_lugar FROM escenarios WHERE id_lugar = $2`,
    [idEvento, idLugar]
  );

const enTransaccion = async (fn) => {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
};

// ─── Eventos ────────────────────────────────────────────────────────────────
export const obtenerEventos = async (req, res) => {
  const { rows } = await pool.query(`${SELECT_EVENTO} ORDER BY ev.fecha_inicio DESC`, [req.usuario.id_empresa]);
  res.json(rows);
};

// Todo lo que necesita el asistente en un solo pedido
export const obtenerEvento = async (req, res) => {
  const evento = await buscarEvento(req, req.params.id);
  const id = evento.id_evento;
  const [escenarios, espacios, jornadas, presentaciones, tarifas] = await Promise.all([
    pool.query(
      `SELECT sc.id_escenario, sc.nombre, sc.descripcion,
              EXISTS (SELECT 1 FROM evento_escenarios ee WHERE ee.id_evento = $1 AND ee.id_escenario = sc.id_escenario) AS habilitado
       FROM escenarios sc WHERE sc.id_lugar = $2 ORDER BY sc.nombre`,
      [id, evento.id_lugar]
    ),
    pool.query("SELECT id_espacio, nombre, modalidad, capacidad, color FROM espacios WHERE id_lugar = $1 ORDER BY capacidad DESC", [evento.id_lugar]),
    pool.query(
      `SELECT j.id_jornada, j.fecha, to_char(j.hora_apertura, 'HH24:MI') AS hora_apertura, j.nombre,
              (SELECT COUNT(*) FROM presentaciones p WHERE p.id_jornada = j.id_jornada)::INT AS cantidad_presentaciones,
              (SELECT COUNT(*) FROM tarifas t WHERE t.id_jornada = j.id_jornada)::INT AS cantidad_tarifas
       FROM jornadas j WHERE j.id_evento = $1 ORDER BY j.fecha`,
      [id]
    ),
    pool.query(
      `SELECT p.id_presentacion, p.id_jornada, p.id_escenario, p.id_artista, p.headliner,
              ${hora("p.inicio")}, ${hora("p.fin")}, a.nombre AS artista, sc.nombre AS escenario
       FROM presentaciones p
       JOIN artistas a    ON a.id_artista = p.id_artista
       JOIN escenarios sc ON sc.id_escenario = p.id_escenario
       WHERE p.id_evento = $1 ORDER BY p.inicio`,
      [id]
    ),
    pool.query(
      `SELECT t.id_tarifa, t.id_espacio, t.id_jornada, t.nombre, t.precio, t.activa,
              ${hora("t.venta_desde")}, ${hora("t.venta_hasta")}, es.nombre AS espacio, j.fecha AS fecha_jornada,
              (SELECT COUNT(*) FROM entradas en WHERE en.id_tarifa = t.id_tarifa)::INT AS entradas_emitidas
       FROM tarifas t
       JOIN espacios es ON es.id_espacio = t.id_espacio
       LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
       WHERE t.id_evento = $1 ORDER BY es.capacidad DESC, j.fecha NULLS LAST, t.precio`,
      [id]
    )
  ]);
  res.json({
    ...evento,
    escenarios: escenarios.rows,
    espacios: espacios.rows,
    jornadas: jornadas.rows,
    presentaciones: presentaciones.rows,
    tarifas: tarifas.rows
  });
};

// Se crea en borrador, con una jornada por día del rango y todos los escenarios del lugar habilitados
export const crearEvento = async (req, res) => {
  const id = await enTransaccion(async (cliente) => {
    await verificarLugar(cliente, req, req.body.id_lugar);
    const { texto, valores } = insertar("eventos", req.body, COLUMNAS_EVENTO, { id_empresa: req.usuario.id_empresa });
    const { rows } = await cliente.query(texto, valores);
    const evento = rows[0];
    await cliente.query(
      `INSERT INTO jornadas (id_evento, fecha)
       SELECT $1, d::DATE FROM generate_series($2::DATE, $3::DATE, INTERVAL '1 day') AS d`,
      [evento.id_evento, evento.fecha_inicio, evento.fecha_fin]
    );
    await habilitarTodosLosEscenarios(cliente, evento.id_evento, evento.id_lugar);
    return evento.id_evento;
  });
  res.status(201).json(await buscarEvento(req, id));
};

// RN-21: el lugar solo se cambia si todavía no hay line-up ni tarifas (se habilitan los escenarios del lugar nuevo).
// Si cambian las fechas, la base verifica que las jornadas sigan dentro del rango (trigger).
export const editarEvento = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const cambiaLugar = req.body.id_lugar !== undefined && req.body.id_lugar !== evento.id_lugar;

  await enTransaccion(async (cliente) => {
    if (cambiaLugar) {
      if (evento.cantidad_presentaciones > 0 || evento.cantidad_tarifas > 0) {
        throw new ErrorHttp(409, "Para cambiar el lugar, primero sacá las presentaciones y las tarifas del evento");
      }
      await verificarLugar(cliente, req, req.body.id_lugar);
      await cliente.query("DELETE FROM evento_escenarios WHERE id_evento = $1", [evento.id_evento]);
    }
    const consulta = actualizar("eventos", req.body, COLUMNAS_EVENTO, { id_evento: evento.id_evento, id_empresa: req.usuario.id_empresa });
    if (consulta) {
      await cliente.query(consulta.texto, consulta.valores);
    }
    if (cambiaLugar) {
      await habilitarTodosLosEscenarios(cliente, evento.id_evento, req.body.id_lugar);
    }
  });
  res.json(await buscarEvento(req, evento.id_evento));
};

// Un evento con ventas no se borra: se cancela (RN-21). Sin ventas se borra completo (jornadas, line-up, tarifas).
export const eliminarEvento = async (req, res) => {
  const evento = await buscarEvento(req, req.params.id);
  if (evento.cantidad_compras > 0) {
    throw new ErrorHttp(409, "El evento tiene ventas: no se puede eliminar, solo cancelar");
  }
  await pool.query("DELETE FROM eventos WHERE id_evento = $1 AND id_empresa = $2", [evento.id_evento, req.usuario.id_empresa]);
  res.status(204).send();
};

//   publicado ← borrador, con al menos 1 jornada, 1 presentación y 1 tarifa activa (RN-20)
//   borrador  ← publicado o agotado, sin ventas (despublicar)
//   cancelado ← cualquiera que no esté cancelado ni finalizado (no tiene vuelta atrás)
export const cambiarEstadoEvento = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const { estado } = req.body;

  if (estado === "publicado") {
    if (evento.estado !== "borrador") {
      throw new ErrorHttp(409, `El evento ya está ${evento.estado}`);
    }
    const tarifasActivas = await contar(
      "SELECT COUNT(*)::INT AS cantidad FROM tarifas WHERE id_evento = $1 AND activa",
      [evento.id_evento]
    );
    const faltan = [
      evento.cantidad_jornadas === 0 && "una jornada",
      evento.cantidad_presentaciones === 0 && "una presentación en el line-up",
      tarifasActivas === 0 && "una tarifa activa"
    ].filter(Boolean);
    if (faltan.length > 0) {
      throw new ErrorHttp(409, `Para publicar falta ${faltan.join(", ")}`);
    }
  }
  if (estado === "borrador") {
    if (!["publicado", "agotado"].includes(evento.estado)) {
      throw new ErrorHttp(409, "Solo se puede despublicar un evento publicado");
    }
    if (evento.cantidad_compras > 0) {
      throw new ErrorHttp(409, "El evento ya tiene ventas: no se puede despublicar. Si no se hace, cancelalo");
    }
  }

  await pool.query("UPDATE eventos SET estado = $1 WHERE id_evento = $2", [estado, evento.id_evento]);
  res.json(await buscarEvento(req, evento.id_evento));
};

// ─── Jornadas ───────────────────────────────────────────────────────────────
// Que la fecha caiga dentro del evento y no se repita lo controla la base (trigger y UNIQUE)
export const crearJornada = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const { texto, valores } = insertar("jornadas", req.body, COLUMNAS_JORNADA, { id_evento: evento.id_evento });
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(rows[0]);
};

export const editarJornada = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const donde = { id_jornada: req.params.idHijo, id_evento: evento.id_evento };
  const consulta = actualizar("jornadas", req.body, COLUMNAS_JORNADA, donde);
  const { rows } = consulta
    ? await pool.query(consulta.texto, consulta.valores)
    : await pool.query("SELECT * FROM jornadas WHERE id_jornada = $1 AND id_evento = $2", Object.values(donde));
  if (!rows[0]) {
    throw new ErrorHttp(404, "Jornada no encontrada");
  }
  res.json(rows[0]);
};

// Borra también sus presentaciones y tarifas (cascada). No si ya se vendieron entradas para ese día.
export const eliminarJornada = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const vendidas = await contar(
    `SELECT COUNT(*)::INT AS cantidad FROM entradas en JOIN tarifas t ON t.id_tarifa = en.id_tarifa
     WHERE t.id_jornada = $1 AND t.id_evento = $2`,
    [req.params.idHijo, evento.id_evento]
  );
  if (vendidas > 0) {
    throw new ErrorHttp(409, "Ya se vendieron entradas para esa jornada: no se puede eliminar");
  }
  const { rowCount } = await pool.query("DELETE FROM jornadas WHERE id_jornada = $1 AND id_evento = $2", [req.params.idHijo, evento.id_evento]);
  if (rowCount === 0) {
    throw new ErrorHttp(404, "Jornada no encontrada");
  }
  res.status(204).send();
};

// ─── Escenarios habilitados (RN-16) ─────────────────────────────────────────
// Recibe la lista completa. Sacar un escenario que tiene shows no se permite (se perderían del line-up).
export const reemplazarEscenarios = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const nuevos = [...new Set(req.body.escenarios)];

  const delLugar = await pool.query(
    "SELECT id_escenario FROM escenarios WHERE id_lugar = $1 AND id_escenario = ANY($2::INT[])",
    [evento.id_lugar, nuevos]
  );
  if (delLugar.rows.length !== nuevos.length) {
    throw new ErrorHttp(400, "Algún escenario no es del lugar del evento");
  }

  const conShows = await pool.query(
    `SELECT DISTINCT sc.nombre FROM presentaciones p JOIN escenarios sc ON sc.id_escenario = p.id_escenario
     WHERE p.id_evento = $1 AND NOT (p.id_escenario = ANY($2::INT[]))`,
    [evento.id_evento, nuevos]
  );
  if (conShows.rows.length > 0) {
    const nombres = conShows.rows.map((r) => r.nombre).join(", ");
    throw new ErrorHttp(409, `No se puede sacar ${nombres}: tiene shows en el line-up. Movelos o borralos primero`);
  }

  await enTransaccion(async (cliente) => {
    await cliente.query(
      "DELETE FROM evento_escenarios WHERE id_evento = $1 AND NOT (id_escenario = ANY($2::INT[]))",
      [evento.id_evento, nuevos]
    );
    await cliente.query(
      `INSERT INTO evento_escenarios (id_evento, id_escenario, id_lugar)
       SELECT $1, id_escenario, id_lugar FROM escenarios WHERE id_escenario = ANY($2::INT[])
       ON CONFLICT DO NOTHING`,
      [evento.id_evento, nuevos]
    );
  });
  res.json({ escenarios: nuevos });
};

// ─── Presentaciones (line-up) ───────────────────────────────────────────────
// Antes de guardar, mensajes claros para lo que la base rechazaría con un error genérico
const verificarPresentacion = async (req, evento, p) => {
  const [artista, jornada, escenario] = await Promise.all([
    pool.query("SELECT nombre, activo FROM artistas WHERE id_artista = $1 AND id_empresa = $2", [p.id_artista, req.usuario.id_empresa]),
    pool.query("SELECT 1 FROM jornadas WHERE id_jornada = $1 AND id_evento = $2", [p.id_jornada, evento.id_evento]),
    pool.query("SELECT 1 FROM evento_escenarios WHERE id_escenario = $1 AND id_evento = $2", [p.id_escenario, evento.id_evento])
  ]);
  if (!artista.rows[0]) throw new ErrorHttp(400, "Elegí uno de tus artistas"); // RN-12
  if (!artista.rows[0].activo) throw new ErrorHttp(400, `${artista.rows[0].nombre} está dado de baja`);
  if (!jornada.rows[0]) throw new ErrorHttp(400, "La jornada no es de este evento");
  if (!escenario.rows[0]) throw new ErrorHttp(400, "Ese escenario no está habilitado en el evento"); // RN-16
};

// RN-14 y RN-15: la base rechaza la superposición (EXCLUDE). Acá se arma un mensaje que diga con qué choca.
// Si choca con un show de otra productora (en un lugar de la plataforma), no se muestran sus datos.
const explicarSuperposicion = async (req, error, p, excluir = 0) => {
  if (error.code !== "23P01") return error;
  const porEscenario = error.constraint === "presentaciones_escenario_excl";
  const { rows } = await pool.query(
    `SELECT a.nombre AS artista, sc.nombre AS escenario, ev.nombre AS evento, p.id_empresa,
            to_char(p.inicio, 'HH24:MI') AS desde, to_char(p.fin, 'HH24:MI') AS hasta
     FROM presentaciones p
     JOIN artistas a    ON a.id_artista = p.id_artista
     JOIN escenarios sc ON sc.id_escenario = p.id_escenario
     JOIN eventos ev    ON ev.id_evento = p.id_evento
     WHERE p.id_presentacion <> $1
       AND tsrange(p.inicio, p.fin) && tsrange($2::TIMESTAMP, $3::TIMESTAMP)
       AND ${porEscenario ? "p.id_escenario = $4" : "p.id_artista = $4"}
     LIMIT 1`,
    [excluir, p.inicio, p.fin, porEscenario ? p.id_escenario : p.id_artista]
  );
  const otro = rows[0];
  if (!otro) return error;
  if (otro.id_empresa !== req.usuario.id_empresa) {
    return new ErrorHttp(409, "El escenario ya está ocupado en ese horario por un evento de otra productora");
  }
  return new ErrorHttp(
    409,
    porEscenario
      ? `Se superpone con ${otro.artista} (${otro.desde} a ${otro.hasta}) en el escenario ${otro.escenario}`
      : `${otro.artista} ya toca de ${otro.desde} a ${otro.hasta} en ${otro.escenario} (${otro.evento})`
  );
};

const buscarPresentacion = async (idEvento, id) => {
  const { rows } = await pool.query(
    `SELECT id_presentacion, id_jornada, id_escenario, id_artista, headliner, ${hora("inicio")}, ${hora("fin")}
     FROM presentaciones WHERE id_presentacion = $1 AND id_evento = $2`,
    [id, idEvento]
  );
  if (!rows[0]) {
    throw new ErrorHttp(404, "Presentación no encontrada");
  }
  return rows[0];
};

export const crearPresentacion = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  await verificarPresentacion(req, evento, req.body);
  const extra = { id_evento: evento.id_evento, id_empresa: req.usuario.id_empresa };
  const { texto, valores } = insertar("presentaciones", req.body, COLUMNAS_PRESENTACION, extra);
  const { rows } = await pool.query(texto, valores).catch(async (e) => {
    throw await explicarSuperposicion(req, e, req.body);
  });
  res.status(201).json(await buscarPresentacion(evento.id_evento, rows[0].id_presentacion));
};

export const editarPresentacion = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const actual = await buscarPresentacion(evento.id_evento, req.params.idHijo);
  const nueva = { ...actual, ...req.body };
  if (nueva.fin <= nueva.inicio) {
    throw new ErrorHttp(400, "El show tiene que terminar después de empezar");
  }
  await verificarPresentacion(req, evento, nueva);
  const consulta = actualizar("presentaciones", req.body, COLUMNAS_PRESENTACION, { id_presentacion: actual.id_presentacion });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores).catch(async (e) => {
      throw await explicarSuperposicion(req, e, nueva, actual.id_presentacion);
    });
  }
  res.json(await buscarPresentacion(evento.id_evento, actual.id_presentacion));
};

export const eliminarPresentacion = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const { rowCount } = await pool.query(
    "DELETE FROM presentaciones WHERE id_presentacion = $1 AND id_evento = $2",
    [req.params.idHijo, evento.id_evento]
  );
  if (rowCount === 0) {
    throw new ErrorHttp(404, "Presentación no encontrada");
  }
  res.status(204).send();
};

// ─── Tarifas (RN-22: solo precio y vigencia; el cupo es la capacidad del sector) ─
const verificarTarifa = async (evento, t) => {
  const [espacio, jornada] = await Promise.all([
    pool.query("SELECT 1 FROM espacios WHERE id_espacio = $1 AND id_lugar = $2", [t.id_espacio, evento.id_lugar]),
    t.id_jornada ? pool.query("SELECT 1 FROM jornadas WHERE id_jornada = $1 AND id_evento = $2", [t.id_jornada, evento.id_evento]) : { rows: [1] }
  ]);
  if (!espacio.rows[0]) throw new ErrorHttp(400, "El sector no es del lugar del evento");
  if (!jornada.rows[0]) throw new ErrorHttp(400, "La jornada no es de este evento");
};

const entradasDe = (idTarifa) => contar("SELECT COUNT(*)::INT AS cantidad FROM entradas WHERE id_tarifa = $1", [idTarifa]);

const buscarTarifa = async (idEvento, id) => {
  const { rows } = await pool.query(
    `SELECT id_tarifa, id_espacio, id_jornada, nombre, precio, activa, ${hora("venta_desde")}, ${hora("venta_hasta")}
     FROM tarifas WHERE id_tarifa = $1 AND id_evento = $2`,
    [id, idEvento]
  );
  if (!rows[0]) {
    throw new ErrorHttp(404, "Tarifa no encontrada");
  }
  return rows[0];
};

export const crearTarifa = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  await verificarTarifa(evento, req.body);
  const extra = { id_evento: evento.id_evento, id_lugar: evento.id_lugar };
  const { texto, valores } = insertar("tarifas", req.body, COLUMNAS_TARIFA, extra);
  const { rows } = await pool.query(texto, valores);
  res.status(201).json(await buscarTarifa(evento.id_evento, rows[0].id_tarifa));
};

// Con entradas vendidas se puede cambiar el precio (las vendidas guardan el suyo, RN-28),
// pero no el sector ni la jornada.
export const editarTarifa = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const actual = await buscarTarifa(evento.id_evento, req.params.idHijo);
  const nueva = { ...actual, ...req.body };
  const cambiaDestino = nueva.id_espacio !== actual.id_espacio || nueva.id_jornada !== actual.id_jornada;
  if (cambiaDestino && (await entradasDe(actual.id_tarifa)) > 0) {
    throw new ErrorHttp(409, "La tarifa ya tiene entradas vendidas: no se le puede cambiar el sector ni la jornada");
  }
  if (nueva.venta_desde && nueva.venta_hasta && nueva.venta_hasta <= nueva.venta_desde) {
    throw new ErrorHttp(400, "El fin de la venta tiene que ser después del inicio");
  }
  await verificarTarifa(evento, nueva);
  const consulta = actualizar("tarifas", req.body, COLUMNAS_TARIFA, { id_tarifa: actual.id_tarifa });
  if (consulta) {
    await pool.query(consulta.texto, consulta.valores);
  }
  res.json(await buscarTarifa(evento.id_evento, actual.id_tarifa));
};

export const eliminarTarifa = async (req, res) => {
  const evento = await eventoModificable(req, req.params.id);
  const tarifa = await buscarTarifa(evento.id_evento, req.params.idHijo);
  if ((await entradasDe(tarifa.id_tarifa)) > 0) {
    throw new ErrorHttp(409, "La tarifa tiene entradas vendidas: desactivala en lugar de eliminarla");
  }
  await pool.query("DELETE FROM tarifas WHERE id_tarifa = $1", [tarifa.id_tarifa]);
  res.status(204).send();
};

// ─── Disponibilidad (capacidad, vendidas y libres por jornada y sector) ─────
export const obtenerDisponibilidad = async (req, res) => {
  const evento = await buscarEvento(req, req.params.id);
  const { rows } = await pool.query(
    "SELECT * FROM v_disponibilidad WHERE id_evento = $1 ORDER BY fecha, capacidad DESC",
    [evento.id_evento]
  );
  res.json(rows);
};
