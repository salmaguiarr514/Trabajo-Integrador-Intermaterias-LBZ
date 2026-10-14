import { z } from "zod";
import { opcional } from "./comunes.js";

// Texto obligatorio con el mismo mensaje si falta o si viene vacío
const obligatorio = (mensaje, max) => z.string({ error: mensaje }).trim().min(1, mensaje).max(max);

const camposLugar = {
  nombre: obligatorio("El nombre es obligatorio", 150),
  tipo: z.enum(["estadio", "arena", "teatro", "predio", "club", "otro"], { error: "Elegí un tipo de lugar" }),
  direccion: obligatorio("La dirección es obligatoria", 200),
  ciudad: obligatorio("La ciudad es obligatoria", 100),
  provincia: obligatorio("La provincia es obligatoria", 100),
  imagen_url: opcional(z.string().trim().max(300).pipe(z.url("La URL de la imagen no es válida"))),
  activo: z.boolean().optional()
};

// Todo lugar tiene al menos un sector: al crearlo se genera "General" con esta capacidad
// (docs/programacion-2/plan-desarrollo.md, 2.1). Después se editan desde el detalle.
export const crearLugarSchema = z.object({
  ...camposLugar,
  capacidad: z.coerce.number({ error: "La capacidad es obligatoria" }).int().positive("La capacidad tiene que ser mayor a 0")
});

export const editarLugarSchema = z.object(camposLugar).partial();

// ?origen=plataforma | propio
export const filtrosLugaresSchema = z.object({
  origen: z.enum(["plataforma", "propio"]).optional()
});

// ─── Escenarios y espacios (sectores) ──────────────────────────────────────
const camposEscenario = {
  nombre: obligatorio("El nombre es obligatorio", 100),
  descripcion: opcional(z.string().trim().max(300))
};

export const crearEscenarioSchema = z.object(camposEscenario);
export const editarEscenarioSchema = z.object(camposEscenario).partial();

const camposEspacio = {
  nombre: obligatorio("El nombre es obligatorio", 100),
  modalidad: z.enum(["de_pie", "sentado"], { error: "La modalidad es de_pie o sentado" }).optional(),
  capacidad: z.coerce.number({ error: "La capacidad es obligatoria" }).int().positive("La capacidad tiene que ser mayor a 0"),
  color: opcional(z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "El color tiene que tener el formato #RRGGBB"))
};

export const crearEspacioSchema = z.object(camposEspacio);
export const editarEspacioSchema = z.object(camposEspacio).partial();

// /lugares/:id/escenarios/:idHijo
export const idHijoParams = z.object({
  id: z.coerce.number().int().positive("El id debe ser un número entero"),
  idHijo: z.coerce.number().int().positive("El id debe ser un número entero")
});
