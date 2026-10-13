-- 02 · Empresas (productoras / tenants) y usuarios
-- La tabla empresas ya existe en Supabase (el CRUD actual). Este script sirve para
-- las dos situaciones: base vacía (la crea) o base existente (le agrega lo nuevo sin perder datos).

CREATE TABLE IF NOT EXISTS empresas (
    id_empresa     SERIAL PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    cuit           VARCHAR(13)  NOT NULL UNIQUE,
    email          VARCHAR(150),
    telefono       VARCHAR(30),
    direccion      VARCHAR(200),
    activo         BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url VARCHAR(300);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cargo_servicio_pct NUMERIC(5,2) NOT NULL DEFAULT 10;

UPDATE empresas SET activo = TRUE WHERE activo IS NULL;
UPDATE empresas SET fecha_creacion = NOW() WHERE fecha_creacion IS NULL;
ALTER TABLE empresas ALTER COLUMN activo SET NOT NULL;
ALTER TABLE empresas ALTER COLUMN fecha_creacion SET NOT NULL;

ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_cargo_servicio_pct_check;
ALTER TABLE empresas ADD CONSTRAINT empresas_cargo_servicio_pct_check
    CHECK (cargo_servicio_pct BETWEEN 0 AND 100);

CREATE TABLE usuarios (
    id_usuario     SERIAL PRIMARY KEY,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,           -- bcrypt
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100),
    dni            VARCHAR(10),
    telefono       VARCHAR(30),
    rol            VARCHAR(15)  NOT NULL CHECK (rol IN ('superadmin', 'empresa', 'cliente')),
    id_empresa     INT REFERENCES empresas (id_empresa) ON DELETE RESTRICT,
    activo         BOOLEAN   NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Solo el personal de una productora tiene empresa
    CONSTRAINT usuarios_rol_empresa_check CHECK ((rol = 'empresa') = (id_empresa IS NOT NULL))
);

CREATE INDEX usuarios_id_empresa_idx ON usuarios (id_empresa);
