import { z } from "zod";
import { opcional } from "./comunes.js";

// ─── Cartelera pública ──────────────────────────────────────────────────────

const texto = opcional(z.string().trim().max(100));
const fecha = (campo) => opcional(z.iso.date({ error: `${campo}: fecha inválida (AAAA-MM-DD)` }));

// ?q=rock&ciudad=Córdoba&tipo=festival&desde=2027-02-01&hasta=2027-03-31&artista=...&genero=...
export const filtrosCarteleraSchema = z.object({
  q: texto,
  ciudad: texto,
  provincia: texto,
  artista: texto,
  genero: texto,
  tipo: opcional(z.enum(["recital", "festival"], { error: "El tipo es recital o festival" })),
  desde: fecha("Desde"),
  hasta: fecha("Hasta")
});

// ─── Compras ────────────────────────────────────────────────────────────────

export const MAX_ENTRADAS = 10; // RN-30

const item = z.object({
  id_tarifa: z.number({ error: "Elegí una tarifa" }).int().positive(),
  cantidad: z
    .number({ error: "La cantidad es obligatoria" })
    .int("La cantidad es un número entero")
    .min(1, "La cantidad es al menos 1")
    .max(MAX_ENTRADAS, `Máximo ${MAX_ENTRADAS} entradas por compra`)
});

const pedido = {
  id_evento: z.number({ error: "Elegí un evento" }).int().positive(),
  items: z
    .array(item, { error: "Elegí al menos una entrada" })
    .min(1, "Elegí al menos una entrada")
    .refine((items) => new Set(items.map((i) => i.id_tarifa)).size === items.length, "Cada tarifa va una sola vez")
    .refine((items) => items.reduce((s, i) => s + i.cantidad, 0) <= MAX_ENTRADAS, `Máximo ${MAX_ENTRADAS} entradas por compra`)
};

export const cotizarSchema = z.object(pedido);

// Pago simulado. La tarjeta se acepta con espacios o guiones ("4111 1111 1111 1111");
// con transferencia no hace falta.
export const compraSchema = z
  .object({
    ...pedido,
    medio_pago: z.enum(["credito", "debito", "transferencia"], { error: "El medio de pago es credito, debito o transferencia" }),
    tarjeta_ficticia: opcional(
      z
        .string()
        .transform((v) => v.replace(/[\s-]/g, ""))
        .pipe(z.string().regex(/^\d{16}$/, "La tarjeta tiene 16 números"))
    )
  })
  .refine((c) => c.medio_pago === "transferencia" || c.tarjeta_ficticia, {
    message: "Para pagar con tarjeta, completá el número",
    path: ["tarjeta_ficticia"]
  });

// ─── Perfil ─────────────────────────────────────────────────────────────────

// El email no se cambia (habría que volver a verificarlo). La contraseña se cambia
// solo si vienen la actual y la nueva.
export const perfilSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100).optional(),
    apellido: opcional(z.string().trim().max(100)),
    dni: opcional(z.string().trim().regex(/^\d{7,10}$/, "El DNI tiene que tener solo números")),
    telefono: opcional(z.string().trim().max(30)),
    password_actual: z.string().min(1).optional(),
    password_nueva: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72).optional()
  })
  .refine((p) => (p.password_actual === undefined) === (p.password_nueva === undefined), {
    message: "Para cambiar la contraseña, mandá la actual y la nueva",
    path: ["password_actual"]
  });
