import { z } from "zod";
import { opcional } from "./comunes.js";

const campos = {
  nombre: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(150),
  genero: opcional(z.string().trim().max(60)),
  pais: opcional(z.string().trim().max(60)),
  bio: opcional(z.string().trim().max(2000)),
  imagen_url: opcional(z.string().trim().max(300).pipe(z.url("La URL de la imagen no es válida"))),
  activo: z.boolean().optional()
};

export const crearArtistaSchema = z.object(campos);

// En la edición todo es opcional: lo que no viene queda como está
export const editarArtistaSchema = z.object(campos).partial();
