import pool from "../../data/db.js";
import { filtrosArtistasSchema } from "../../schemas/eventos.schema.js";

// Solo lectura: cada productora carga y edita sus artistas desde su panel.
export const obtenerArtistas = async (req, res) => {
  const { id_empresa } = filtrosArtistasSchema.parse(req.query);
  const { rows } = await pool.query(
    `SELECT a.id_artista, a.nombre, a.genero, a.pais, a.activo, a.fecha_creacion,
            a.id_empresa, e.nombre AS productora,
            (SELECT COUNT(*) FROM presentaciones p WHERE p.id_artista = a.id_artista)::INT AS cantidad_presentaciones
     FROM artistas a
     JOIN empresas e ON e.id_empresa = a.id_empresa
     WHERE ($1::INT IS NULL OR a.id_empresa = $1)
     ORDER BY a.nombre`,
    [id_empresa ?? null]
  );
  res.json(rows);
};
