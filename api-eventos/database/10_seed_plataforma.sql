-- 10 · Seed de la plataforma
-- Superadmin y catálogo de 20 lugares de la plataforma (id_empresa NULL),
-- con escenarios y espacios (capacidad = cupo). Tres lugares traen el plano dibujado.
-- Capacidades aproximadas: todo es ficticio.
--
-- Login del superadmin:  admin@backstage.com / admin123
-- crypt(..., gen_salt('bf')) genera un hash bcrypt compatible con bcryptjs.

INSERT INTO usuarios (email, password_hash, nombre, apellido, rol)
VALUES ('admin@backstage.com', crypt('admin123', gen_salt('bf', 10)), 'Equipo', 'Backstage', 'superadmin');

-- ─── Lugares ────────────────────────────────────────────────────────────────
INSERT INTO lugares (nombre, tipo, direccion, ciudad, provincia, plano_ancho, plano_alto) VALUES
('Estadio Mario Alberto Kempes',      'estadio', 'Av. Cárcano s/n',                'Córdoba',               'Córdoba',      NULL, NULL),
('Orfeo Superdomo',                   'arena',   'Av. Cardeñosa 3450',             'Córdoba',               'Córdoba',      NULL, NULL),
('Quality Espacio',                   'arena',   'Av. Cruz Roja Argentina 200',    'Córdoba',               'Córdoba',      NULL, NULL),
('Plaza de la Música',                'predio',  'Costanera y Bv. Mitre',          'Córdoba',               'Córdoba',      NULL, NULL),
('Aeródromo Santa María de Punilla',  'predio',  'Ruta Nacional 38 km 25',         'Santa María de Punilla','Córdoba',      1000, 700),
('Estadio Monumental',                'estadio', 'Av. Figueroa Alcorta 7597',      'Buenos Aires',          'CABA',         NULL, NULL),
('La Bombonera',                      'estadio', 'Brandsen 805',                   'Buenos Aires',          'CABA',         NULL, NULL),
('Estadio Único de La Plata',         'estadio', 'Av. 25 y 32',                    'La Plata',              'Buenos Aires', NULL, NULL),
('Movistar Arena',                    'arena',   'Humboldt 450',                   'Buenos Aires',          'CABA',         1000, 700),
('Estadio Obras',                     'arena',   'Av. del Libertador 7395',        'Buenos Aires',          'CABA',         NULL, NULL),
('Luna Park',                         'arena',   'Av. Eduardo Madero 470',         'Buenos Aires',          'CABA',         NULL, NULL),
('Teatro Gran Rex',                   'teatro',  'Av. Corrientes 857',             'Buenos Aires',          'CABA',         NULL, NULL),
('Teatro Ópera',                      'teatro',  'Av. Corrientes 860',             'Buenos Aires',          'CABA',         NULL, NULL),
('Hipódromo de San Isidro',           'predio',  'Av. Márquez 504',                'San Isidro',            'Buenos Aires', NULL, NULL),
('Hipódromo de Palermo',              'predio',  'Av. del Libertador 4101',        'Buenos Aires',          'CABA',         NULL, NULL),
('Tecnópolis',                        'predio',  'J. B. de La Salle 4397',         'Villa Martelli',        'Buenos Aires', NULL, NULL),
('Club Ciudad de Buenos Aires',       'predio',  'Av. del Libertador 7501',        'Buenos Aires',          'CABA',         NULL, NULL),
('Niceto Club',                       'club',    'Niceto Vega 5510',               'Buenos Aires',          'CABA',         1000, 700),
('Estadio Gigante de Arroyito',       'estadio', 'Av. Génova y Cordiviola',        'Rosario',               'Santa Fe',     NULL, NULL),
('Arena Maipú',                       'arena',   'Emilio Civit 791',               'Maipú',                 'Mendoza',      NULL, NULL);

