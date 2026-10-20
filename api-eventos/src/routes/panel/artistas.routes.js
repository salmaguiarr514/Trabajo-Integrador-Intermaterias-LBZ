import { Router } from "express";
import {
  obtenerArtistas,
  obtenerArtista,
  crearArtista,
  editarArtista,
  eliminarArtista
} from "../../controllers/panel/artistas.controller.js";
import { validar } from "../../middlewares/validar.js";
import { idParams } from "../../schemas/comunes.js";
import { crearArtistaSchema, editarArtistaSchema } from "../../schemas/artistas.schema.js";

const router = Router();

router.get("/", obtenerArtistas);
router.get("/:id", validar(idParams, "params"), obtenerArtista);
router.post("/", validar(crearArtistaSchema), crearArtista);
router.put("/:id", validar(idParams, "params"), validar(editarArtistaSchema), editarArtista);
router.delete("/:id", validar(idParams, "params"), eliminarArtista);

export default router;
