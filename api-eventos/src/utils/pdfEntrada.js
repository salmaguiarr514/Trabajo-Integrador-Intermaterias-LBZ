import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { firmarEntrada } from "./tokens.js";

// PDF de una entrada (A4, para imprimir o mostrar en el celular), con la estética de afiche del sitio:
// el cuerpo oscuro con el evento, la línea de troquel y el talón claro con el QR (el JWT de la entrada).
//   const pdf = await pdfEntrada(entrada, { numero: 1, total: 3 });   → Buffer
// entrada: una fila de la consulta de utils/correoEntradas.js.
// Tipografías: Anton e Inter (licencia OFL, en assets/fuentes).

const C = { tinta: "#0d0a0b", noche: "#17121a", papel: "#fff6ec", gris: "#c2b2bb", grisOscuro: "#6f6170", amarillo: "#ffd23f", fucsia: "#ff3d7f", linea: "#4a3a50" };
const fuente = (archivo) => fileURLToPath(new URL(`../assets/fuentes/${archivo}`, import.meta.url));
const FUENTES = { afiche: fuente("Anton-Regular.woff"), texto: fuente("Inter-Regular.woff"), negrita: fuente("Inter-Bold.woff"), fuerte: fuente("Inter-ExtraBold.woff") };

// La B del logo "Pase" (components/Marca.jsx en el front), como trazo
const LETRA_B =
  "M0,0 H20 C27,0 30,4 30,10 V17 C30,20 28,22 26,23 C29,24 31,27 31,31 V36 C31,42 27,46 20,46 H0 Z " +
  "M10,8 V19 H17 C19,19 20,18 20,16 V11 C20,9 19,8 17,8 Z M10,26 V38 H18 C20,38 21,37 21,35 V29 C21,27 20,26 18,26 Z";

