import pool from "../../data/db.js";

// Dashboard del superadmin. La recaudación sale de v_recaudacion (solo compras pagadas).
export const obtenerMetricas = async (req, res) => {
  const [totales, porEstado, porMes, porProductora] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM empresas WHERE activo)::INT           AS productoras_activas,
        (SELECT COUNT(*) FROM empresas)::INT                        AS productoras_total,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente')::INT  AS clientes,
        (SELECT COUNT(*) FROM entradas en JOIN compras c ON c.id_compra = en.id_compra
          WHERE en.estado = 'valida' AND c.estado = 'pagada')::INT  AS entradas_vendidas,
        (SELECT COALESCE(SUM(cargo_servicio), 0) FROM compras WHERE estado = 'pagada') AS service_charge_total,
        (SELECT COALESCE(SUM(total), 0) FROM compras WHERE estado = 'pagada')          AS ventas_total`),
    pool.query("SELECT estado, COUNT(*)::INT AS cantidad FROM eventos GROUP BY estado ORDER BY cantidad DESC"),
    pool.query(`
      SELECT mes, SUM(compras)::INT AS compras, SUM(service_charge) AS service_charge, SUM(total) AS total
      FROM v_recaudacion GROUP BY mes ORDER BY mes`),
    pool.query(`
      SELECT id_empresa, productora, SUM(compras)::INT AS compras,
             SUM(service_charge) AS service_charge, SUM(total) AS total
      FROM v_recaudacion GROUP BY id_empresa, productora ORDER BY service_charge DESC`)
  ]);

  res.json({
    ...totales.rows[0],
    eventos_por_estado: porEstado.rows,
    recaudacion_por_mes: porMes.rows,
    recaudacion_por_productora: porProductora.rows
  });
};
