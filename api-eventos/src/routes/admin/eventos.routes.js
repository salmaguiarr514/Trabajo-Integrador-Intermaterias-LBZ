import { Router } from "express";
import { obtenerEventos, cambiarEstadoEvento } from "../../controllers/admin/eventos.controller.js";
import { validar } from "../../middlewares/validar.js";
import { idParams } from "../../schemas/comunes.js";
import { estadoEventoAdminSchema } from "../../schemas/eventos.schema.js";

const router = Router();

router.get("/", obtenerEventos);
router.patch("/:id/estado", validar(idParams, "params"), validar(estadoEventoAdminSchema), cambiarEstadoEvento);

export default router;