const dia = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
// "del 13 al 15 de febrero de 2027" (o con los meses/años que hagan falta si cambian)
const rango = (inicio, fin) => {
  const [a, b] = [new Date(`${inicio}T12:00:00`), new Date(`${fin}T12:00:00`)];
  const f = (d, o) => d.toLocaleDateString("es-AR", o);
  if (a.getFullYear() !== b.getFullYear()) return `del ${f(a, { day: "numeric", month: "long", year: "numeric" })} al ${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
  if (a.getMonth() !== b.getMonth()) return `del ${f(a, { day: "numeric", month: "long" })} al ${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
  return `del ${a.getDate()} al ${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
};
const pesos = (n) => `$ ${Math.round(n ?? 0).toLocaleString("es-AR")}`;
const mayus = (t) => String(t ?? "").toLocaleUpperCase("es-AR");

// El tamaño más grande (entre min y max) con el que el texto entra en el ancho y en "lineas" renglones
const ajustar = (doc, texto, ancho, lineas, max, min) => {
  for (let t = max; t > min; t -= 1) {
    doc.fontSize(t);
    if (doc.heightOfString(texto, { width: ancho, lineGap: -t * 0.12 }) <= t * 1.05 * lineas) return t;
  }
  return min;
};

// El tamaño más grande (entre min y max) con el que el texto entra en una sola línea de ese ancho
const ajustarLinea = (doc, texto, ancho, max, min) => {
  for (let t = max; t > min; t -= 1) if (doc.fontSize(t).widthOfString(texto) <= ancho) return t;
  return min;
};

const logo = (doc, x, y, alto) => {
  const e = alto / 60;
  doc.save().translate(x, y).scale(e);
  doc.path("M4,2 H96 V20 A10,10 0 0 0 96,40 V58 H4 V40 A10,10 0 0 0 4,20 Z").fill(C.amarillo);
  doc.save().translate(26.55, 13).scale(0.739).path(LETRA_B).fill(C.tinta, "even-odd").restore();
  doc.circle(83, 30, 5).fill(C.fucsia);
  doc.restore();
};

export const pdfEntrada = async (e, { numero, total }) => {
  const qr = await QRCode.toBuffer(firmarEntrada(e.codigo), { errorCorrectionLevel: "M", margin: 1, width: 720, color: { dark: C.tinta, light: C.papel } });
  const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Entrada ${numero} de ${total} · ${e.evento}`, Author: "Backstage", Subject: "Entrada" } });
  for (const [nombre, archivo] of Object.entries(FUENTES)) doc.registerFont(nombre, archivo);
  const partes = [];
  doc.on("data", (p) => partes.push(p));
  const listo = new Promise((ok) => doc.on("end", () => ok(Buffer.concat(partes))));

  const W = doc.page.width; // 595
  doc.rect(0, 0, W, doc.page.height).fill(C.papel);

  // ─── Encabezado: la marca ─────────────────────────────────────────────────
  logo(doc, 40, 36, 30);
  doc.font("afiche").fontSize(22).fillColor(C.tinta).text("BACKSTAGE", 96, 38, { lineBreak: false });
  doc.font("negrita").fontSize(9).fillColor(C.grisOscuro).text(mayus(`Entrada ${numero} de ${total}`), 0, 46, { width: W - 40, align: "right", characterSpacing: 1.5 });

  // ─── La entrada: cuerpo oscuro + troquel + talón con el QR ───────────────
  const x = 40, y = 90, ancho = W - 80, alto = 360;
  const corte = x + ancho - 210; // dónde está el troquel
  doc.rect(x + 8, y + 8, ancho, alto).fill(C.fucsia); // sombra de afiche
  doc.rect(x, y, ancho, alto).fill(C.tinta);
  doc.rect(corte, y, x + ancho - corte, alto).fill(C.papel).lineWidth(2.5).rect(x, y, ancho, alto).stroke(C.tinta);
  // Muescas del troquel (arriba y abajo) y la línea punteada
  doc.circle(corte, y, 11).fill(C.papel).circle(corte, y + alto, 11).fill(C.papel);
  doc.moveTo(corte, y + 18).lineTo(corte, y + alto - 18).lineWidth(2).dash(5, { space: 5 }).stroke(C.tinta).undash();

  // Cuerpo
  const cx = x + 24, cw = corte - cx - 22;
  const etiqueta = [e.tipo === "festival" ? "Festival" : "Recital", e.id_jornada ? null : `Abono · ${e.cantidad_jornadas} jornadas`].filter(Boolean).join(" · ");
  doc.font("fuerte").fontSize(9);
  const anchoEtiqueta = doc.widthOfString(mayus(etiqueta), { characterSpacing: 1.8 }) + 14;
  doc.rect(cx, y + 22, anchoEtiqueta, 18).fill(C.fucsia);
  doc.fillColor(C.tinta).text(mayus(etiqueta), cx + 7, y + 27, { characterSpacing: 1.8, lineBreak: false });

  const titulo = mayus(e.evento);
  doc.font("afiche");
  const t = ajustar(doc, titulo, cw, 2, 40, 22);
  doc.fontSize(t).fillColor(C.papel).text(titulo, cx, y + 52, { width: cw, lineGap: -t * 0.12 });

  let yy = doc.y + 10;
  doc.font("negrita").fontSize(13).fillColor(C.amarillo).text(e.id_jornada ? `Vale para el ${dia(e.fecha_jornada)}` : `Abono: vale para las ${e.cantidad_jornadas} jornadas, ${rango(e.fecha_inicio, e.fecha_fin)}`, cx, yy, { width: cw });
  yy = doc.y + 6;
  doc.font("texto").fontSize(10.5).fillColor(C.gris).text(`${e.lugar} · ${e.direccion}, ${e.ciudad}`, cx, yy, { width: cw });

  // Sector y tarifa, abajo del cuerpo
  const yb = y + alto - 112;
  doc.moveTo(cx, yb).lineTo(corte - 22, yb).lineWidth(1).dash(3, { space: 4 }).stroke(C.linea).undash();
  doc.font("negrita").fontSize(8).fillColor(C.gris).text("SECTOR", cx, yb + 14, { characterSpacing: 1.5 });
  doc.font("afiche");
  doc.fontSize(ajustarLinea(doc, mayus(e.espacio), cw * 0.62, 30, 13)).fillColor(C.amarillo).text(mayus(e.espacio), cx, yb + 26, { lineBreak: false });
  doc.font("texto").fontSize(10).fillColor(C.papel).text(`${e.tarifa} · ${pesos(e.precio_pagado)}`, cx, yb + 64, { width: cw * 0.62 });
  doc.font("negrita").fontSize(8).fillColor(C.gris).text("TITULAR", cx + cw * 0.66, yb + 14, { characterSpacing: 1.5 });
  doc.font("negrita").fontSize(11).fillColor(C.papel).text(`${e.cliente}${e.apellido ? ` ${e.apellido}` : ""}`, cx + cw * 0.66, yb + 28, { width: cw * 0.34 });

  // Talón: QR y código
  const tx = corte + 20, tw = x + ancho - tx - 18;
  doc.font("fuerte").fontSize(8).fillColor(C.tinta).text("MOSTRALO EN LA PUERTA", tx, y + 26, { width: tw, align: "center", characterSpacing: 1.2 });
  doc.image(qr, tx, y + 48, { width: tw });
  doc.font("Courier").fontSize(7.2).fillColor(C.tinta).text(e.codigo, tx, y + 58 + tw, { width: tw, align: "center" });
  doc.font("negrita").fontSize(8).fillColor(C.grisOscuro).text(`Entrada ${numero} de ${total}`, tx, y + alto - 30, { width: tw, align: "center" });

  // ─── Cómo usarla y datos de la compra ─────────────────────────────────────
  let yi = y + alto + 44;
  doc.font("afiche").fontSize(20).fillColor(C.tinta).text("CÓMO USARLA", 40, yi);
  yi = doc.y + 6;
  const pasos = [
    "Mostrá el QR en la puerta: impreso, desde este PDF en el celular o desde Mis entradas.",
    e.id_jornada ? "Entra una sola vez, el día que dice la entrada." : "Es un abono: entra una vez por cada jornada del evento.",
    "El QR está firmado por Backstage: si se modifica, no pasa el control. Si no se puede leer, el personal escribe el código.",
    "No la compartas ni la publiques: quien la muestre primero, entra."
  ];
  for (const p of pasos) {
    doc.circle(46, yi + 6, 3).fill(C.fucsia);
    doc.font("texto").fontSize(10.5).fillColor(C.tinta).text(p, 58, yi, { width: W - 98 });
    yi = doc.y + 6;
  }

  yi += 14;
  doc.rect(40, yi, W - 80, 58).lineWidth(1.5).stroke(C.tinta);
  const datos = [
    ["COMPROBANTE", e.referencia_pago ?? "—"],
    ["COMPRADA EL", e.fecha_compra ? new Date(`${e.fecha_compra}:00`).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—"],
    ["ORGANIZA", e.productora]
  ];
  datos.forEach(([k, v], i) => {
    const dx = 56 + i * ((W - 112) / 3);
    doc.font("negrita").fontSize(7.5).fillColor(C.grisOscuro).text(k, dx, yi + 13, { characterSpacing: 1.3 });
    doc.font("negrita").fontSize(10.5).fillColor(C.tinta).text(v, dx, yi + 27, { width: (W - 112) / 3 - 10, lineBreak: false, ellipsis: true });
  });

  doc.font("texto").fontSize(8.5).fillColor(C.grisOscuro).text("Backstage · entradas para recitales y festivales. El pago es simulado: todo es ficticio.", 40, doc.page.height - 46, { width: W - 80, align: "center" });

  doc.end();
  return listo;
};
