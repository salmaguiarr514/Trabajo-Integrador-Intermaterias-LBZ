import { Router } from "express";
import {
  obtenerEmpresas,
  obtenerEmpresa,
  crearEmpresa,
  editarEmpresa,
  eliminarEmpresa
} from "../../controllers/admin/empresas.controller.js";
import { validar } from "../../middlewares/validar.js";
import { idParams } from "../../schemas/comunes.js";
import { crearEmpresaSchema, editarEmpresaSchema } from "../../schemas/empresas.schema.js";

const router = Router();

router.get("/", obtenerEmpresas);
router.get("/:id", validar(idParams, "params"), obtenerEmpresa);
router.post("/", validar(crearEmpresaSchema), crearEmpresa);
router.put("/:id", validar(idParams, "params"), validar(editarEmpresaSchema), editarEmpresa);
router.delete("/:id", validar(idParams, "params"), eliminarEmpresa);

export default router;
