// Movimiento hecho a mano con la API de animación del navegador (sin librerías).
// Todo respeta "menos movimiento": si el sistema lo pide, no anima y deja el valor final.

export const REBOTE = "cubic-bezier(0.2, 1.35, 0.35, 1)";
export const SALIDA = "cubic-bezier(0.2, 0, 0, 1)";

export const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Saltito con rebote: un número que cambia, un contador, un total
//   saltito(elemento, { desde: 1.5, y: -8 })
export function saltito(el, { desde = 1.4, y = 0 } = {}) {
  if (!el || sinMovimiento() || !el.animate) return;
  el.animate([{ scale: desde, translate: `0 ${y}px` }, { scale: 1, translate: "0 0" }], { duration: 520, easing: REBOTE });
}

// Cuenta de un número a otro escribiendo cada paso con `formato` (ej. el total de una compra)
// Devuelve una función para cortarla si el valor cambia de nuevo antes de terminar.
export function contar(el, desde, hasta, formato, duracion = 700) {
  if (!el) return () => {};
  if (sinMovimiento() || desde === hasta) {
    el.textContent = formato(hasta);
    return () => {};
  }
  const inicio = performance.now();
  let cuadro = 0;
  const paso = (ahora) => {
    const t = Math.min(1, (ahora - inicio) / duracion);
    const suave = 1 - Math.pow(1 - t, 3);
    el.textContent = formato(desde + (hasta - desde) * suave);
    if (t < 1) cuadro = requestAnimationFrame(paso);
  };
  cuadro = requestAnimationFrame(paso);
  return () => cancelAnimationFrame(cuadro);
}

// Lluvia de entraditas de colores (con su troquel) que salen del centro de la pantalla: para festejar una compra
export function lluviaDeEntradas(duracion = 1700) {
  if (sinMovimiento()) return;
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40";
  document.body.append(c);
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  const x = c.getContext("2d");
  x.scale(dpr, dpr);
  const colores = ["#ffd23f", "#ff3d7f", "#fff6ec", "#3ddc97"];
  const piezas = Array.from({ length: 80 }, () => ({
    px: innerWidth / 2 + (Math.random() - 0.5) * 160,
    py: innerHeight * 0.42,
    vx: (Math.random() - 0.5) * 15,
    vy: -Math.random() * 15 - 6,
    g: Math.random() * 360,
    vg: (Math.random() - 0.5) * 16,
    color: colores[Math.floor(Math.random() * colores.length)]
  }));
  const t0 = performance.now();
  const cuadro = (t) => {
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of piezas) {
      p.vy += 0.45;
      p.px += p.vx;
      p.py += p.vy;
      p.g += p.vg;
      x.save();
      x.translate(p.px, p.py);
      x.rotate((p.g * Math.PI) / 180);
      x.fillStyle = p.color;
      x.fillRect(-9, -5, 18, 10);
      x.fillStyle = "#0d0a0b";
      x.fillRect(3, -5, 1.5, 10);
      x.restore();
    }
    if (t - t0 < duracion) requestAnimationFrame(cuadro);
    else c.remove();
  };
  requestAnimationFrame(cuadro);
}

// Tarjeta que se inclina en 3D siguiendo el mouse (con la clase "tarjeta-afiche"). Solo con mouse.
//   <a className="tarjeta-afiche" onPointerMove={inclinar} onPointerLeave={enderezar}>
export function inclinar(ev) {
  if (ev.pointerType !== "mouse" || sinMovimiento()) return;
  const t = ev.currentTarget;
  const r = t.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;
  const y = (ev.clientY - r.top) / r.height;
  t.classList.add("siguiendo");
  t.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
  t.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
  t.style.setProperty("--mx", `${x * 100}%`);
  t.style.setProperty("--my", `${y * 100}%`);
}

export function enderezar(ev) {
  const t = ev.currentTarget;
  t.classList.remove("siguiendo");
  t.style.setProperty("--rx", "0deg");
  t.style.setProperty("--ry", "0deg");
}
