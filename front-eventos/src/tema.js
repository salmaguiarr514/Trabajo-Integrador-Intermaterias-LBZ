// Colores de la marca, para el código JS (QR, logo, colores de estado, tema de antd).
// Sin imports: lo usa el sitio público, que no carga antd (el tema de antd está en layouts/ProveedorAntd.jsx).
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

// Colores del logo "Pase" (components/Marca.jsx) en cada zona
export const MARCA = {
  sitio: { fondo: "#ffd23f", letra: AFICHE.tinta, punto: "#ff3d7f" },
  panel: { fondo: PANEL.violeta, letra: "#ffffff", punto: PANEL.violetaTexto }
};
