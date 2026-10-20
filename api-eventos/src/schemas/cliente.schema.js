import { z } from "zod";
import { opcional } from "./comunes.js";

// RN-30: máximo de entradas por compra
export const MAX_ENTRADAS = 10;

// ?q=texto&ciudad=Córdoba&tipo=festival
export const filtrosCarteleraSchema = z.object({
  q: z.string().trim().max(100).optional().transform((v) => v || undefined),
  ciudad: z.string().trim().max(100).optional().transform((v) => v || undefined),
  tipo: z.enum(["recital", "festival"]).optional()
});

const items = z
  .array(
    z.object({
      id_tarifa: z.number({ error: "Elegí una tarifa" }).int().positive(),
      cantidad: z.number({ error: "Indicá la cantidad" }).int().min(1, "La cantidad mínima es 1")
    }),
    { error: "Elegí al menos una entrada" }
  )
  .min(1, "Elegí al menos una entrada")
  .refine((lista) => lista.reduce((s, i) => s + i.cantidad, 0) <= MAX_ENTRADAS, `Podés comprar hasta ${MAX_ENTRADAS} entradas por compra`)
  .refine((lista) => new Set(lista.map((i) => i.id_tarifa)).size === lista.length, "Una misma tarifa aparece dos veces");

export const cotizarSchema = z.object({
  id_evento: z.number({ error: "Falta el evento" }).int().positive(),
  items
});

// Pago simulado: todo es ficticio. Una tarjeta terminada en 0000 se rechaza, para poder probar ese caso.
export const comprarSchema = z
  .object({
    id_evento: z.number({ error: "Falta el evento" }).int().positive(),
    items,
    medio_pago: z.enum(["credito", "debito", "transferencia"], { error: "Elegí cómo pagar" }),
    tarjeta: z
      .object({
        numero: z.string().transform((v) => v.replace(/\s|-/g, "")).pipe(z.string().regex(/^\d{16}$/, "La tarjeta tiene que tener 16 números")),
        nombre: z.string().trim().min(1, "Poné el nombre como figura en la tarjeta").max(100),
        vencimiento: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "El vencimiento es MM/AA"),
        cvv: z.string().regex(/^\d{3,4}$/, "El código de seguridad tiene 3 o 4 números")
      })
      .optional()
  })
  .refine((c) => c.medio_pago === "transferencia" || c.tarjeta, { message: "Completá los datos de la tarjeta", path: ["tarjeta"] });

export const perfilSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
    apellido: opcional(z.string().trim().max(100)),
    dni: opcional(z.string().trim().regex(/^\d{7,10}$/, "El DNI tiene que tener solo números")),
    telefono: opcional(z.string().trim().max(30))
  })
  .partial();
