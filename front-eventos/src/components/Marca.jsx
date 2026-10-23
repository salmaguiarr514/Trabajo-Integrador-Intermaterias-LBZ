import { MARCA } from "../tema.js";

// La B dibujada como trazo (no como texto), así se ve igual aunque Anton no haya cargado.
// Caja de 31 × 46, condensada como Anton; los huecos salen por evenodd.
const LETRA_B =
  "M0,0 H20 C27,0 30,4 30,10 V17 C30,20 28,22 26,23 C29,24 31,27 31,31 V36 C31,42 27,46 20,46 H0 Z " +
  "M10,8 V19 H17 C19,19 20,18 20,16 V11 C20,9 19,8 17,8 Z " +
  "M10,26 V38 H18 C20,38 21,37 21,35 V29 C21,27 20,26 18,26 Z";

// Logo "Pase": la B en una entrada con muescas a los costados y línea de troquel.
// En tamaños chicos (menos de 28 px de alto) va la versión simple: sin troquel ni punto, la B más grande.
//   <Marca alto={24} />                  sitio público (amarillo y fucsia)
//   <Marca alto={24} colores={MARCA.panel} />  paneles (violeta)
function Marca({ alto = 24, colores = MARCA.sitio, chico = alto < 28 }) {
  if (chico) {
    return (
      <svg width={(alto * 100) / 72} height={alto} viewBox="0 0 100 72" aria-hidden="true" focusable="false" style={{ flex: "none" }}>
        <path d="M0,0 H100 V24 A12,12 0 0 0 100,48 V72 H0 V48 A12,12 0 0 0 0,24 Z" fill={colores.fondo} />
        <path d={LETRA_B} fill={colores.letra} fillRule="evenodd" transform="translate(33.8 12) scale(1.043)" />
      </svg>
    );
  }
  return (
    <svg width={(alto * 100) / 60} height={alto} viewBox="0 0 100 60" aria-hidden="true" focusable="false" style={{ flex: "none" }}>
      <path d="M4,2 H96 V20 A10,10 0 0 0 96,40 V58 H4 V40 A10,10 0 0 0 4,20 Z" fill={colores.fondo} />
      <line x1="70" y1="7" x2="70" y2="53" stroke={colores.letra} strokeWidth="2.5" strokeDasharray="4 4" />
      <path d={LETRA_B} fill={colores.letra} fillRule="evenodd" transform="translate(26.55 13) scale(0.739)" />
      <circle cx="83" cy="30" r="5" fill={colores.punto} />
    </svg>
  );
}

export default Marca;
