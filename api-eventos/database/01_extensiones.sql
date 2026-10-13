-- 01 · Extensiones
-- pgcrypto:   gen_random_uuid() para los códigos de las entradas y crypt() para las contraseñas de los seeds.
-- btree_gist: permite mezclar "=" con "&&" en los EXCLUDE de presentaciones.
-- En Supabase pgcrypto ya viene instalada; IF NOT EXISTS no falla.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
