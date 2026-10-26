// Entrada para Vercel: la regla de vercel.json manda todas las rutas /api/* acá,
// y la app de Express (src/index.js) las atiende con su URL original (/api/salud, /api/admin/usuarios…).
// En Vercel, src/index.js no llama a app.listen: la plataforma maneja el servidor.
export { default } from "../src/index.js";
