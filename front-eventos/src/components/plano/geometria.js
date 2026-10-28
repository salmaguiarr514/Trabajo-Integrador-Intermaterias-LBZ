// Formas del plano de un lugar (docs/programacion-2/plan-desarrollo.md, 2.2), en coordenadas del lienzo:
//   { tipo: "rect", x, y, w, h }   o   { tipo: "poligono", puntos: [[x, y], ...] }

export const PASO = 10; // la grilla del editor: las formas se acomodan de a 10
export const ajustar = (v, paso = PASO) => Math.round(v / paso) * paso;

export const puntos = (g) =>
  g.tipo === "rect"
    ? [[g.x, g.y], [g.x + g.w, g.y], [g.x + g.w, g.y + g.h], [g.x, g.y + g.h]]
    : g.puntos;

export const caja = (g) => {
  const xs = puntos(g).map((p) => p[0]);
  const ys = puntos(g).map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

// Centro visual (el centroide del polígono; si el área da 0, el centro de la caja)
export const centro = (g) => {
  const p = puntos(g);
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[(i + 1) % p.length];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-6) {
    const c = caja(g);
    return [c.x + c.w / 2, c.y + c.h / 2];
  }
  return [cx / (3 * a), cy / (3 * a)];
};

export const trazo = (g) => `M${puntos(g).map((p) => p.join(" ")).join(" L")} Z`;

// La forma corrida dx, dy, sin salirse del lienzo
export const mover = (g, dx, dy, ancho, alto) => {
  const c = caja(g);
  const mx = Math.min(Math.max(dx, -c.x), ancho - c.x - c.w);
  const my = Math.min(Math.max(dy, -c.y), alto - c.y - c.h);
  return g.tipo === "rect" ? { ...g, x: g.x + mx, y: g.y + my } : { ...g, puntos: g.puntos.map(([x, y]) => [x + mx, y + my]) };
};

// Rectángulo con una esquina (0 arriba izq., 1 arriba der., 2 abajo der., 3 abajo izq.) llevada a x, y
export const estirar = (g, esquina, x, y, ancho, alto) => {
  const fijo = puntos(g)[(esquina + 2) % 4];
  const px = Math.min(Math.max(x, 0), ancho);
  const py = Math.min(Math.max(y, 0), alto);
  const nx = Math.min(px, fijo[0]);
  const ny = Math.min(py, fijo[1]);
  return { tipo: "rect", x: nx, y: ny, w: Math.max(PASO, Math.abs(px - fijo[0])), h: Math.max(PASO, Math.abs(py - fijo[1])) };
};

// ¿Entra en el lienzo?
export const adentro = (g, ancho, alto) => {
  const c = caja(g);
  return c.x >= 0 && c.y >= 0 && c.x + c.w <= ancho && c.y + c.h <= alto;
};

export const aPoligono = (g) => ({ tipo: "poligono", puntos: puntos(g).map((p) => [...p]) });
export const aRect = (g) => ({ tipo: "rect", ...caja(g) });

// Agrega un punto en el medio del lado más largo (para darle más forma a un polígono)
export const agregarPunto = (g) => {
  const p = g.puntos;
  let mejor = 0, largo = -1;
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l > largo) { largo = l; mejor = i; }
  });
  const a = p[mejor];
  const b = p[(mejor + 1) % p.length];
  const medio = [ajustar((a[0] + b[0]) / 2, 1), ajustar((a[1] + b[1]) / 2, 1)];
  return { ...g, puntos: [...p.slice(0, mejor + 1), medio, ...p.slice(mejor + 1)] };
};

// Una forma nueva, centrada en el lienzo
export const formaNueva = (ancho, alto, w = 200, h = 120) => ({
  tipo: "rect",
  x: ajustar((ancho - w) / 2),
  y: ajustar((alto - h) / 2),
  w,
  h
});

// Elementos de referencia (no se venden)
export const TIPOS_ELEMENTO = {
  cabina_dj: { texto: "Cabina de DJ", corto: "DJ" },
  barra: { texto: "Barra", corto: "Barra" },
  banos: { texto: "Baños", corto: "Baños" },
  ingreso: { texto: "Ingreso", corto: "Ingreso" },
  mangrullo: { texto: "Mangrullo", corto: "FOH" },
  otro: { texto: "Otro", corto: "" }
};

// El plano de un lugar tal como lo devuelve GET /lugares/:id, en el formato de VisorPlano (null si no tiene)
export const planoDeLugar = (l) =>
  l.plano_ancho
    ? {
        ancho: l.plano_ancho,
        alto: l.plano_alto,
        espacios: l.espacios.filter((e) => e.geometria),
        escenarios: l.escenarios.filter((e) => e.geometria),
        elementos: l.elementos ?? []
      }
    : null;
