import { Router } from "express";
import { login, registro, verificar, verificarEnlace, reenviarCodigo, recuperar, restablecer, yo } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/autenticar.js";
import { validar } from "../middlewares/validar.js";
import { loginSchema, registroSchema, verificarSchema, verificarEnlaceSchema, reenviarSchema, recuperarSchema, restablecerSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/login", validar(loginSchema), login);
router.post("/registro", validar(registroSchema), registro);
router.post("/verificar", validar(verificarSchema), verificar);
router.post("/verificar-enlace", validar(verificarEnlaceSchema), verificarEnlace); // el botón del mail
router.post("/reenviar-codigo", validar(reenviarSchema), reenviarCodigo);
router.post("/recuperar", validar(recuperarSchema), recuperar); // "¿Olvidaste tu contraseña?"
router.post("/restablecer", validar(restablecerSchema), restablecer); // el enlace del mail
router.get("/yo", autenticar, yo);

export default router;
