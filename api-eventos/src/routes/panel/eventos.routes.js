import { Router } from "express";
import {
  obtenerEventos,
  obtenerEvento,
  crearEvento,
  editarEvento,
  eliminarEvento,
  cambiarEstadoEvento,
  crearJornada,
  editarJornada,
  eliminarJornada,
  reemplazarEscenarios,
  crearPresentacion,
  editarPresentacion,
  eliminarPresentacion,
  crearTarifa,
  editarTarifa,
  eliminarTarifa,
  obtenerDisponibilidad
} from "../../controllers/panel/eventos.controller.js";
import { obtenerVentasEvento } from "../../controllers/panel/ventas.controller.js";
import { validar } from "../../middlewares/validar.js";
import { idHijoParams, idParams } from "../../schemas/comunes.js";
import {
  crearEventoSchema,
  editarEventoSchema,
  estadoEventoPanelSchema,
  crearJornadaSchema,
  editarJornadaSchema,
  escenariosEventoSchema,
  crearPresentacionSchema,
  editarPresentacionSchema,
  crearTarifaSchema,
  editarTarifaSchema
} from "../../schemas/eventos.schema.js";

const router = Router();
const id = validar(idParams, "params");
const idHijo = validar(idHijoParams, "params");

router.get("/", obtenerEventos);
router.get("/:id", id, obtenerEvento);
router.post("/", validar(crearEventoSchema), crearEvento);
router.put("/:id", id, validar(editarEventoSchema), editarEvento);
router.delete("/:id", id, eliminarEvento);
router.patch("/:id/estado", id, validar(estadoEventoPanelSchema), cambiarEstadoEvento);
router.get("/:id/disponibilidad", id, obtenerDisponibilidad);
router.get("/:id/ventas", id, obtenerVentasEvento);

router.post("/:id/jornadas", id, validar(crearJornadaSchema), crearJornada);
router.put("/:id/jornadas/:idHijo", idHijo, validar(editarJornadaSchema), editarJornada);
router.delete("/:id/jornadas/:idHijo", idHijo, eliminarJornada);

router.put("/:id/escenarios", id, validar(escenariosEventoSchema), reemplazarEscenarios);

router.post("/:id/presentaciones", id, validar(crearPresentacionSchema), crearPresentacion);
router.put("/:id/presentaciones/:idHijo", idHijo, validar(editarPresentacionSchema), editarPresentacion);
router.delete("/:id/presentaciones/:idHijo", idHijo, eliminarPresentacion);

router.post("/:id/tarifas", id, validar(crearTarifaSchema), crearTarifa);
router.put("/:id/tarifas/:idHijo", idHijo, validar(editarTarifaSchema), editarTarifa);
router.delete("/:id/tarifas/:idHijo", idHijo, eliminarTarifa);

export default router;
