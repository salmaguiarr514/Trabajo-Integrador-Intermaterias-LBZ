import pool from "../../data/db.js";

// Inicio del panel de la productora. Solo compras pagadas. Lo recaudado es el subtotal:
// lo que le queda a la productora (el service charge es de la plataforma, RN-27).
export const obtenerResumen = async (req, res) => {
  const idEmpresa = req.usuario.id_empresa;
  const [totales, proximos, ventas] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM eventos WHERE id_empresa = $1 AND estado IN ('publicado', 'agotado'))::INT AS publicados,
         (SELECT COUNT(*) FROM eventos WHERE id_empresa = $1 AND estado = 'borrador')::INT AS borradores,
         (SELECT COUNT(*) FROM entradas en
            JOIN compras c  ON c.id_compra = en.id_compra
            JOIN eventos ev ON ev.id_evento = c.id_evento
           WHERE ev.id_empresa = $1 AND en.estado = 'valida' AND c.estado = 'pagada')::INT AS entradas_vendidas,
         (SELECT COALESCE(SUM(c.subtotal), 0) FROM compras c JOIN eventos ev ON ev.id_evento = c.id_evento
           WHERE ev.id_empresa = $1 AND c.estado = 'pagada') AS recaudado`,
      [idEmpresa]
    ),
    pool.query(
      `SELECT ev.id_evento, ev.nombre, ev.tipo, ev.fecha_inicio, ev.fecha_fin, ev.estado,
              l.nombre AS lugar, l.ciudad,
              (SELECT COUNT(*) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
                WHERE en.id_evento = ev.id_evento AND en.estado = 'valida' AND c.estado = 'pagada')::INT AS entradas_vendidas,
              (SELECT COALESCE(SUM(c.subtotal), 0) FROM compras c
                WHERE c.id_evento = ev.id_evento AND c.estado = 'pagada') AS recaudado
       FROM eventos ev
       JOIN lugares l ON l.id_lugar = ev.id_lugar
       WHERE ev.id_empresa = $1 AND ev.fecha_fin >= CURRENT_DATE
         AND ev.estado IN ('borrador', 'publicado', 'agotado')
       ORDER BY ev.fecha_inicio
       LIMIT 5`,
      [idEmpresa]
    ),
    // Sin datos del cliente: solo qué se vendió, cuándo y por cuánto
    pool.query(
      `SELECT c.id_compra, to_char(c.fecha, 'YYYY-MM-DD"T"HH24:MI') AS fecha, ev.nombre AS evento, c.subtotal,
              (SELECT COUNT(*) FROM entradas en WHERE en.id_compra = c.id_compra)::INT AS cantidad
       FROM compras c
       JOIN eventos ev ON ev.id_evento = c.id_evento
       WHERE ev.id_empresa = $1 AND c.estado = 'pagada'
       ORDER BY c.fecha DESC
       LIMIT 5`,
      [idEmpresa]
    )
  ]);

  res.json({ ...totales.rows[0], proximos: proximos.rows, ultimas_ventas: ventas.rows });
};
