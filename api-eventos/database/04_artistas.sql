-- 04 · Artistas
-- Cada productora carga los suyos: no hay catálogo de la plataforma.

CREATE TABLE artistas (
    id_artista     SERIAL PRIMARY KEY,
    id_empresa     INT NOT NULL REFERENCES empresas (id_empresa) ON DELETE RESTRICT,
    nombre         VARCHAR(150) NOT NULL,
    genero         VARCHAR(60),
    pais           VARCHAR(60),
    bio            TEXT,
    imagen_url     VARCHAR(300),
    activo         BOOLEAN   NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT artistas_nombre_uk  UNIQUE (id_empresa, nombre),
    CONSTRAINT artistas_empresa_uk UNIQUE (id_artista, id_empresa)    -- destino de FK compuesta
);
