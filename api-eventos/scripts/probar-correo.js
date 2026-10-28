// Prueba la cuenta de Gmail del .env: se conecta, y si se pasa un mail, manda uno de prueba con la plantilla de Backstage.
//   npm run probar-correo                     → solo verifica usuario y contraseña de aplicación
//   npm run probar-correo -- tu@mail.com      → además manda un mail de prueba
import "dotenv/config";
import nodemailer from "nodemailer";
import { boton, parrafo, plantilla, titulo } from "../src/utils/plantillaCorreo.js";

const usuario = process.env.GMAIL_USUARIO;
const clave = process.env.GMAIL_CLAVE_APP;
if (!usuario || !clave) {
  console.error("Faltan GMAIL_USUARIO y/o GMAIL_CLAVE_APP en el .env (ver .env.example).");
  process.exit(1);
}
if (/\s/.test(clave)) console.warn("Ojo: GMAIL_CLAVE_APP tiene espacios. Google la muestra en grupos de 4: escribila toda junta.");

const transporte = nodemailer.createTransport({ service: "gmail", auth: { user: usuario, pass: clave } });
try {
  await transporte.verify();
  console.log(`✓ Gmail acepta la cuenta ${usuario}.`);
} catch (error) {
  console.error(`✗ Gmail rechazó la cuenta: ${error.message}`);
  if (/535|Username and Password not accepted|BadCredentials/i.test(error.message)) {
    console.error("  Revisá que GMAIL_CLAVE_APP sea una contraseña de aplicación (16 letras), no la contraseña de la cuenta,");
    console.error("  y que la cuenta tenga la verificación en 2 pasos activada.");
  }
  process.exit(1);
}

const para = process.argv[2];
if (para) {
  const base = process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:5173";
  await transporte.sendMail({
    from: `"Backstage" <${usuario}>`,
    to: para,
    subject: "Prueba de envío de Backstage",
    text: `Si te llegó este mail, el envío de Backstage funciona. Sitio: ${base}`,
    html: plantilla({
      previa: "El envío de mails funciona",
      contenido: [titulo("¡Funciona!"), parrafo("Si te llegó este mail, Backstage ya puede mandar códigos, enlaces y entradas."), boton("Ir a Backstage", base)].join("")
    })
  });
  console.log(`✓ Mail de prueba enviado a ${para}. Si no aparece en un minuto, mirá en spam.`);
}
