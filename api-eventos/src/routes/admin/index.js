import { Router } from "express";
import { autenticar } from "../../middlewares/autenticar.js";
import { permitir } from "../../middlewares/permitir.js";
import { obtenerArtistas } from "../../controllers/admin/artistas.controller.js";
import { obtenerMetricas } from "../../controllers/admin/metricas.controller.js";
import empresasRouter from "./empresas.routes.js";
import usuariosRouter from "./usuarios.routes.js";
import lugaresRouter from "./lugares.routes.js";
import eventosRouter from "./eventos.routes.js";

// /api/admin/*: todo lo de acá es solo para el superadmin
const router = Router();

router.use(autenticar, permitir("superadmin"));
router.use("/empresas", empresasRouter);
router.use("/usuarios", usuariosRouter);
router.use("/lugares", lugaresRouter);
router.use("/eventos", eventosRouter);
router.get("/artistas", obtenerArtistas);   // solo lectura
router.get("/metricas", obtenerMetricas);

export default router;
