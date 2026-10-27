import QRCode from "qrcode";
import { enviarCorreo } from "./correo.js";
import { COLORES, escaparHtml, parrafo, plantilla, titulo } from "./plantillaCorreo.js";
import { firmarEntrada } from "./tokens.js";

// Mail con las entradas de una compra (al aprobarse el pago) o de un evento (botón "Mandármelas por mail").
// Cada entrada va con su QR como imagen dentro del mail: el mismo JWT que muestra Mis entradas.
//   await enviarEntradas(db, idUsuario, { id_compra })   o   { id_evento }
// Devuelve lo de enviarCorreo ({ enviado }), o null si no hay entradas válidas para mandar.

const dia = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const rango = (inicio, fin) => (inicio === fin ? dia(inicio) : `del ${dia(inicio)} al ${dia(fin)}`);

export const enviarEntradas = async (db, idUsuario, { id_compra, id_evento }) => {
  const { rows } = await db.query(
    `SELECT en.id_entrada, en.codigo, t.nombre AS tarifa, t.id_jornada, j.fecha AS fecha_jornada, es.nombre AS espacio,
            ev.nombre AS evento, ev.fecha_inicio, ev.fecha_fin, l.nombre AS lugar, l.direccion, l.ciudad,
            u.email, u.nombre AS cliente, c.referencia_pago
     FROM entradas en
     JOIN compras c   ON c.id_compra = en.id_compra
     JOIN usuarios u  ON u.id_usuario = c.id_usuario
     JOIN tarifas t   ON t.id_tarifa = en.id_tarifa
     JOIN espacios es ON es.id_espacio = t.id_espacio
     LEFT JOIN jornadas j ON j.id_jornada = t.id_jornada
     JOIN eventos ev  ON ev.id_evento = en.id_evento
     JOIN lugares l   ON l.id_lugar = ev.id_lugar
     WHERE c.id_usuario = $1 AND c.estado = 'pagada' AND en.estado = 'valida'
       AND ($2::INT IS NULL OR c.id_compra = $2) AND ($3::INT IS NULL OR en.id_evento = $3)
     ORDER BY j.fecha NULLS FIRST, en.id_entrada`,
    [idUsuario, id_compra ?? null, id_evento ?? null]
  );
  if (rows.length === 0) return null;
  const e = rows[0];

  // QR en PNG, con los colores del sitio y margen blanco para que lo lea cualquier lector
  const adjuntos = await Promise.all(
    rows.map(async (r) => ({
      filename: `entrada-${r.id_entrada}.png`,
      content: await QRCode.toBuffer(firmarEntrada(r.codigo), { errorCorrectionLevel: "M", margin: 2, width: 360, color: { dark: COLORES.tinta, light: COLORES.papel } }),
      cid: `entrada-${r.id_entrada}@backstage`
    }))
  );

  const vale = (r) => (r.id_jornada ? `Vale para el ${dia(r.fecha_jornada)}` : "Abono: vale para todas las jornadas");
  const tarjetas = rows
    .map(
      (r, i) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:2px solid ${COLORES.papel};background:${COLORES.tinta}">
        <tr>
          <td width="170" valign="top" style="background:${COLORES.papel};padding:10px">
            <img src="cid:entrada-${r.id_entrada}@backstage" width="150" height="150" alt="QR de la entrada ${i + 1}" style="display:block;width:150px;height:150px">
          </td>
          <td valign="top" style="padding:14px 16px;font-family:Inter,'Segoe UI',Arial,sans-serif;color:${COLORES.papel}">
            <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${COLORES.fucsia}">Entrada ${i + 1} de ${rows.length}</p>
            <p style="margin:0 0 6px;font-family:Anton,Impact,sans-serif;font-size:24px;line-height:1.05;text-transform:uppercase">${escaparHtml(r.espacio)}</p>
            <p style="margin:0 0 8px;font-size:14px;color:${COLORES.gris}">${escaparHtml(r.tarifa)} · ${vale(r)}</p>
            <p style="margin:0;font-family:Consolas,monospace;font-size:11px;color:${COLORES.gris};word-break:break-all">${r.codigo}</p>
          </td>
        </tr>
      </table>`
    )
    .join("");

  const cantidad = rows.length === 1 ? "tu entrada" : `tus ${rows.length} entradas`;
  return enviarCorreo({
    para: e.email,
    asunto: `${rows.length === 1 ? "Tu entrada" : "Tus entradas"} para ${e.evento}`,
    texto:
      `Hola ${e.cliente}, acá están ${cantidad} para ${e.evento} (${rango(e.fecha_inicio, e.fecha_fin)}, ${e.lugar}, ${e.ciudad}).\n` +
      rows.map((r, i) => `Entrada ${i + 1}: ${r.espacio} · ${r.tarifa} · ${vale(r)} · código ${r.codigo}`).join("\n") +
      `\nMostrá el QR en la puerta desde este mail o desde Mis entradas.`,
    html: plantilla({
      previa: `${cantidad[0].toUpperCase()}${cantidad.slice(1)} para ${escaparHtml(e.evento)}`,
      contenido: [
        `<p style="margin:0 0 10px;font-family:Inter,'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${COLORES.amarillo}">Pago aprobado${e.referencia_pago ? ` · ${e.referencia_pago}` : ""}</p>`,
        titulo(escaparHtml(e.evento)),
        parrafo(`${rango(e.fecha_inicio, e.fecha_fin)}<br>${escaparHtml(e.lugar)} · ${escaparHtml(e.direccion)}, ${escaparHtml(e.ciudad)}`, COLORES.gris),
        parrafo(`Hola ${escaparHtml(e.cliente)}, acá están ${cantidad}. En la puerta mostrá el QR desde este mail o desde <strong>Mis entradas</strong>: cada QR entra una vez por jornada.`),
        tarjetas,
        parrafo("El QR está firmado por Backstage: si se modifica, no pasa el control. No lo compartas: quien lo muestre primero, entra.", COLORES.gris)
      ].join("")
    }),
    adjuntos
  });
};
