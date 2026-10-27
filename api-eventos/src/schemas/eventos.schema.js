import { z } from "zod";
import { opcional } from "./comunes.js";

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

// ─── Panel de la productora ─────────────────────────────────────────────────

const MAX_JORNADAS = 31;

const fecha = (campo) => z.iso.date({ error: `${campo}: fecha inválida (AAAA-MM-DD)` });
// "2027-02-13T22:30" o "2027-02-13 22:30" → se guarda como TIMESTAMP (hora de Argentina, sin huso)
const fechaHora = (campo) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .regex(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/, `${campo}: fecha y hora inválidas`)
    .transform((v) => v.replace(" ", "T").slice(0, 16));
const id = (campo) => z.number({ error: `Elegí ${campo}` }).int().positive();
const dias = (desde, hasta) => (Date.parse(hasta) - Date.parse(desde)) / 86_400_000;

const camposEvento = {
  nombre: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(150),
  descripcion: opcional(z.string().trim().max(5000)),
  tipo: z.enum(["recital", "festival"], { error: "El tipo es recital o festival" }),
  id_lugar: id("un lugar"),
  fecha_inicio: fecha("La fecha de inicio"),
  fecha_fin: fecha("La fecha de fin"),
  imagen_url: opcional(z.string().trim().max(300).pipe(z.url("La URL de la imagen no es válida")))
};

// RN-19: el fin no es anterior al inicio. Las jornadas se generan una por día, con un tope razonable.
const fechasValidas = (e) => !e.fecha_inicio || !e.fecha_fin || e.fecha_fin >= e.fecha_inicio;
const rangoRazonable = (e) => !e.fecha_inicio || !e.fecha_fin || dias(e.fecha_inicio, e.fecha_fin) < MAX_JORNADAS;
const errorFechas = { message: "La fecha de fin no puede ser anterior a la de inicio", path: ["fecha_fin"] };
const errorRango = { message: `Un evento puede durar hasta ${MAX_JORNADAS} días`, path: ["fecha_fin"] };

export const crearEventoSchema = z.object(camposEvento).refine(fechasValidas, errorFechas).refine(rangoRazonable, errorRango);
export const editarEventoSchema = z.object(camposEvento).partial().refine(fechasValidas, errorFechas).refine(rangoRazonable, errorRango);

// Publicar, despublicar (vuelve a borrador) o cancelar
export const estadoEventoPanelSchema = z.object({
  estado: z.enum(["publicado", "borrador", "cancelado"], { error: "El estado tiene que ser publicado, borrador o cancelado" })
});

// ─── Jornadas ───
const camposJornada = {
  fecha: fecha("La fecha"),
  hora_apertura: opcional(z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "La hora de apertura tiene que ser HH:MM")),
  nombre: opcional(z.string().trim().max(60))
};
export const crearJornadaSchema = z.object(camposJornada);
export const editarJornadaSchema = z.object(camposJornada).partial();

// ─── Escenarios habilitados: la lista completa reemplaza a la anterior ───
export const escenariosEventoSchema = z.object({
  escenarios: z.array(z.number().int().positive(), { error: "Mandá la lista de escenarios" })
});

// ─── Presentaciones (line-up) ───
const camposPresentacion = {
  id_jornada: id("la jornada"),
  id_escenario: id("el escenario"),
  id_artista: id("el artista"),
  inicio: fechaHora("El inicio"),
  fin: fechaHora("El fin"),
  headliner: z.boolean().optional()
};
const finDespuesDeInicio = (p) => !p.inicio || !p.fin || p.fin > p.inicio;
const errorHorario = { message: "El show tiene que terminar después de empezar", path: ["fin"] };
export const crearPresentacionSchema = z.object(camposPresentacion).refine(finDespuesDeInicio, errorHorario);
export const editarPresentacionSchema = z.object(camposPresentacion).partial().refine(finDespuesDeInicio, errorHorario);

// ─── Tarifas (solo precio y vigencia: el cupo es la capacidad del sector, RN-22) ───
const camposTarifa = {
  id_espacio: id("el sector"),
  // null = abono: vale para todas las jornadas
  id_jornada: z.number().int().positive().nullable({ error: "Elegí la jornada o abono" }),
  nombre: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(60),
  precio: z.number({ error: "El precio es obligatorio" }).min(0, "El precio no puede ser negativo").max(9_999_999_999),
  venta_desde: opcional(fechaHora("La venta desde")),
  venta_hasta: opcional(fechaHora("La venta hasta")),
  activa: z.boolean().optional()
};
const ventaValida = (t) => !t.venta_desde || !t.venta_hasta || t.venta_hasta > t.venta_desde;
const errorVenta = { message: "El fin de la venta tiene que ser después del inicio", path: ["venta_hasta"] };
export const crearTarifaSchema = z.object(camposTarifa).refine(ventaValida, errorVenta);
export const editarTarifaSchema = z.object(camposTarifa).partial().refine(ventaValida, errorVenta);

// ─── Control de acceso (RN-24) ───
// Llega lo que leyó el lector: el QR (un JWT firmado por la API) o el código (UUID) escrito a mano.
// El controller verifica la firma (utils/tokens.js, leerEntrada).
export const validarEntradaSchema = z.object({
  codigo: z
    .string({ error: "Escaneá o pegá el código de la entrada" })
    .trim()
    .min(1, "Escaneá o pegá el código de la entrada")
    .max(1000, "Ese código no es de una entrada de Backstage"),
  id_jornada: z.number({ error: "Elegí la jornada que se está controlando" }).int().positive()
});
