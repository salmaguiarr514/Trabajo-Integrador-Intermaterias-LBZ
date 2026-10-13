-- 05 · Eventos, jornadas, escenarios habilitados y presentaciones (line-up)

CREATE TABLE eventos (
    id_evento      SERIAL PRIMARY KEY,
    id_empresa     INT NOT NULL REFERENCES empresas (id_empresa) ON DELETE RESTRICT,
    id_lugar       INT NOT NULL REFERENCES lugares (id_lugar) ON DELETE RESTRICT,
    nombre         VARCHAR(150) NOT NULL,
    descripcion    TEXT,
    tipo           VARCHAR(10) NOT NULL CHECK (tipo IN ('recital', 'festival')),
    fecha_inicio   DATE NOT NULL,
    fecha_fin      DATE NOT NULL,
    estado         VARCHAR(12) NOT NULL DEFAULT 'borrador'
                   CHECK (estado IN ('borrador', 'publicado', 'agotado', 'cancelado', 'finalizado')),
    imagen_url     VARCHAR(300),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT eventos_fechas_check CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT eventos_lugar_uk   UNIQUE (id_evento, id_lugar),       -- destino de FK compuesta
    CONSTRAINT eventos_empresa_uk UNIQUE (id_evento, id_empresa)      -- destino de FK compuesta
);

CREATE INDEX eventos_id_empresa_idx   ON eventos (id_empresa);
CREATE INDEX eventos_id_lugar_idx     ON eventos (id_lugar);
CREATE INDEX eventos_estado_fecha_idx ON eventos (estado, fecha_inicio);

CREATE TABLE jornadas (
    id_jornada    SERIAL PRIMARY KEY,
    id_evento     INT NOT NULL REFERENCES eventos (id_evento) ON DELETE CASCADE,
    fecha         DATE NOT NULL,
    hora_apertura TIME,
    nombre        VARCHAR(60),                                        -- Día 1, Noche de cierre...
    CONSTRAINT jornadas_fecha_uk  UNIQUE (id_evento, fecha),
    CONSTRAINT jornadas_evento_uk UNIQUE (id_jornada, id_evento)      -- destino de FK compuesta
);

-- Escenarios del lugar que habilita cada evento (N:M)
CREATE TABLE evento_escenarios (
    id_evento    INT NOT NULL,
    id_escenario INT NOT NULL,
    id_lugar     INT NOT NULL,   -- copia controlada: el escenario es del lugar del evento
    PRIMARY KEY (id_evento, id_escenario),
    FOREIGN KEY (id_evento, id_lugar) REFERENCES eventos (id_evento, id_lugar)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_escenario, id_lugar) REFERENCES escenarios (id_escenario, id_lugar)
        ON DELETE RESTRICT
);

CREATE TABLE presentaciones (
    id_presentacion SERIAL PRIMARY KEY,
    id_evento       INT NOT NULL,
    id_empresa      INT NOT NULL,   -- copia controlada: el artista es de la productora del evento
    id_jornada      INT NOT NULL,
    id_escenario    INT NOT NULL,
    id_artista      INT NOT NULL,
    inicio          TIMESTAMP NOT NULL,
    fin             TIMESTAMP NOT NULL,
    headliner       BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT presentaciones_horario_check CHECK (fin > inicio),
    FOREIGN KEY (id_evento, id_empresa)   REFERENCES eventos (id_evento, id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_jornada, id_evento)   REFERENCES jornadas (id_jornada, id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_evento, id_escenario) REFERENCES evento_escenarios (id_evento, id_escenario) ON DELETE CASCADE,
    FOREIGN KEY (id_artista, id_empresa)  REFERENCES artistas (id_artista, id_empresa) ON DELETE RESTRICT,
    -- Un escenario no tiene dos shows superpuestos
    CONSTRAINT presentaciones_escenario_excl
        EXCLUDE USING gist (id_escenario WITH =, tsrange(inicio, fin) WITH &&),
    -- Un artista no está en dos lugares a la vez
    CONSTRAINT presentaciones_artista_excl
        EXCLUDE USING gist (id_artista WITH =, tsrange(inicio, fin) WITH &&)
);

CREATE INDEX presentaciones_id_evento_idx ON presentaciones (id_evento);
