import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { permitir } from "../middlewares/permitir.js";
import { validar } from "../middlewares/validar.js";
import { comprar, cotizar, editarPerfil, obtenerCompras, obtenerEntradas } from "../controllers/cliente.controller.js";
import { comprarSchema, cotizarSchema, perfilSchema } from "../schemas/cliente.schema.js";

// /api/cliente/*: solo clientes (RN-26: solo un cliente puede comprar)
const router = Router();

router.use(autenticar, permitir("cliente"));
router.post("/compras/cotizar", validar(cotizarSchema), cotizar);
router.post("/compras", validar(comprarSchema), comprar);
router.get("/compras", obtenerCompras);
router.get("/entradas", obtenerEntradas);
router.put("/perfil", validar(perfilSchema), editarPerfil);

export default router;
