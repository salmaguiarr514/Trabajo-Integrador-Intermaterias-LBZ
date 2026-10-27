import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import nodemailer from "nodemailer";

// Mails con una cuenta de Gmail (GMAIL_USUARIO + GMAIL_CLAVE_APP, una "contraseña de aplicación").
// Si no están en el .env, el mail no se manda y se muestra en la consola: así se puede probar sin Gmail.
// Para desarrollo, con CORREO_CARPETA cada mail se guarda además como .eml en esa carpeta
// (se abre con Outlook o el Correo de Windows, y se ve tal cual le llegaría a la persona).
export const configurado = Boolean(process.env.GMAIL_USUARIO && process.env.GMAIL_CLAVE_APP);
const carpeta = process.env.CORREO_CARPETA;

const transporte = configurado
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USUARIO, pass: process.env.GMAIL_CLAVE_APP }
    })
  : carpeta
    ? nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" })
    : null;

// adjuntos: los de nodemailer ({ filename, content, cid } para imágenes dentro del HTML)
// Devuelve { enviado: true } si salió por Gmail; si no, { enviado: false } (y dónde se guardó, si hay carpeta).
export const enviarCorreo = async ({ para, asunto, texto, html, adjuntos = [] }) => {
  if (!transporte) {
    console.log(`[correo sin Gmail configurado] Para: ${para} | ${asunto}\n${texto}`);
    return { enviado: false };
  }
  const info = await transporte.sendMail({
    from: `"Backstage" <${process.env.GMAIL_USUARIO || "no-responder@backstage.local"}>`,
    to: para,
    subject: asunto,
    text: texto,
    html,
    attachments: adjuntos
  });
  if (configurado) return { enviado: true };

  mkdirSync(carpeta, { recursive: true });
  const archivo = join(carpeta, `${Date.now()}-${asunto.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60)}.eml`);
  writeFileSync(archivo, info.message);
  console.log(`[correo sin Gmail configurado] Para: ${para} | ${asunto} → guardado en ${archivo}\n${texto}`);
  return { enviado: false, archivo };
};
