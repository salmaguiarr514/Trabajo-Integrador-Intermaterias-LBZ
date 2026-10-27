// Plantilla de los mails de Backstage, con la estética de afiche del sitio (tinta, papel, amarillo y fucsia).
// HTML de mail: tablas y estilos en línea, que es lo que respetan Gmail, Outlook y los celulares.

export const COLORES = { tinta: "#0d0a0b", noche: "#17121a", papel: "#fff6ec", gris: "#c2b2bb", amarillo: "#ffd23f", fucsia: "#ff3d7f", linea: "#4a3a50" };
const AFICHE = "Anton, Impact, 'Arial Narrow', sans-serif";
const TEXTO = "Inter, 'Segoe UI', Arial, sans-serif";

// Lo que escribe una persona (nombre, nombre del evento) se escapa antes de meterlo en el HTML
export const escaparHtml = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const titulo = (texto) =>
  `<h1 style="margin:0 0 12px;font-family:${AFICHE};font-size:34px;line-height:1;text-transform:uppercase;color:${COLORES.papel}">${texto}</h1>`;

export const parrafo = (texto, color = COLORES.papel) =>
  `<p style="margin:0 0 14px;font-family:${TEXTO};font-size:15px;line-height:1.55;color:${color}">${texto}</p>`;

export const boton = (texto, href) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr>
     <td style="background:${COLORES.amarillo};border:2px solid ${COLORES.papel}">
       <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${TEXTO};font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${COLORES.tinta};text-decoration:none">${texto}</a>
     </td>
   </tr></table>`;

// Página completa: barra con la marca, el contenido en una caja con borde y el pie
export const plantilla = ({ previa, contenido }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Backstage</title></head>
<body style="margin:0;padding:0;background:${COLORES.tinta}">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${previa}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORES.tinta}"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
      <tr><td style="padding:0 0 16px">
        <span style="display:inline-block;background:${COLORES.amarillo};color:${COLORES.tinta};font-family:${AFICHE};font-size:20px;padding:4px 10px">B</span>
        <span style="font-family:${AFICHE};font-size:22px;color:${COLORES.papel};vertical-align:middle;padding-left:8px;text-transform:uppercase">Backstage</span>
      </td></tr>
      <tr><td style="background:${COLORES.noche};border:2px solid ${COLORES.papel};padding:28px 24px">${contenido}</td></tr>
      <tr><td style="padding:16px 4px;font-family:${TEXTO};font-size:12px;line-height:1.5;color:${COLORES.gris}">
        Backstage · entradas para recitales y festivales. El pago es simulado: todo es ficticio.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
