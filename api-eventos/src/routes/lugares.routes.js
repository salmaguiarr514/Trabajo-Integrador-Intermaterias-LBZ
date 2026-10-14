import { Router } from "express";
import {
  obtenerLugares,
  obtenerLugar,
  crearLugar,
  editarLugar,
  eliminarLugar,
  crearEscenario,
  editarEscenario,
  eliminarEscenario,
  crearEspacio,
  editarEspacio,
  eliminarEspacio
} from "../controllers/lugares.controller.js";
import { validar } from "../middlewares/validar.js";
import { idParams } from "../schemas/comunes.js";
import {
  crearLugarSchema,
  editarLugarSchema,
  crearEscenarioSchema,
  editarEscenarioSchema,
  crearEspacioSchema,
  editarEspacioSchema,
  idHijoParams
} from "../schemas/lugares.schema.js";

// Mismas rutas para el superadmin (/api/admin/lugares) y la productora (/api/panel/lugares):
// el controller decide qué ve y qué modifica cada uno según el rol del token.
const router = Router();
const id = validar(idParams, "params");
const idHijo = validar(idHijoParams, "params");

router.get("/", obtenerLugares);
router.get("/:id", id, obtenerLugar);
router.post("/", validar(crearLugarSchema), crearLugar);
router.put("/:id", id, validar(editarLugarSchema), editarLugar);
router.delete("/:id", id, eliminarLugar);

router.post("/:id/escenarios", id, validar(crearEscenarioSchema), crearEscenario);
router.put("/:id/escenarios/:idHijo", idHijo, validar(editarEscenarioSchema), editarEscenario);
router.delete("/:id/escenarios/:idHijo", idHijo, eliminarEscenario);

router.post("/:id/espacios", id, validar(crearEspacioSchema), crearEspacio);
router.put("/:id/espacios/:idHijo", idHijo, validar(editarEspacioSchema), editarEspacio);
router.delete("/:id/espacios/:idHijo", idHijo, eliminarEspacio);

export default router;
