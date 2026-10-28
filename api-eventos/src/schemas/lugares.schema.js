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

// ─── Plano (2.2 del plan) ──────────────────────────────────────────────────
// Una forma es un rectángulo o un polígono, en coordenadas del lienzo (0,0 arriba a la izquierda)
const coordenada = z.number({ error: "Las coordenadas son números" }).min(0, "Las coordenadas no pueden ser negativas");
const geometria = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("rect"),
    x: coordenada,
    y: coordenada,
    w: z.number().positive("El ancho de la forma tiene que ser mayor a 0"),
    h: z.number().positive("El alto de la forma tiene que ser mayor a 0")
  }),
  z.object({
    tipo: z.literal("poligono"),
    puntos: z.array(z.tuple([coordenada, coordenada])).min(3, "Un polígono necesita al menos 3 puntos").max(40, "Un polígono puede tener hasta 40 puntos")
  })
], { error: "La forma es un rectángulo (rect) o un polígono" });

// Lo que ocupa una forma: para verificar que entre en el lienzo
const extremos = (g) =>
  g.tipo === "rect" ? { x: g.x + g.w, y: g.y + g.h } : { x: Math.max(...g.puntos.map((p) => p[0])), y: Math.max(...g.puntos.map((p) => p[1])) };

const medida = (mensaje) => z.number({ error: mensaje }).int(mensaje).min(200, "El lienzo mide al menos 200").max(4000, "El lienzo mide hasta 4000");

// El plano completo de un lugar: reemplaza lo que había. Un sector o escenario que no viene queda sin dibujar.
// Con ancho y alto en null se quita el plano (y todo lo dibujado).
export const planoSchema = z
  .object({
    ancho: medida("El ancho del lienzo es un número entero").nullable(),
    alto: medida("El alto del lienzo es un número entero").nullable(),
    espacios: z.array(z.object({ id_espacio: z.number().int().positive(), geometria })).default([]),
    escenarios: z.array(z.object({ id_escenario: z.number().int().positive(), geometria })).default([]),
    elementos: z
      .array(
        z.object({
          tipo: z.enum(["cabina_dj", "barra", "banos", "ingreso", "mangrullo", "otro"], { error: "Elegí el tipo de elemento" }),
          etiqueta: opcional(z.string().trim().max(60, "La etiqueta tiene hasta 60 caracteres")),
          geometria
        })
      )
      .max(100, "El plano puede tener hasta 100 elementos")
      .default([])
  })
  .superRefine((p, ctx) => {
    if ((p.ancho === null) !== (p.alto === null)) {
      ctx.addIssue({ code: "custom", path: ["alto"], message: "El lienzo necesita ancho y alto (o ninguno, para quitar el plano)" });
      return;
    }
    const formas = [
      ...p.espacios.map((e, i) => ["espacios", i, e.geometria]),
      ...p.escenarios.map((e, i) => ["escenarios", i, e.geometria]),
      ...p.elementos.map((e, i) => ["elementos", i, e.geometria])
    ];
    if (p.ancho === null) {
      if (formas.length > 0) ctx.addIssue({ code: "custom", path: ["ancho"], message: "Sin lienzo no se puede dibujar: indicá el ancho y el alto" });
      return;
    }
    for (const [lista, i, g] of formas) {
      const { x, y } = extremos(g);
      if (x > p.ancho || y > p.alto) {
        ctx.addIssue({ code: "custom", path: [lista, i, "geometria"], message: `Una forma se sale del lienzo (${p.ancho} × ${p.alto})` });
      }
    }
  });
