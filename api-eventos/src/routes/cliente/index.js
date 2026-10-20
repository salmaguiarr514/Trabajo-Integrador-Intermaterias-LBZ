import { Router } from "express";
import { autenticar } from "../../middlewares/autenticar.js";
import { permitir } from "../../middlewares/permitir.js";
import { validar } from "../../middlewares/validar.js";
import { idParams } from "../../schemas/comunes.js";
import { compraSchema, cotizarSchema, perfilSchema } from "../../schemas/cliente.schema.js";
import {
  cotizar,
  comprar,
  obtenerCompras,
  obtenerCompra,
  obtenerEntradas
} from "../../controllers/cliente/compras.controller.js";
import { obtenerPerfil, editarPerfil } from "../../controllers/cliente/perfil.controller.js";

// /api/cliente/*: el público que compra. Todo se filtra por req.usuario.id_usuario (sale del token).
const router = Router();

router.use(autenticar, permitir("cliente"));

// POST y no GET: lleva en el body los mismos items que la compra
router.post("/compras/cotizar", validar(cotizarSchema), cotizar);
router.post("/compras", validar(compraSchema), comprar);
router.get("/compras", obtenerCompras);
router.get("/compras/:id", validar(idParams, "params"), obtenerCompra);
router.get("/entradas", obtenerEntradas);
router.get("/perfil", obtenerPerfil);
router.put("/perfil", validar(perfilSchema), editarPerfil);

export default router;