-- ─── Escenarios ─────────────────────────────────────────────────────────────
INSERT INTO escenarios (id_lugar, nombre, descripcion, geometria)
SELECT l.id_lugar, v.nombre, v.descripcion, v.geometria::jsonb
FROM (VALUES
    ('Estadio Mario Alberto Kempes',     'Principal',   'Escenario en la cabecera norte', NULL),
    ('Orfeo Superdomo',                  'Principal',   NULL, NULL),
    ('Quality Espacio',                  'Principal',   NULL, NULL),
    ('Plaza de la Música',               'Principal',   'Escenario al aire libre', NULL),
    ('Aeródromo Santa María de Punilla', 'Norte',       'Escenario principal',           '{"tipo":"rect","x":380,"y":20,"w":240,"h":60}'),
    ('Aeródromo Santa María de Punilla', 'Sur',         'Segundo escenario',             '{"tipo":"rect","x":380,"y":620,"w":240,"h":60}'),
    ('Aeródromo Santa María de Punilla', 'Montaña',     'Escenario alternativo',         '{"tipo":"rect","x":40,"y":300,"w":60,"h":160}'),
    ('Aeródromo Santa María de Punilla', 'Carpa Electrónica', 'Carpa cerrada para música electrónica', '{"tipo":"poligono","puntos":[[860,260],[960,300],[960,420],[860,460]]}'),
    ('Estadio Monumental',               'Principal',   'Escenario en la cabecera Sívori', NULL),
    ('La Bombonera',                     'Principal',   NULL, NULL),
    ('Estadio Único de La Plata',        'Principal',   NULL, NULL),
    ('Movistar Arena',                   'Principal',   NULL,                            '{"tipo":"rect","x":400,"y":30,"w":200,"h":70}'),
    ('Estadio Obras',                    'Principal',   NULL, NULL),
    ('Luna Park',                        'Principal',   'Escenario central o en cabecera según el show', NULL),
    ('Teatro Gran Rex',                  'Escenario',   NULL, NULL),
    ('Teatro Ópera',                     'Escenario',   NULL, NULL),
    ('Hipódromo de San Isidro',          'Principal',   NULL, NULL),
    ('Hipódromo de San Isidro',          'Alternativo', NULL, NULL),
    ('Hipódromo de San Isidro',          'Electrónico', NULL, NULL),
    ('Hipódromo de Palermo',             'Principal',   NULL, NULL),
    ('Hipódromo de Palermo',             'Alternativo', NULL, NULL),
    ('Tecnópolis',                       'Principal',   NULL, NULL),
    ('Tecnópolis',                       'Alternativo', NULL, NULL),
    ('Club Ciudad de Buenos Aires',      'Principal',   NULL, NULL),
    ('Club Ciudad de Buenos Aires',      'Alternativo', NULL, NULL),
    ('Niceto Club',                      'Principal',   NULL,                            '{"tipo":"rect","x":380,"y":30,"w":240,"h":80}'),
    ('Estadio Gigante de Arroyito',      'Principal',   NULL, NULL),
    ('Arena Maipú',                      'Principal',   NULL, NULL)
) AS v (lugar, nombre, descripcion, geometria)
JOIN lugares l ON l.nombre = v.lugar AND l.id_empresa IS NULL;

-- ─── Espacios (sectores vendibles) ──────────────────────────────────────────
INSERT INTO espacios (id_lugar, nombre, modalidad, capacidad, color, geometria)
SELECT l.id_lugar, v.nombre, v.modalidad, v.capacidad, v.color, v.geometria::jsonb
FROM (VALUES
    ('Estadio Mario Alberto Kempes',     'Campo',              'de_pie',  25000, '#4CAF50', NULL),
    ('Estadio Mario Alberto Kempes',     'Platea Norte',       'sentado', 12000, '#2196F3', NULL),
    ('Estadio Mario Alberto Kempes',     'Platea Sur',         'sentado', 12000, '#3F51B5', NULL),
    ('Estadio Mario Alberto Kempes',     'Popular',            'de_pie',   8000, '#FF9800', NULL),
    ('Orfeo Superdomo',                  'Campo',              'de_pie',   6000, '#4CAF50', NULL),
    ('Orfeo Superdomo',                  'Platea',             'sentado',  4000, '#2196F3', NULL),
    ('Quality Espacio',                  'Campo',              'de_pie',   4500, '#4CAF50', NULL),
    ('Quality Espacio',                  'VIP',                'de_pie',    500, '#9C27B0', NULL),
    ('Plaza de la Música',               'General',            'de_pie',   3500, '#4CAF50', NULL),
    ('Aeródromo Santa María de Punilla', 'Campo General',      'de_pie',  40000, '#4CAF50', '{"tipo":"rect","x":120,"y":100,"w":720,"h":500}'),
    ('Aeródromo Santa María de Punilla', 'VIP',                'de_pie',   3000, '#9C27B0', '{"tipo":"rect","x":120,"y":610,"w":240,"h":70}'),
    ('Estadio Monumental',               'Campo',              'de_pie',  30000, '#4CAF50', NULL),
    ('Estadio Monumental',               'Platea San Martín',  'sentado', 15000, '#2196F3', NULL),
    ('Estadio Monumental',               'Platea Belgrano',    'sentado', 15000, '#3F51B5', NULL),
    ('Estadio Monumental',               'Sívori',             'de_pie',  10000, '#FF9800', NULL),
    ('Estadio Monumental',               'Centenario',         'de_pie',  10000, '#FF5722', NULL),
    ('La Bombonera',                     'Campo',              'de_pie',  15000, '#4CAF50', NULL),
    ('La Bombonera',                     'Plateas',            'sentado', 20000, '#2196F3', NULL),
    ('La Bombonera',                     'Popular',            'de_pie',  15000, '#FF9800', NULL),
    ('Estadio Único de La Plata',        'Campo',              'de_pie',  20000, '#4CAF50', NULL),
    ('Estadio Único de La Plata',        'Plateas',            'sentado', 30000, '#2196F3', NULL),
    ('Movistar Arena',                   'Campo',              'de_pie',   7000, '#4CAF50', '{"tipo":"rect","x":250,"y":130,"w":500,"h":300}'),
    ('Movistar Arena',                   'Platea Baja',        'sentado',  4000, '#2196F3', '{"tipo":"poligono","puntos":[[150,460],[850,460],[900,560],[100,560]]}'),
    ('Movistar Arena',                   'Platea Alta',        'sentado',  4000, '#3F51B5', '{"tipo":"poligono","puntos":[[100,580],[900,580],[950,680],[50,680]]}'),
    ('Estadio Obras',                    'Campo',              'de_pie',   3500, '#4CAF50', NULL),
    ('Estadio Obras',                    'Platea',             'sentado',  1500, '#2196F3', NULL),
    ('Luna Park',                        'Campo',              'de_pie',   4000, '#4CAF50', NULL),
    ('Luna Park',                        'Platea',             'sentado',  4000, '#2196F3', NULL),
    ('Teatro Gran Rex',                  'Platea',             'sentado',  1500, '#2196F3', NULL),
    ('Teatro Gran Rex',                  'Pullman',            'sentado',  1000, '#3F51B5', NULL),
    ('Teatro Gran Rex',                  'Super Pullman',      'sentado',   750, '#673AB7', NULL),
    ('Teatro Ópera',                     'Platea',             'sentado',  1200, '#2196F3', NULL),
    ('Teatro Ópera',                     'Pullman',            'sentado',   800, '#3F51B5', NULL),
    ('Hipódromo de San Isidro',          'Campo General',      'de_pie',  50000, '#4CAF50', NULL),
    ('Hipódromo de San Isidro',          'VIP',                'de_pie',   5000, '#9C27B0', NULL),
    ('Hipódromo de Palermo',             'Campo General',      'de_pie',  30000, '#4CAF50', NULL),
    ('Hipódromo de Palermo',             'VIP',                'de_pie',   3000, '#9C27B0', NULL),
    ('Tecnópolis',                       'General',            'de_pie',  20000, '#4CAF50', NULL),
    ('Club Ciudad de Buenos Aires',      'Campo',              'de_pie',  25000, '#4CAF50', NULL),
    ('Club Ciudad de Buenos Aires',      'VIP',                'de_pie',   2000, '#9C27B0', NULL),
    ('Niceto Club',                      'Pista',              'de_pie',    900, '#4CAF50', '{"tipo":"rect","x":200,"y":150,"w":600,"h":400}'),
    ('Niceto Club',                      'VIP',                'de_pie',    100, '#9C27B0', '{"tipo":"rect","x":820,"y":150,"w":150,"h":200}'),
    ('Estadio Gigante de Arroyito',      'Campo',              'de_pie',  15000, '#4CAF50', NULL),
    ('Estadio Gigante de Arroyito',      'Plateas',            'sentado', 25000, '#2196F3', NULL),
    ('Arena Maipú',                      'Campo',              'de_pie',   4000, '#4CAF50', NULL),
    ('Arena Maipú',                      'Platea',             'sentado',  2000, '#2196F3', NULL)
) AS v (lugar, nombre, modalidad, capacidad, color, geometria)
JOIN lugares l ON l.nombre = v.lugar AND l.id_empresa IS NULL;

