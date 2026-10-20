import { z } from "zod";

// Mensajes de error por defecto en castellano
z.config(z.locales.es());

// Un campo opcional que, si llega vacío ("" o null), se guarda como NULL.
export const opcional = (schema) =>
  z.preprocess((v) => (v === "" ? null : v), schema.nullable().optional());

// Para validar req.params: /:id
export const idParams = z.object({
  id: z.coerce.number({ error: "El id debe ser un número entero" }).int("El id debe ser un número entero").positive("El id debe ser un número entero")
});

// Para validar req.params de un recurso anidado: /lugares/:id/escenarios/:idHijo, /eventos/:id/jornadas/:idHijo
export const idHijoParams = z.object({
  id: z.coerce.number({ error: "El id debe ser un número entero" }).int("El id debe ser un número entero").positive("El id debe ser un número entero"),
  idHijo: z.coerce.number({ error: "El id debe ser un número entero" }).int("El id debe ser un número entero").positive("El id debe ser un número entero")
});
