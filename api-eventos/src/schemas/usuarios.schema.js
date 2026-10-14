import { z } from "zod";
import { opcional } from "./comunes.js";

// El superadmin crea superadmins y usuarios de productoras; los clientes se registran solos.
const campos = {
  email: z.string().trim().toLowerCase().pipe(z.email("El email no es válido")),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  apellido: opcional(z.string().trim().max(100)),
  dni: opcional(z.string().trim().regex(/^\d{7,10}$/, "El DNI tiene que tener solo números")),
  telefono: opcional(z.string().trim().max(30)),
  rol: z.enum(["superadmin", "empresa"], { error: "El rol tiene que ser superadmin o empresa" }),
  id_empresa: opcional(z.coerce.number().int().positive()),
  activo: z.boolean().optional()
};

// Un usuario de productora necesita su productora, y un superadmin no lleva ninguna
// (es el CHECK usuarios_rol_empresa_check de la base, con un mensaje claro).
const rolYEmpresa = (u) => u.rol === undefined || (u.rol === "empresa") === (u.id_empresa != null);
const errorRolYEmpresa = {
  message: "Un usuario de productora necesita una productora, y un superadmin no lleva ninguna",
  path: ["id_empresa"]
};

export const crearUsuarioSchema = z.object(campos).refine(rolYEmpresa, errorRolYEmpresa);

// En la edición todo es opcional. Si cambia el rol, tiene que venir también id_empresa.
// La contraseña solo se cambia si viene.
export const editarUsuarioSchema = z.object(campos).partial().refine(rolYEmpresa, errorRolYEmpresa);

// ?rol=empresa&id_empresa=3
export const filtrosUsuariosSchema = z.object({
  rol: z.enum(["superadmin", "empresa", "cliente"]).optional(),
  id_empresa: z.coerce.number().int().positive().optional()
});
