-- 11 · Seed de demo
-- 3 productoras con su usuario, lugares y artistas propios; 1 festival de 3 días,
-- 2 recitales y clientes con compras (con service charge). Correr después de 10_seed_plataforma.sql.
--
-- Logins (contraseña de todos: demo123):
--   empresa:  staff@eventosdelcentro.com · staff@fiestasnorte.com · staff@produccionessur.com
--   cliente:  lucia.gomez@mail.com · martin.diaz@mail.com · sofia.perez@mail.com

-- ─── Productoras ────────────────────────────────────────────────────────────
-- Son las mismas del CRUD original: si ya existen (mismo CUIT) se actualizan.
INSERT INTO empresas (nombre, cuit, email, telefono, direccion, cargo_servicio_pct) VALUES
('Eventos del Centro', '30-71234567-8', 'contacto@eventosdelcentro.com', '351-4001122', 'Av. Colón 1200, Córdoba',     10),
('Fiestas Norte',      '30-70987654-3', 'info@fiestasnorte.com',         '351-4553344', 'Rafael Núñez 4500, Córdoba',  12),
('Producciones Sur',   '30-69876543-1', 'hola@produccionessur.com',      '351-4778899', 'Av. Sabattini 3000, Córdoba',  8)
ON CONFLICT (cuit) DO UPDATE SET cargo_servicio_pct = EXCLUDED.cargo_servicio_pct;

-- ─── Usuarios ───────────────────────────────────────────────────────────────
INSERT INTO usuarios (email, password_hash, nombre, apellido, dni, telefono, rol, id_empresa)
SELECT v.email, crypt('demo123', gen_salt('bf', 10)), v.nombre, v.apellido, v.dni, v.telefono, v.rol, e.id_empresa
FROM (VALUES
    ('staff@eventosdelcentro.com', 'Carla',  'Benítez', NULL,       NULL,          'empresa', '30-71234567-8'),
    ('staff@fiestasnorte.com',     'Javier', 'Ruiz',    NULL,       NULL,          'empresa', '30-70987654-3'),
    ('staff@produccionessur.com',  'Paula',  'Sosa',    NULL,       NULL,          'empresa', '30-69876543-1'),
    ('lucia.gomez@mail.com',       'Lucía',  'Gómez',   '38123456', '351-6112233', 'cliente', NULL),
    ('martin.diaz@mail.com',       'Martín', 'Díaz',    '40987654', '351-6445566', 'cliente', NULL),
    ('sofia.perez@mail.com',       'Sofía',  'Pérez',   '42555111', '11-55443322', 'cliente', NULL)
) AS v (email, nombre, apellido, dni, telefono, rol, cuit)
LEFT JOIN empresas e ON e.cuit = v.cuit;

-- Compra simulada: una tarifa y una cantidad. Calcula subtotal, service charge con el %
-- vigente de la productora y total; si queda pagada, emite las entradas.
CREATE FUNCTION pg_temp.comprar(
    p_email TEXT, p_id_tarifa INT, p_cantidad INT, p_fecha TIMESTAMP,
    p_medio TEXT, p_estado TEXT DEFAULT 'pagada'
) RETURNS INT AS $$
DECLARE
    v_usuario  INT;
    v_evento   INT;
    v_precio   NUMERIC(12,2);
    v_pct      NUMERIC(5,2);
    v_subtotal NUMERIC(12,2);
    v_cargo    NUMERIC(12,2);
    v_compra   INT;