-- ─── Elementos del plano (no se venden) ─────────────────────────────────────
INSERT INTO elementos_plano (id_lugar, tipo, etiqueta, geometria)
SELECT l.id_lugar, v.tipo, v.etiqueta, v.geometria::jsonb
FROM (VALUES
    ('Aeródromo Santa María de Punilla', 'mangrullo', 'Mangrullo de sonido', '{"tipo":"rect","x":460,"y":330,"w":80,"h":50}'),
    ('Aeródromo Santa María de Punilla', 'barra',     'Barra 1',             '{"tipo":"rect","x":130,"y":110,"w":80,"h":30}'),
    ('Aeródromo Santa María de Punilla', 'barra',     'Barra 2',             '{"tipo":"rect","x":750,"y":110,"w":80,"h":30}'),
    ('Aeródromo Santa María de Punilla', 'banos',     'Baños',               '{"tipo":"rect","x":760,"y":620,"w":80,"h":50}'),
    ('Aeródromo Santa María de Punilla', 'ingreso',   'Ingreso principal',   '{"tipo":"rect","x":0,"y":620,"w":100,"h":60}'),
    ('Movistar Arena',                   'ingreso',   'Ingreso Humboldt',    '{"tipo":"rect","x":450,"y":680,"w":100,"h":20}'),
    ('Movistar Arena',                   'mangrullo', 'Consola',             '{"tipo":"rect","x":470,"y":380,"w":60,"h":40}'),
    ('Niceto Club',                      'cabina_dj', 'Cabina DJ',           '{"tipo":"rect","x":450,"y":120,"w":100,"h":25}'),
    ('Niceto Club',                      'barra',     'Barra principal',     '{"tipo":"rect","x":30,"y":200,"w":60,"h":300}'),
    ('Niceto Club',                      'banos',     'Baños',               '{"tipo":"rect","x":30,"y":560,"w":120,"h":100}'),
    ('Niceto Club',                      'ingreso',   'Ingreso',             '{"tipo":"rect","x":440,"y":660,"w":120,"h":40}')
) AS v (lugar, tipo, etiqueta, geometria)
JOIN lugares l ON l.nombre = v.lugar AND l.id_empresa IS NULL;
