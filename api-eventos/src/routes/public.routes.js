import { Router } from "express";
import { obtenerCartelera, obtenerCiudades, obtenerEventoPublico } from "../controllers/public.controller.js";
import { validar } from "../middlewares/validar.js";
import { idParams } from "../schemas/comunes.js";

// /api/public/*: sin login. Solo eventos publicados o agotados.
const router = Router();

router.get("/eventos", obtenerCartelera);
router.get("/ciudades", obtenerCiudades);
router.get("/eventos/:id", validar(idParams, "params"), obtenerEventoPublico);

export default router;
