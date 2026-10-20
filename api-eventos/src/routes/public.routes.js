import { Router } from "express";
import { obtenerCartelera, obtenerEventoPublico, obtenerArtistaPublico } from "../controllers/public.controller.js";
import { validar } from "../middlewares/validar.js";
import { idParams } from "../schemas/comunes.js";

// /api/public/*: sin login
const router = Router();
const id = validar(idParams, "params");

router.get("/eventos", obtenerCartelera);
router.get("/eventos/:id", id, obtenerEventoPublico);
router.get("/artistas/:id", id, obtenerArtistaPublico);

export default router;
