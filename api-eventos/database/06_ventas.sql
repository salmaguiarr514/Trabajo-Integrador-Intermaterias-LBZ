-- 06 · Tarifas, compras, entradas e ingresos (control de acceso)
-- Las tarifas no tienen cupo: el cupo es espacios.capacidad (ver v_disponibilidad).

CREATE TABLE tarifas (
    id_tarifa   SERIAL PRIMARY KEY,
    id_evento   INT NOT NULL,
    id_lugar    INT NOT NULL,   -- copia controlada: el espacio es del lugar del evento
    id_espacio  INT NOT NULL,
    id_jornada  INT,            -- NULL = abono (vale para todas las jornadas)
    nombre      VARCHAR(60) NOT NULL,                                 -- General, Preventa 1...
    precio      NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    venta_desde TIMESTAMP,
    venta_hasta TIMESTAMP,
    activa      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT tarifas_venta_check CHECK (venta_hasta > venta_desde),
    CONSTRAINT tarifas_nombre_uk UNIQUE NULLS NOT DISTINCT (id_evento, id_espacio, id_jornada, nombre),
    CONSTRAINT tarifas_evento_uk UNIQUE (id_tarifa, id_evento),       -- destino de FK compuesta
    FOREIGN KEY (id_evento, id_lugar)   REFERENCES eventos (id_evento, id_lugar)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_espacio, id_lugar)  REFERENCES espacios (id_espacio, id_lugar) ON DELETE RESTRICT,
    FOREIGN KEY (id_jornada, id_evento) REFERENCES jornadas (id_jornada, id_evento) ON DELETE CASCADE
);

CREATE INDEX tarifas_evento_espacio_idx ON tarifas (id_evento, id_espacio);

CREATE TABLE compras (
    id_compra          SERIAL PRIMARY KEY,
    id_usuario         INT NOT NULL REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
    id_evento          INT NOT NULL REFERENCES eventos (id_evento) ON DELETE RESTRICT,
    fecha              TIMESTAMP NOT NULL DEFAULT NOW(),
    subtotal           NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),         -- para la productora
    cargo_servicio_pct NUMERIC(5,2)  NOT NULL CHECK (cargo_servicio_pct BETWEEN 0 AND 100),  -- copia histórica
    cargo_servicio     NUMERIC(12,2) NOT NULL CHECK (cargo_servicio >= 0),   -- para la plataforma
    total              NUMERIC(12,2) NOT NULL,
    medio_pago         VARCHAR(15) NOT NULL CHECK (medio_pago IN ('credito', 'debito', 'transferencia')),
    referencia_pago    VARCHAR(40),                                          -- id de transacción ficticio
    estado             VARCHAR(10) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente', 'pagada', 'rechazada', 'cancelada')),
    CONSTRAINT compras_total_check CHECK (total = subtotal + cargo_servicio),
    CONSTRAINT compras_evento_uk UNIQUE (id_compra, id_evento)        -- destino de FK compuesta
);

CREATE INDEX compras_id_usuario_idx ON compras (id_usuario);
CREATE INDEX compras_id_evento_idx  ON compras (id_evento);

CREATE TABLE entradas (
    id_entrada    SERIAL PRIMARY KEY,
    id_compra     INT NOT NULL,
    id_evento     INT NOT NULL,   -- copia controlada: la tarifa es del mismo evento que la compra
    id_tarifa     INT NOT NULL,
    codigo        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),     -- se muestra como QR
    precio_pagado NUMERIC(12,2) NOT NULL CHECK (precio_pagado >= 0),
    estado        VARCHAR(8) NOT NULL DEFAULT 'valida' CHECK (estado IN ('valida', 'anulada')),
    CONSTRAINT entradas_evento_uk UNIQUE (id_entrada, id_evento),     -- destino de FK compuesta
    FOREIGN KEY (id_compra, id_evento) REFERENCES compras (id_compra, id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_tarifa, id_evento) REFERENCES tarifas (id_tarifa, id_evento) ON DELETE RESTRICT
);

CREATE INDEX entradas_id_tarifa_idx ON entradas (id_tarifa);

-- Control de acceso: cada escaneo válido del QR en la puerta
CREATE TABLE ingresos (
    id_ingreso SERIAL PRIMARY KEY,
    id_entrada INT NOT NULL,
    id_evento  INT NOT NULL,   -- copia controlada: la jornada es del mismo evento que la entrada
    id_jornada INT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    -- La entrada de un día entra una vez; el abono, una vez por jornada
    CONSTRAINT ingresos_entrada_jornada_uk UNIQUE (id_entrada, id_jornada),
    FOREIGN KEY (id_entrada, id_evento) REFERENCES entradas (id_entrada, id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_jornada, id_evento) REFERENCES jornadas (id_jornada, id_evento) ON DELETE RESTRICT
);