BEGIN
    SELECT id_usuario INTO v_usuario FROM usuarios WHERE email = p_email;
    SELECT t.id_evento, t.precio, em.cargo_servicio_pct INTO v_evento, v_precio, v_pct
    FROM tarifas t
    JOIN eventos ev  ON ev.id_evento = t.id_evento
    JOIN empresas em ON em.id_empresa = ev.id_empresa
    WHERE t.id_tarifa = p_id_tarifa;

    v_subtotal := v_precio * p_cantidad;
    v_cargo    := round(v_subtotal * v_pct / 100, 2);

    INSERT INTO compras (id_usuario, id_evento, fecha, subtotal, cargo_servicio_pct, cargo_servicio, total,
                         medio_pago, referencia_pago, estado)
    VALUES (v_usuario, v_evento, p_fecha, v_subtotal, v_pct, v_cargo, v_subtotal + v_cargo,
            p_medio, 'SIM-' || upper(substr(md5(random()::text), 1, 10)), p_estado)
    RETURNING id_compra INTO v_compra;

    IF p_estado = 'pagada' THEN
        INSERT INTO entradas (id_compra, id_evento, id_tarifa, precio_pagado)
        SELECT v_compra, v_evento, p_id_tarifa, v_precio FROM generate_series(1, p_cantidad);
    END IF;
    RETURN v_compra;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    e_centro INT;
    e_norte  INT;
    e_sur    INT;
    l_galpon INT;
    l_punilla INT;
    l_movistar INT;
    ev_fest  INT;
    ev_lali  INT;
    ev_cali  INT;
    j1 INT; j2 INT; j3 INT;
    t_abono INT; t_vip INT; t_dia1 INT;
    t_lali_campo INT; t_lali_baja INT; t_lali_alta INT;
    t_cali_preventa INT;
