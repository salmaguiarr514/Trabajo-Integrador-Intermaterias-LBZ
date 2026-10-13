-- 03 · Lugares, escenarios, espacios (sectores) y elementos del plano
-- lugares.id_empresa NULL = lugar de la plataforma (lo usan todas las productoras).
-- Con valor = lugar propio y privado de esa productora.

CREATE TABLE lugares (
    id_lugar       SERIAL PRIMARY KEY,
    id_empresa     INT REFERENCES empresas (id_empresa) ON DELETE RESTRICT,
    nombre         VARCHAR(150) NOT NULL,
    tipo           VARCHAR(20)  NOT NULL CHECK (tipo IN ('estadio', 'arena', 'teatro', 'predio', 'club', 'otro')),
    direccion      VARCHAR(200) NOT NULL,
    ciudad         VARCHAR(100) NOT NULL,
    provincia      VARCHAR(100) NOT NULL,
    imagen_url     VARCHAR(300),
    plano_ancho    INT,
    plano_alto     INT,
    activo         BOOLEAN   NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT lugares_nombre_uk UNIQUE NULLS NOT DISTINCT (id_empresa, nombre),
    CONSTRAINT lugares_plano_check CHECK (
        (plano_ancho IS NULL AND plano_alto IS NULL)
        OR (plano_ancho > 0 AND plano_alto > 0)
    )
);

CREATE TABLE escenarios (
    id_escenario SERIAL PRIMARY KEY,
    id_lugar     INT NOT NULL REFERENCES lugares (id_lugar) ON DELETE CASCADE,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  VARCHAR(300),
    geometria    JSONB CHECK (geometria IS NULL OR geometria ? 'tipo'),
    CONSTRAINT escenarios_nombre_uk UNIQUE (id_lugar, nombre),
    CONSTRAINT escenarios_lugar_uk  UNIQUE (id_escenario, id_lugar)   -- destino de FK compuesta
);

CREATE TABLE espacios (
    id_espacio SERIAL PRIMARY KEY,
    id_lugar   INT NOT NULL REFERENCES lugares (id_lugar) ON DELETE CASCADE,
    nombre     VARCHAR(100) NOT NULL,                                 -- Platea, Campo, VIP...
    modalidad  VARCHAR(10)  NOT NULL DEFAULT 'de_pie' CHECK (modalidad IN ('de_pie', 'sentado')),
    capacidad  INT NOT NULL CHECK (capacidad > 0),                    -- es el cupo del sector
    color      VARCHAR(7) CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    geometria  JSONB CHECK (geometria IS NULL OR geometria ? 'tipo'),
    CONSTRAINT espacios_nombre_uk UNIQUE (id_lugar, nombre),
    CONSTRAINT espacios_lugar_uk  UNIQUE (id_espacio, id_lugar)       -- destino de FK compuesta
);

CREATE TABLE elementos_plano (
    id_elemento SERIAL PRIMARY KEY,
    id_lugar    INT NOT NULL REFERENCES lugares (id_lugar) ON DELETE CASCADE,
    tipo        VARCHAR(15) NOT NULL CHECK (tipo IN ('cabina_dj', 'barra', 'banos', 'ingreso', 'mangrullo', 'otro')),
    etiqueta    VARCHAR(60),
    geometria   JSONB NOT NULL CHECK (geometria ? 'tipo')
);

CREATE INDEX lugares_id_empresa_idx ON lugares (id_empresa);
CREATE INDEX elementos_plano_id_lugar_idx ON elementos_plano (id_lugar);
