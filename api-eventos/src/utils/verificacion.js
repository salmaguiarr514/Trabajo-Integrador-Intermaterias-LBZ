import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { enviarCorreo } from "./correo.js";
import { boton, COLORES, escaparHtml, parrafo, plantilla, titulo } from "./plantillaCorreo.js";
import { firmarVerificacion } from "./tokens.js";

export const MINUTOS_VIGENCIA = 15;
export const MAX_INTENTOS = 5;
export const SEGUNDOS_ENTRE_ENVIOS = 60;

// Genera un código nuevo (borra los anteriores del usuario), lo guarda hasheado y lo manda por mail
// junto con un enlace que verifica de un toque (un JWT de un solo uso, ver utils/tokens.js).
// Recibe un cliente de pg para poder usarse dentro de una transacción.
export const enviarCodigo = async (db, usuario) => {
  const codigo = randomInt(0, 1_000_000).toString().padStart(6, "0");

  await db.query("DELETE FROM codigos_verificacion WHERE id_usuario = $1", [usuario.id_usuario]);
  const { rows } = await db.query(
    `INSERT INTO codigos_verificacion (id_usuario, codigo_hash, expira)
     VALUES ($1, $2, NOW() + make_interval(mins => $3))
     RETURNING id_codigo`,
    [usuario.id_usuario, await bcrypt.hash(codigo, 10), MINUTOS_VIGENCIA]
  );

  // Sin FRONTEND_URL (no debería pasar) el mail va solo con el código
  const base = process.env.FRONTEND_URL?.replace(/\/$/, "");
  const enlace = base && `${base}/verificar?token=${firmarVerificacion(usuario, rows[0].id_codigo, MINUTOS_VIGENCIA)}`;

  return enviarCorreo({
    para: usuario.email,
    asunto: `Tu código de Backstage: ${codigo}`,
    texto:
      `Hola ${usuario.nombre}, tu código para verificar el email es ${codigo}. Vence en ${MINUTOS_VIGENCIA} minutos.` +
      (enlace ? `\nO entrá a este enlace para verificarlo de un toque: ${enlace}` : ""),
    html: plantilla({
      previa: `Tu código es ${codigo}`,
      contenido: [
        titulo("Verificá tu email"),
        parrafo(`Hola ${escaparHtml(usuario.nombre)}, falta un paso para que puedas comprar entradas.`),
        enlace ? boton("Verificar mi email", enlace) : "",
        parrafo(enlace ? "O escribí este código en la pantalla de verificación:" : "Escribí este código en la pantalla de verificación:", COLORES.gris),
        `<p style="margin:0 0 18px;font-family:Anton,Impact,sans-serif;font-size:40px;letter-spacing:10px;color:${COLORES.amarillo}">${codigo}</p>`,
        parrafo(`El enlace y el código vencen en ${MINUTOS_VIGENCIA} minutos. Si no creaste una cuenta en Backstage, ignorá este mail.`, COLORES.gris)
      ].join("")
    })
  });
};
