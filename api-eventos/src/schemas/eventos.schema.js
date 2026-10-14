import { z } from "zod";

const ESTADOS = ["borrador", "publicado", "agotado", "cancelado", "finalizado"];

// ?estado=publicado&id_empresa=3
export const filtrosEventosSchema = z.object({
  estado: z.enum(ESTADOS).optional(),
  id_empresa: z.coerce.number().int().positive().optional()
});

// Moderación del superadmin: despublicar (vuelve a borrador) o cancelar
export const estadoEventoAdminSchema = z.object({
  estado: z.enum(["borrador", "cancelado"], { error: "El estado tiene que ser borrador (despublicar) o cancelado" })
});

// ?id_empresa=3
export const filtrosArtistasSchema = z.object({
  id_empresa: z.coerce.number().int().positive().optional()
});
