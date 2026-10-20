import "dotenv/config";
import { hostname } from "node:os";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin/index.js";
import panelRouter from "./routes/panel/index.js";
import clienteRouter from "./routes/cliente/index.js";
import publicRouter from "./routes/public.routes.js";
import { manejarErrores } from "./middlewares/manejarErrores.js";

if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el .env (ver .env.example)");
}

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCIA = process.env.INSTANCIA || hostname();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Cada réplica se identifica en las respuestas (sirve para ver el balanceo de Nginx)
app.use((req, res, next) => {
  res.set("X-Instancia", INSTANCIA);
  next();
});

app.get("/api/salud", (req, res) => res.json({ ok: true, instancia: INSTANCIA }));
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/panel", panelRouter);
app.use("/api/cliente", clienteRouter);
app.use("/api/public", publicRouter);

// Ruta 404 para rutas inexistentes (después de todas las rutas)
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Manejo de errores (siempre el último)
app.use(manejarErrores);

// En Vercel la plataforma maneja el servidor; en local lo levantamos nosotros
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

export default app;
