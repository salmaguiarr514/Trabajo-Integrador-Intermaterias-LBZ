-- 07 · Triggers
-- Reglas que no se pueden expresar con FK ni CHECK (docs/der/DER.md, sección 4.3).
-- Los errores usan ERRCODE check_violation (23514), que el backend traduce a 400/409.

-- ─── eventos_lugar_valido (RN-18) ───────────────────────────────────────────
-- El lugar del evento es de la plataforma o propio de la misma productora.
CREATE OR REPLACE FUNCTION fn_eventos_lugar_valido() RETURNS trigger AS $$
DECLARE
    v_empresa_lugar INT;
BEGIN
    SELECT id_empresa INTO v_empresa_lugar FROM lugares WHERE id_lugar = NEW.id_lugar;
    IF v_empresa_lugar IS NOT NULL AND v_empresa_lugar <> NEW.id_empresa THEN
        RAISE EXCEPTION 'El lugar % no es de la plataforma ni de la productora %', NEW.id_lugar, NEW.id_empresa
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventos_lugar_valido
    BEFORE INSERT OR UPDATE OF id_lugar, id_empresa ON eventos
    FOR EACH ROW EXECUTE FUNCTION fn_eventos_lugar_valido();

-- ─── jornadas_en_rango (RN-19) ──────────────────────────────────────────────
-- La fecha de la jornada está dentro del rango del evento.
-- Si cambia la fecha de una jornada con presentaciones, estas tienen que seguir cayendo en ella (RN-17).
CREATE OR REPLACE FUNCTION fn_jornadas_en_rango() RETURNS trigger AS $$
DECLARE
    v_inicio DATE;
    v_fin    DATE;
BEGIN
    SELECT fecha_inicio, fecha_fin INTO v_inicio, v_fin FROM eventos WHERE id_evento = NEW.id_evento;
    IF NEW.fecha NOT BETWEEN v_inicio AND v_fin THEN
        RAISE EXCEPTION 'La jornada % está fuera del rango del evento (% a %)', NEW.fecha, v_inicio, v_fin
            USING ERRCODE = 'check_violation';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.fecha <> OLD.fecha AND EXISTS (
        SELECT 1 FROM presentaciones
        WHERE id_jornada = NEW.id_jornada
          AND NOT (inicio::date = NEW.fecha OR (inicio::date = NEW.fecha + 1 AND inicio::time < TIME '08:00'))
    ) THEN
        RAISE EXCEPTION 'La jornada tiene presentaciones que no caen en la nueva fecha %', NEW.fecha
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jornadas_en_rango
    BEFORE INSERT OR UPDATE OF fecha, id_evento ON jornadas
    FOR EACH ROW EXECUTE FUNCTION fn_jornadas_en_rango();

-- Si cambian las fechas del evento, las jornadas existentes tienen que seguir dentro.
CREATE OR REPLACE FUNCTION fn_eventos_fechas_jornadas() RETURNS trigger AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM jornadas
        WHERE id_evento = NEW.id_evento
          AND fecha NOT BETWEEN NEW.fecha_inicio AND NEW.fecha_fin
    ) THEN
        RAISE EXCEPTION 'El evento tiene jornadas fuera del nuevo rango (% a %)', NEW.fecha_inicio, NEW.fecha_fin
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventos_fechas_jornadas
    AFTER UPDATE OF fecha_inicio, fecha_fin ON eventos
    FOR EACH ROW EXECUTE FUNCTION fn_eventos_fechas_jornadas();

-- ─── presentacion_en_jornada (RN-17) ────────────────────────────────────────
-- El show empieza el día de la jornada o en la madrugada del día siguiente (antes de las 08:00).
CREATE OR REPLACE FUNCTION fn_presentacion_en_jornada() RETURNS trigger AS $$
DECLARE
    v_fecha DATE;
BEGIN
    SELECT fecha INTO v_fecha FROM jornadas WHERE id_jornada = NEW.id_jornada;
    IF NOT (NEW.inicio::date = v_fecha
            OR (NEW.inicio::date = v_fecha + 1 AND NEW.inicio::time < TIME '08:00')) THEN
        RAISE EXCEPTION 'La presentación (%) no cae en la jornada del %', NEW.inicio, v_fecha
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER presentacion_en_jornada
    BEFORE INSERT OR UPDATE OF inicio, id_jornada ON presentaciones
    FOR EACH ROW EXECUTE FUNCTION fn_presentacion_en_jornada();

-- ─── espacios_minimo_uno (RN-08) ────────────────────────────────────────────
-- No se borra el último espacio de un lugar, salvo que se esté borrando el lugar entero
-- (en el borrado en cascada el lugar ya no existe cuando se borran sus espacios).
CREATE OR REPLACE FUNCTION fn_espacios_minimo_uno() RETURNS trigger AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM lugares WHERE id_lugar = OLD.id_lugar)
       AND NOT EXISTS (SELECT 1 FROM espacios WHERE id_lugar = OLD.id_lugar AND id_espacio <> OLD.id_espacio) THEN
        RAISE EXCEPTION 'No se puede borrar el último sector del lugar %', OLD.id_lugar
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER espacios_minimo_uno
    BEFORE DELETE ON espacios
    FOR EACH ROW EXECUTE FUNCTION fn_espacios_minimo_uno();

-- ─── compras_solo_clientes (RN-26) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_compras_solo_clientes() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = NEW.id_usuario AND rol = 'cliente') THEN
        RAISE EXCEPTION 'Solo los usuarios con rol cliente pueden comprar (usuario %)', NEW.id_usuario
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compras_solo_clientes
    BEFORE INSERT OR UPDATE OF id_usuario ON compras
    FOR EACH ROW EXECUTE FUNCTION fn_compras_solo_clientes();

-- ─── ingresos_validos (RN-24) ───────────────────────────────────────────────
-- La entrada está válida y, si su tarifa es de un día, el ingreso es en esa jornada.
-- Un abono (tarifa sin jornada) entra en cualquiera; la UNIQUE (id_entrada, id_jornada) evita el doble ingreso.
CREATE OR REPLACE FUNCTION fn_ingresos_validos() RETURNS trigger AS $$
DECLARE
    v_estado  VARCHAR(8);
    v_jornada INT;
BEGIN
    SELECT e.estado, t.id_jornada INTO v_estado, v_jornada
    FROM entradas e
    JOIN tarifas t ON t.id_tarifa = e.id_tarifa
    WHERE e.id_entrada = NEW.id_entrada;

    IF v_estado <> 'valida' THEN
        RAISE EXCEPTION 'La entrada % está anulada', NEW.id_entrada
            USING ERRCODE = 'check_violation';
    END IF;
    IF v_jornada IS NOT NULL AND v_jornada <> NEW.id_jornada THEN
        RAISE EXCEPTION 'La entrada % no es para esta jornada', NEW.id_entrada
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingresos_validos
    BEFORE INSERT OR UPDATE OF id_entrada, id_jornada ON ingresos
    FOR EACH ROW EXECUTE FUNCTION fn_ingresos_validos();
