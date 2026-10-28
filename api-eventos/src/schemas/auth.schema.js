import { z } from "zod";
import { opcional } from "./comunes.js";

const email = z.string().trim().toLowerCase().pipe(z.email("El email no es válido"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "La contraseña es obligatoria")
});

// Solo se registran clientes; los usuarios de las productoras los crea el superadmin.
export const registroSchema = z.object({
  email,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: opcional(z.string().trim().max(100)),
  dni: opcional(z.string().trim().regex(/^\d{7,10}$/, "El DNI tiene que tener solo números")),
  telefono: opcional(z.string().trim().max(30))
});

export const verificarSchema = z.object({
  email,
  codigo: z.string().trim().regex(/^\d{6}$/, "El código tiene 6 números")
});

// El token del enlace del mail (un JWT; ver utils/tokens.js)
export const verificarEnlaceSchema = z.object({
  token: z.string({ error: "Falta el enlace de verificación" }).trim().min(20, "El enlace no es válido").max(2000, "El enlace no es válido")
});

export const reenviarSchema = z.object({ email });

export const recuperarSchema = z.object({ email });

export const restablecerSchema = z.object({
  token: z.string({ error: "Falta el enlace" }).trim().min(20, "El enlace no es válido").max(2000, "El enlace no es válido"),
  password: z.string({ error: "Elegí una contraseña" }).min(6, "La contraseña debe tener al menos 6 caracteres").max(72)
});
