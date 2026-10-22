import { theme } from "antd";

// Colores de la marca, para el código JS (antd, QR, colores de estado).
// Los del sitio público también están en index.css (@theme) para Tailwind: si cambia uno, se cambia en los dos.

// Sitio público y cliente: estética de afiche
export const AFICHE = {
  tinta: "#0d0a0b",
  papel: "#fff6ec"
};

// Paneles (superadmin y productora): oscuro con acento violeta.
// El violeta de relleno lleva texto blanco (5,4:1); para texto sobre el fondo oscuro se usa el claro (7:1).
export const PANEL = {
  fondo: "#0b0b12",
  lateral: "#14141f",
  violeta: "#9333ea",
  violetaTexto: "#c084fc",
  violetaTextoHover: "#d8b4fe",
  ok: "#52c41a",
  error: "#ff4d4f",
  destacado: "#fadb14"
};

export const temaAntd = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: PANEL.violeta,
    colorLink: PANEL.violetaTexto,
    colorLinkHover: PANEL.violetaTextoHover,
    colorLinkActive: PANEL.violetaTexto,
    colorPrimaryText: PANEL.violetaTexto,
    colorPrimaryTextHover: PANEL.violetaTextoHover,
    colorPrimaryTextActive: PANEL.violetaTexto,
    colorBgLayout: PANEL.fondo,
    borderRadius: 10,
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  components: {
    Menu: { itemSelectedColor: PANEL.violetaTextoHover }
  }
};