BEGIN
    SELECT id_empresa INTO e_centro FROM empresas WHERE cuit = '30-71234567-8';
    SELECT id_empresa INTO e_norte  FROM empresas WHERE cuit = '30-70987654-3';
    SELECT id_empresa INTO e_sur    FROM empresas WHERE cuit = '30-69876543-1';
    SELECT id_lugar INTO l_punilla  FROM lugares WHERE id_empresa IS NULL AND nombre = 'Aeródromo Santa María de Punilla';
    SELECT id_lugar INTO l_movistar FROM lugares WHERE id_empresa IS NULL AND nombre = 'Movistar Arena';

    -- ─── Lugares propios (privados de cada productora) ─────────────────────
    WITH l AS (
        INSERT INTO lugares (id_empresa, nombre, tipo, direccion, ciudad, provincia)
        VALUES (e_centro, 'Club Paraguay', 'club', 'Marcelo T. de Alvear 651', 'Córdoba', 'Córdoba')
        RETURNING id_lugar
    ), esc AS (
        INSERT INTO escenarios (id_lugar, nombre) SELECT id_lugar, 'Principal' FROM l
    )
    INSERT INTO espacios (id_lugar, nombre, capacidad) SELECT id_lugar, 'General', 800 FROM l;

    INSERT INTO lugares (id_empresa, nombre, tipo, direccion, ciudad, provincia)
    VALUES (e_sur, 'Galpón Sur', 'otro', 'Av. Sabattini 3200', 'Córdoba', 'Córdoba')
    RETURNING id_lugar INTO l_galpon;
    INSERT INTO escenarios (id_lugar, nombre) VALUES (l_galpon, 'Principal');
    INSERT INTO espacios (id_lugar, nombre, capacidad) VALUES (l_galpon, 'General', 1500);

    -- ─── Artistas ──────────────────────────────────────────────────────────
    INSERT INTO artistas (id_empresa, nombre, genero, pais) VALUES
        (e_centro, 'La Renga',                         'Rock',        'Argentina'),
        (e_centro, 'Divididos',                        'Rock',        'Argentina'),
        (e_centro, 'Babasónicos',                      'Rock',        'Argentina'),
        (e_centro, 'Airbag',                           'Rock',        'Argentina'),
        (e_centro, 'Ciro y los Persas',                'Rock',        'Argentina'),
        (e_centro, 'Las Pastillas del Abuelo',         'Rock',        'Argentina'),
        (e_centro, 'El Mató a un Policía Motorizado',  'Indie',       'Argentina'),
        (e_centro, 'Usted Señálemelo',                 'Indie',       'Argentina'),
        (e_centro, 'Miranda!',                         'Pop',         'Argentina'),
        (e_centro, 'Wos',                              'Rap',         'Argentina'),
        (e_centro, 'Dillom',                           'Trap',        'Argentina'),
        (e_centro, 'Nicki Nicole',                     'Trap',        'Argentina'),
        (e_centro, 'Peces Raros',                      'Electrónica', 'Argentina'),
        (e_centro, 'Hernán Cattáneo',                  'Electrónica', 'Argentina'),
        (e_norte,  'Lali',                             'Pop',         'Argentina'),
        (e_norte,  'Emilia',                           'Pop',         'Argentina'),
        (e_sur,    'Los Caligaris',                    'Rock',        'Argentina'),
        (e_sur,    'Bandalos Chinos',                  'Indie',       'Argentina');

    -- ─── Festival de 3 días (Eventos del Centro, lugar de la plataforma con plano) ─
    INSERT INTO eventos (id_empresa, id_lugar, nombre, descripcion, tipo, fecha_inicio, fecha_fin, estado)
    VALUES (e_centro, l_punilla, 'Punilla Rock Fest 2027',
            'Tres días de rock, indie, trap y electrónica en el valle de Punilla.',
            'festival', '2027-02-13', '2027-02-15', 'publicado')
    RETURNING id_evento INTO ev_fest;

    INSERT INTO jornadas (id_evento, fecha, hora_apertura, nombre) VALUES (ev_fest, '2027-02-13', '16:00', 'Día 1') RETURNING id_jornada INTO j1;
    INSERT INTO jornadas (id_evento, fecha, hora_apertura, nombre) VALUES (ev_fest, '2027-02-14', '16:00', 'Día 2') RETURNING id_jornada INTO j2;
    INSERT INTO jornadas (id_evento, fecha, hora_apertura, nombre) VALUES (ev_fest, '2027-02-15', '16:00', 'Día 3 · Cierre') RETURNING id_jornada INTO j3;

    INSERT INTO evento_escenarios (id_evento, id_escenario, id_lugar)
    SELECT ev_fest, id_escenario, id_lugar FROM escenarios WHERE id_lugar = l_punilla;

    -- Line-up: (jornada, escenario, artista, inicio, fin, headliner)
    INSERT INTO presentaciones (id_evento, id_empresa, id_jornada, id_escenario, id_artista, inicio, fin, headliner)
    SELECT ev_fest, e_centro, v.id_jornada, sc.id_escenario, a.id_artista, v.inicio::timestamp, v.fin::timestamp, v.headliner
    FROM (VALUES
        (j1, 'Montaña',           'Peces Raros',                     '2027-02-13 18:00', '2027-02-13 19:00', FALSE),
        (j1, 'Sur',               'Usted Señálemelo',                '2027-02-13 19:00', '2027-02-13 20:00', FALSE),
        (j1, 'Norte',             'Airbag',                          '2027-02-13 20:00', '2027-02-13 21:30', FALSE),
        (j1, 'Sur',               'Wos',                             '2027-02-13 21:00', '2027-02-13 22:15', FALSE),
        (j1, 'Norte',             'La Renga',                        '2027-02-13 22:30', '2027-02-14 00:30', TRUE),
        (j1, 'Carpa Electrónica', 'Hernán Cattáneo',                 '2027-02-14 00:00', '2027-02-14 03:00', FALSE),
        (j2, 'Montaña',           'El Mató a un Policía Motorizado', '2027-02-14 18:00', '2027-02-14 19:15', FALSE),
        (j2, 'Sur',               'Miranda!',                        '2027-02-14 19:30', '2027-02-14 20:45', FALSE),
        (j2, 'Norte',             'Ciro y los Persas',               '2027-02-14 20:00', '2027-02-14 21:30', FALSE),
        (j2, 'Sur',               'Dillom',                          '2027-02-14 21:15', '2027-02-14 22:15', FALSE),
        (j2, 'Norte',             'Divididos',                       '2027-02-14 22:30', '2027-02-15 00:30', TRUE),
        (j3, 'Montaña',           'Peces Raros',                     '2027-02-15 18:00', '2027-02-15 19:00', FALSE),
        (j3, 'Sur',               'Wos',                             '2027-02-15 19:00', '2027-02-15 20:00', FALSE),
        (j3, 'Norte',             'Las Pastillas del Abuelo',        '2027-02-15 20:00', '2027-02-15 21:30', FALSE),
        (j3, 'Sur',               'Nicki Nicole',                    '2027-02-15 21:00', '2027-02-15 22:15', FALSE),
        (j3, 'Norte',             'Babasónicos',                     '2027-02-15 22:30', '2027-02-16 00:30', TRUE)
    ) AS v (id_jornada, escenario, artista, inicio, fin, headliner)
    JOIN escenarios sc ON sc.id_lugar = l_punilla AND sc.nombre = v.escenario
    JOIN artistas a    ON a.id_empresa = e_centro AND a.nombre = v.artista;

    -- Tarifas: entrada por día en Campo, abono de 3 días en Campo y VIP (solo abono)
    INSERT INTO tarifas (id_evento, id_lugar, id_espacio, id_jornada, nombre, precio, venta_desde, venta_hasta)
    SELECT ev_fest, l_punilla, es.id_espacio, v.id_jornada, v.nombre, v.precio, '2026-09-01', '2027-02-15 23:59'
    FROM (VALUES
        ('Campo General', j1,   'General · Día 1',  60000),
        ('Campo General', j2,   'General · Día 2',  60000),
        ('Campo General', j3,   'General · Día 3',  65000),
        ('Campo General', NULL, 'Abono 3 días',    150000),
        ('VIP',           NULL, 'Abono VIP',       300000)
    ) AS v (espacio, id_jornada, nombre, precio)
    JOIN espacios es ON es.id_lugar = l_punilla AND es.nombre = v.espacio;

    SELECT id_tarifa INTO t_dia1  FROM tarifas WHERE id_evento = ev_fest AND nombre = 'General · Día 1';
    SELECT id_tarifa INTO t_abono FROM tarifas WHERE id_evento = ev_fest AND nombre = 'Abono 3 días';
    SELECT id_tarifa INTO t_vip   FROM tarifas WHERE id_evento = ev_fest AND nombre = 'Abono VIP';

    -- ─── Recital 1: Lali en Movistar Arena (Fiestas Norte) ─────────────────
    INSERT INTO eventos (id_empresa, id_lugar, nombre, descripcion, tipo, fecha_inicio, fecha_fin, estado)
    VALUES (e_norte, l_movistar, 'Lali en el Movistar Arena', 'Gira 2026.', 'recital', '2026-11-21', '2026-11-21', 'publicado')
    RETURNING id_evento INTO ev_lali;
    INSERT INTO jornadas (id_evento, fecha, hora_apertura) VALUES (ev_lali, '2026-11-21', '19:00') RETURNING id_jornada INTO j1;
    INSERT INTO evento_escenarios (id_evento, id_escenario, id_lugar)
    SELECT ev_lali, id_escenario, id_lugar FROM escenarios WHERE id_lugar = l_movistar;

    INSERT INTO presentaciones (id_evento, id_empresa, id_jornada, id_escenario, id_artista, inicio, fin, headliner)
    SELECT ev_lali, e_norte, j1, sc.id_escenario, a.id_artista, v.inicio::timestamp, v.fin::timestamp, v.headliner
    FROM (VALUES
        ('Emilia', '2026-11-21 20:00', '2026-11-21 20:45', FALSE),
        ('Lali',   '2026-11-21 21:30', '2026-11-21 23:30', TRUE)
    ) AS v (artista, inicio, fin, headliner)
    JOIN escenarios sc ON sc.id_lugar = l_movistar AND sc.nombre = 'Principal'
    JOIN artistas a    ON a.id_empresa = e_norte AND a.nombre = v.artista;

    INSERT INTO tarifas (id_evento, id_lugar, id_espacio, id_jornada, nombre, precio, venta_desde, venta_hasta)
    SELECT ev_lali, l_movistar, es.id_espacio, j1, 'General', v.precio, '2026-08-01', '2026-11-21 21:00'
    FROM (VALUES ('Campo', 80000), ('Platea Baja', 95000), ('Platea Alta', 70000)) AS v (espacio, precio)
    JOIN espacios es ON es.id_lugar = l_movistar AND es.nombre = v.espacio;

    SELECT t.id_tarifa INTO t_lali_campo FROM tarifas t JOIN espacios es USING (id_espacio) WHERE t.id_evento = ev_lali AND es.nombre = 'Campo';
    SELECT t.id_tarifa INTO t_lali_baja  FROM tarifas t JOIN espacios es USING (id_espacio) WHERE t.id_evento = ev_lali AND es.nombre = 'Platea Baja';
    SELECT t.id_tarifa INTO t_lali_alta  FROM tarifas t JOIN espacios es USING (id_espacio) WHERE t.id_evento = ev_lali AND es.nombre = 'Platea Alta';

    -- ─── Recital 2: Los Caligaris en lugar propio (Producciones Sur) ───────
    INSERT INTO eventos (id_empresa, id_lugar, nombre, descripcion, tipo, fecha_inicio, fecha_fin, estado)
    VALUES (e_sur, l_galpon, 'Los Caligaris · Fiesta de fin de año', NULL, 'recital', '2026-12-05', '2026-12-05', 'publicado')
    RETURNING id_evento INTO ev_cali;
    INSERT INTO jornadas (id_evento, fecha, hora_apertura) VALUES (ev_cali, '2026-12-05', '20:00') RETURNING id_jornada INTO j1;
    INSERT INTO evento_escenarios (id_evento, id_escenario, id_lugar)
    SELECT ev_cali, id_escenario, id_lugar FROM escenarios WHERE id_lugar = l_galpon;

    INSERT INTO presentaciones (id_evento, id_empresa, id_jornada, id_escenario, id_artista, inicio, fin, headliner)
    SELECT ev_cali, e_sur, j1, sc.id_escenario, a.id_artista, v.inicio::timestamp, v.fin::timestamp, v.headliner
    FROM (VALUES
        ('Bandalos Chinos', '2026-12-05 21:00', '2026-12-05 22:00', FALSE),
        ('Los Caligaris',   '2026-12-05 22:30', '2026-12-06 00:30', TRUE)
    ) AS v (artista, inicio, fin, headliner)
    JOIN escenarios sc ON sc.id_lugar = l_galpon AND sc.nombre = 'Principal'
    JOIN artistas a    ON a.id_empresa = e_sur AND a.nombre = v.artista;

    INSERT INTO tarifas (id_evento, id_lugar, id_espacio, id_jornada, nombre, precio, venta_desde, venta_hasta)
    SELECT ev_cali, l_galpon, es.id_espacio, j1, v.nombre, v.precio, v.desde::timestamp, v.hasta::timestamp
    FROM (VALUES
        ('Preventa', 25000, '2026-09-01', '2026-11-01'),
        ('General',  32000, '2026-11-01', '2026-12-05 22:00')
    ) AS v (nombre, precio, desde, hasta)
    JOIN espacios es ON es.id_lugar = l_galpon AND es.nombre = 'General';

    SELECT id_tarifa INTO t_cali_preventa FROM tarifas WHERE id_evento = ev_cali AND nombre = 'Preventa';

    -- ─── Compras (pago simulado) ───────────────────────────────────────────
    PERFORM pg_temp.comprar('lucia.gomez@mail.com', t_abono,         2, '2026-09-05 14:10', 'credito');
    PERFORM pg_temp.comprar('martin.diaz@mail.com', t_dia1,          4, '2026-09-20 21:45', 'debito');
    PERFORM pg_temp.comprar('sofia.perez@mail.com', t_vip,           1, '2026-10-02 10:30', 'credito');
    PERFORM pg_temp.comprar('lucia.gomez@mail.com', t_lali_campo,    2, '2026-08-15 12:00', 'credito');
    PERFORM pg_temp.comprar('martin.diaz@mail.com', t_lali_baja,     3, '2026-10-05 18:20', 'transferencia');
    PERFORM pg_temp.comprar('sofia.perez@mail.com', t_cali_preventa, 2, '2026-10-10 09:05', 'debito');
    -- Pago rechazado (tarjeta terminada en 0000): queda la compra, sin entradas
    PERFORM pg_temp.comprar('martin.diaz@mail.com', t_lali_alta,     2, '2026-10-11 23:00', 'credito', 'rechazada');
END;
$$;

DROP FUNCTION pg_temp.comprar(TEXT, INT, INT, TIMESTAMP, TEXT, TEXT);
