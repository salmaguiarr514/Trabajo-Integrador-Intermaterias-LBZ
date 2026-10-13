-- 08 · Vistas
-- Datos derivados que no se guardan, para que nunca queden desactualizados (docs/der/DER.md, sección 6).
-- Una entrada "ocupa lugar" si está válida y su compra no fue rechazada ni cancelada.

-- Lugares con capacidad total calculada y origen (plataforma / propio)
CREATE OR REPLACE VIEW v_lugares AS
SELECT
    l.*,
    CASE WHEN l.id_empresa IS NULL THEN 'plataforma' ELSE 'propio' END AS origen,
    (SELECT COALESCE(SUM(capacidad), 0) FROM espacios es WHERE es.id_lugar = l.id_lugar)::INT AS capacidad_total,
    (SELECT COUNT(*) FROM espacios es WHERE es.id_lugar = l.id_lugar)::INT AS cantidad_espacios,
    (SELECT COUNT(*) FROM escenarios sc WHERE sc.id_lugar = l.id_lugar)::INT AS cantidad_escenarios,
    (l.plano_ancho IS NOT NULL) AS tiene_plano
FROM lugares l;

-- Disponibilidad por evento, jornada y espacio (RN-22, RN-23).
-- Solo los espacios que el evento vende (tienen al menos una tarifa activa).
-- vendidas = entradas de esa jornada + entradas de abono (ocupan lugar en todas las jornadas).
CREATE OR REPLACE VIEW v_disponibilidad AS
WITH espacios_evento AS (
    SELECT DISTINCT t.id_evento, t.id_espacio
    FROM tarifas t
    WHERE t.activa
),
ocupadas AS (
    SELECT en.id_evento, t.id_espacio, t.id_jornada, COUNT(*) AS cantidad
    FROM entradas en
    JOIN tarifas t ON t.id_tarifa = en.id_tarifa
    JOIN compras c ON c.id_compra = en.id_compra
    WHERE en.estado = 'valida'
      AND c.estado IN ('pendiente', 'pagada')
    GROUP BY en.id_evento, t.id_espacio, t.id_jornada
)
SELECT
    ee.id_evento,
    j.id_jornada,
    j.fecha,
    es.id_espacio,
    es.nombre AS espacio,
    es.capacidad,
    COALESCE(SUM(o.cantidad), 0)::INT AS vendidas,
    (es.capacidad - COALESCE(SUM(o.cantidad), 0))::INT AS disponibles
FROM espacios_evento ee
JOIN jornadas j  ON j.id_evento = ee.id_evento
JOIN espacios es ON es.id_espacio = ee.id_espacio
LEFT JOIN ocupadas o
       ON o.id_evento = ee.id_evento
      AND o.id_espacio = ee.id_espacio
      AND (o.id_jornada = j.id_jornada OR o.id_jornada IS NULL)
GROUP BY ee.id_evento, j.id_jornada, j.fecha, es.id_espacio, es.nombre, es.capacidad;

-- Cartelera: eventos publicados o agotados, con lugar, productora, headliners y precio desde
CREATE OR REPLACE VIEW v_cartelera AS
SELECT
    ev.id_evento,
    ev.nombre,
    ev.descripcion,
    ev.tipo,
    ev.fecha_inicio,
    ev.fecha_fin,
    ev.estado,
    ev.imagen_url,
    ev.id_empresa,
    em.nombre AS productora,
    l.id_lugar,
    l.nombre  AS lugar,
    l.ciudad,
    l.provincia,
    (SELECT string_agg(DISTINCT a.nombre, ', ')
       FROM presentaciones p
       JOIN artistas a ON a.id_artista = p.id_artista
      WHERE p.id_evento = ev.id_evento AND p.headliner) AS headliners,
    (SELECT string_agg(DISTINCT a.genero, ', ')
       FROM presentaciones p
       JOIN artistas a ON a.id_artista = p.id_artista
      WHERE p.id_evento = ev.id_evento AND a.genero IS NOT NULL) AS generos,
    (SELECT MIN(t.precio) FROM tarifas t WHERE t.id_evento = ev.id_evento AND t.activa) AS precio_desde
FROM eventos ev
JOIN empresas em ON em.id_empresa = ev.id_empresa
JOIN lugares  l  ON l.id_lugar = ev.id_lugar
WHERE ev.estado IN ('publicado', 'agotado')
  AND em.activo;

-- Asistencia por evento y jornada: entradas que valen para la jornada vs. ingresos registrados
CREATE OR REPLACE VIEW v_asistencia AS
SELECT
    j.id_evento,
    j.id_jornada,
    j.fecha,
    (SELECT COUNT(*)
       FROM entradas en
       JOIN tarifas t ON t.id_tarifa = en.id_tarifa
       JOIN compras c ON c.id_compra = en.id_compra
      WHERE en.id_evento = j.id_evento
        AND en.estado = 'valida'
        AND c.estado = 'pagada'
        AND (t.id_jornada = j.id_jornada OR t.id_jornada IS NULL))::INT AS entradas,
    (SELECT COUNT(*) FROM ingresos i WHERE i.id_jornada = j.id_jornada)::INT AS ingresos
FROM jornadas j;

-- Recaudación por productora y mes (para el superadmin). Solo compras pagadas.
CREATE OR REPLACE VIEW v_recaudacion AS
SELECT
    em.id_empresa,
    em.nombre AS productora,
    date_trunc('month', c.fecha)::DATE AS mes,
    COUNT(*)::INT              AS compras,
    SUM(c.subtotal)            AS subtotal_productora,
    SUM(c.cargo_servicio)      AS service_charge,
    SUM(c.total)               AS total
FROM compras c
JOIN eventos  ev ON ev.id_evento = c.id_evento
JOIN empresas em ON em.id_empresa = ev.id_empresa
WHERE c.estado = 'pagada'
GROUP BY em.id_empresa, em.nombre, date_trunc('month', c.fecha);
