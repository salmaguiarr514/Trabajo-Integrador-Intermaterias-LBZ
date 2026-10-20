import { Router } from "express";
import { autenticar } from "../../middlewares/autenticar.js";
import { permitir } from "../../middlewares/permitir.js";
import { validar } from "../../middlewares/validar.js";
import { obtenerMiEmpresa, editarMiEmpresa } from "../../controllers/panel/empresa.controller.js";
import { obtenerResumen } from "../../controllers/panel/resumen.controller.js";
import { miEmpresaSchema } from "../../schemas/empresas.schema.js";
import lugaresRouter from "../lugares.routes.js";
import artistasRouter from "./artistas.routes.js";
import eventosRouter from "./eventos.routes.js";

// /api/panel/*: la productora del usuario logueado. Todo se filtra por req.usuario.id_empresa
// (sale del token, nunca del body): ver docs/programacion-2/plan-desarrollo.md, 3.1 Multitenancy.
const router = Router();

router.use(autenticar, permitir("empresa"));
router.get("/resumen", obtenerResumen);
router.get("/empresa", obtenerMiEmpresa);
router.put("/empresa", validar(miEmpresaSchema), editarMiEmpresa);
router.use("/lugares", lugaresRouter);
router.use("/artistas", artistasRouter);
router.use("/eventos", eventosRouter);

export default router;
