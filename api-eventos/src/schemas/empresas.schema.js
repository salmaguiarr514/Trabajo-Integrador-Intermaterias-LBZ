import { z } from "zod";
import { opcional } from "./comunes.js";

const campos = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  cuit: z.string().trim().regex(/^\d{2}-\d{8}-\d$/, "El CUIT tiene que tener el formato 30-12345678-9"),
  email: opcional(z.string().trim().max(150).pipe(z.email("El email no es válido"))),
  telefono: opcional(z.string().trim().max(30)),
  direccion: opcional(z.string().trim().max(200)),
  logo_url: opcional(z.string().trim().max(300).pipe(z.url("La URL del logo no es válida"))),
  // Service charge de la plataforma: solo lo toca el superadmin (RN-05)
  cargo_servicio_pct: z.coerce.number().min(0, "El % va de 0 a 100").max(100, "El % va de 0 a 100").optional(),
  activo: z.boolean().optional()
};

export const crearEmpresaSchema = z.object(campos);

// En la edición todo es opcional: lo que no viene queda como está.
export const editarEmpresaSchema = z.object(campos).partial();

// La productora edita sus propios datos de contacto. El CUIT, el % de service charge (RN-05)
// y el alta/baja los maneja solo el superadmin.
export const miEmpresaSchema = z
  .object({
    nombre: campos.nombre,
    email: campos.email,
    telefono: campos.telefono,
    direccion: campos.direccion,
    logo_url: campos.logo_url
  })
  .partial();
