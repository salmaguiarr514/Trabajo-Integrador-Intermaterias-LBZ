import { Router } from "express";
import { login, registro, yo } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/autenticar.js";
import { validar } from "../middlewares/validar.js";
import { loginSchema, registroSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/login", validar(loginSchema), login);
router.post("/registro", validar(registroSchema), registro);
router.get("/yo", autenticar, yo);

export default router;
