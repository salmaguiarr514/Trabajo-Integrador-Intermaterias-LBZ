import { sinMovimiento } from "./movimiento.js";

// Foco de escenario para destacar un elemento (un evento de la cartelera):
// la página baja la luz (penumbra), del borde de arriba baja un truss con tres cabezas móviles,
// la más cercana gira hasta apuntarle y su haz cae desde arriba de la pantalla, con polvo flotando,
// resplandor en la lente y destellos alrededor del elemento. El elemento en foco recibe la clase
// "en-foco" (queda por encima de la penumbra y se adelanta; ver "Foco de escenario" en index.css).
//   const foco = crearReflector();  foco.encender(contenedor);  foco.apagar();  foco.destruir();
// El haz se dibuja solo mientras hay algo iluminado, en dos canvas: el cono y el charco en uno chico
// (a un octavo de la pantalla, que el navegador estira y así queda suave sin filtros, que costarían
// cada cuadro) y el polvo, la lente y los destellos en otro a resolución normal.

const CABEZA_SVG = `<svg viewBox="0 0 56 96" aria-hidden="true">
  <rect x="22" y="0" width="12" height="10" rx="2" fill="#2b2630" stroke="#6b6370" stroke-width="1.5"/>
  <path d="M8 14 H48 V20 H44 V52 H38 V20 H18 V52 H12 V20 H8 Z" fill="#221e26" stroke="#6b6370" stroke-width="1.5"/>
  <rect x="14" y="30" width="28" height="48" rx="6" fill="#18151b" stroke="#7a7280" stroke-width="1.5"/>
  <path d="M17 38 H39 M17 44 H39 M17 50 H39 M17 56 H39" stroke="#3d3742" stroke-width="2"/>
  <rect x="12" y="76" width="32" height="10" rx="3" fill="#2b2630" stroke="#7a7280" stroke-width="1.5"/>
  <ellipse class="lente" cx="28" cy="88" rx="13" ry="5" fill="#6b5a3c"/>
</svg>`;
const PIVOTE = 18; // altura del eje de giro (la abrazadera) desde el borde del rig
const LENTE = 82; // distancia del eje a la lente
const ESCALA_HAZ = 0.125; // resolución del canvas del cono (un octavo: al estirarlo queda suave)

export function crearReflector() {
  const penumbra = Object.assign(document.createElement("div"), { className: "foco-penumbra" });
  const haz = Object.assign(document.createElement("canvas"), { className: "foco-escena", hidden: true });
  const escena = Object.assign(document.createElement("canvas"), { className: "foco-escena", hidden: true });
  const rig = Object.assign(document.createElement("div"), { className: "foco-rig", innerHTML: '<div class="foco-truss"></div>' });
  for (const el of [penumbra, haz, escena, rig]) el.setAttribute("aria-hidden", "true");
  const cabezas = [0.16, 0.5, 0.84].map((x) => {
    const el = Object.assign(document.createElement("div"), { className: "foco-cabeza", innerHTML: CABEZA_SVG });
    el.style.left = `${x * 100}%`;
    rig.append(el);
    return { el, x, ang: 0 };
  });
  document.body.append(penumbra, haz, escena, rig);

  let enFoco = null, ctx = null, ctxHaz = null, luz = 0, bucle = 0, encendidoEn = 0, motas = [], destellos = [], ultimoDestello = 0, ultimo = null;

  const preparar = () => {
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    escena.width = innerWidth * dpr;
    escena.height = innerHeight * dpr;
    ctx = escena.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    haz.width = Math.ceil(innerWidth * ESCALA_HAZ);
    haz.height = Math.ceil(innerHeight * ESCALA_HAZ);
    ctxHaz = haz.getContext("2d");
    ctxHaz.setTransform(ESCALA_HAZ, 0, 0, ESCALA_HAZ, 0, 0);
  };
  const alRedimensionar = () => { if (bucle) preparar(); };
  addEventListener("resize", alRedimensionar);

  const iniciar = () => {
    if (bucle) return;
    preparar();
    escena.hidden = haz.hidden = false;
    rig.classList.add("prendido");
    encendidoEn = performance.now();
    motas = Array.from({ length: 80 }, () => ({ t: Math.random(), s: Math.random() - 0.5, v: 0.0005 + Math.random() * 0.0012, f: Math.random() * 6.28, r: 0.6 + Math.random() * 1.7 }));
    bucle = requestAnimationFrame(cuadro);
  };
  const detener = () => {
    cancelAnimationFrame(bucle);
    bucle = 0;
    escena.hidden = haz.hidden = true;
    rig.classList.remove("prendido");
    destellos = [];
    ultimo = null;
    for (const c of cabezas) { c.ang = 0; c.giro = 0; c.el.style.rotate = "0rad"; c.el.classList.remove("activa"); }
  };
  // La lámpara arranca con unos tirones (como un foco que se enciende) y después tiembla apenas
  const parpadeo = (dt) => (dt < 540 ? [0.12, 0.85, 0.25, 1, 0.5, 1][Math.floor(dt / 90)] ?? 1 : 0.95 + 0.05 * Math.sin(dt / 90) * Math.sin(dt / 37));
  const poligono = (L, E, nx, ny, w0, w1) => {
    ctxHaz.beginPath();
    ctxHaz.moveTo(L.x + nx * w0, L.y + ny * w0);
    ctxHaz.lineTo(E.x + nx * w1, E.y + ny * w1);
    ctxHaz.lineTo(E.x - nx * w1, E.y - ny * w1);
    ctxHaz.lineTo(L.x - nx * w0, L.y - ny * w0);
    ctxHaz.closePath();
    ctxHaz.fill();
  };

  function dibujarHaz(c, rigTop, r, ahora) {
    const px = c.x * innerWidth, py = rigTop + PIVOTE;
    const dx = Math.sin(c.ang), dy = Math.cos(c.ang);
    const L = { x: px + dx * LENTE, y: py + dy * LENTE };
    const T = { x: r.left + r.width / 2, y: r.top + r.height * 0.55 };
    const dist = Math.max(40, Math.hypot(T.x - L.x, T.y - L.y));
    const E = { x: L.x + dx * dist, y: L.y + dy * dist };
    const nx = dy, ny = -dx;
    const ancho = r.width * 0.62;
    const k = luz * parpadeo(ahora - encendidoEn);

    // Haz: cono exterior en capas (bordes suaves) y núcleo más brillante, de la lente al elemento;
    // charco de luz donde pega. El cono sigue un poco más allá del elemento y ahí se apaga de a poco
    // (sin un borde cortado al final). Va al canvas chico.
    const largo = dist + ancho * 1.1;
    const f = dist / largo; // dónde cae el elemento a lo largo del cono (0 = lente, 1 = punta)
    const F = { x: L.x + dx * largo, y: L.y + dy * largo };
    const hasta = (w0, w1) => w0 + (w1 - w0) / f; // el ancho del cono, prolongado hasta la punta
    ctxHaz.save();
    const g = ctxHaz.createLinearGradient(L.x, L.y, F.x, F.y);
    g.addColorStop(0, "rgba(255,244,214,0.6)");
    g.addColorStop(0.45 * f, "rgba(255,236,190,0.22)");
    g.addColorStop(f, "rgba(255,228,170,0.14)");
    g.addColorStop(f + (1 - f) * 0.45, "rgba(255,228,170,0.05)");
    g.addColorStop(1, "rgba(255,228,170,0)");
    ctxHaz.fillStyle = g;
    for (const [w0, w1, a] of [[26, ancho + 50, 0.18], [20, ancho + 32, 0.25], [14, ancho + 14, 0.32], [10, ancho * 0.85, 0.38], [7, ancho * 0.6, 0.4]]) {
      ctxHaz.globalAlpha = k * a;
      poligono(L, F, nx, ny, w0, hasta(w0, w1));
    }
    const g2 = ctxHaz.createLinearGradient(L.x, L.y, F.x, F.y);
    g2.addColorStop(0, "rgba(255,252,240,0.55)");
    g2.addColorStop(f, "rgba(255,240,205,0.04)");
    g2.addColorStop(1, "rgba(255,240,205,0)");
    ctxHaz.fillStyle = g2;
    ctxHaz.globalAlpha = k;
    poligono(L, F, nx, ny, 6, hasta(6, ancho * 0.42));
    ctxHaz.translate(E.x, E.y);
    ctxHaz.scale(1, 0.55);
    const charco = ctxHaz.createRadialGradient(0, 0, 0, 0, 0, ancho * 1.15);
    charco.addColorStop(0, "rgba(255,238,196,0.34)");
    charco.addColorStop(1, "rgba(255,238,196,0)");
    ctxHaz.fillStyle = charco;
    ctxHaz.fillRect(-ancho * 1.2, -ancho * 1.2, ancho * 2.4, ancho * 2.4);
    ctxHaz.restore();

    // Polvo en suspensión dentro del haz
    for (const m of motas) {
      m.t += m.v;
      if (m.t > 1) { m.t = 0; m.s = Math.random() - 0.5; }
      m.s = Math.max(-0.5, Math.min(0.5, m.s + Math.sin(ahora / 900 + m.f) * 0.0012));
      const semi = 14 + (ancho + 6) * m.t;
      const a = k * (0.12 + 0.55 * Math.abs(Math.sin(ahora / 420 + m.f))) * (1 - m.t * 0.55);
      ctx.fillStyle = `rgba(255,248,225,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(L.x + dx * dist * m.t + nx * m.s * 1.6 * semi, L.y + dy * dist * m.t + ny * m.s * 1.6 * semi, m.r, 0, 6.283);
      ctx.fill();
    }

    // Resplandor de la lente y destello horizontal
    const lente = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 52);
    lente.addColorStop(0, `rgba(255,252,236,${0.95 * k})`);
    lente.addColorStop(0.35, `rgba(255,232,170,${0.35 * k})`);
    lente.addColorStop(1, "rgba(255,232,170,0)");
    ctx.fillStyle = lente;
    ctx.fillRect(L.x - 52, L.y - 52, 104, 104);
    ctx.save();
    ctx.translate(L.x, L.y);
    ctx.scale(1, 0.04);
    const flare = ctx.createRadialGradient(0, 0, 0, 0, 0, 110);
    flare.addColorStop(0, `rgba(255,246,220,${0.5 * k})`);
    flare.addColorStop(1, "rgba(255,246,220,0)");
    ctx.fillStyle = flare;
    ctx.fillRect(-110, -110, 220, 220);
    ctx.restore();

    // Destellos: estrellitas que titilan en el borde del elemento iluminado
    if (luz > 0.6 && ahora - ultimoDestello > 110) {
      ultimoDestello = ahora;
      const lado = Math.floor(Math.random() * 4), u = Math.random();
      const x = lado === 1 ? r.right : lado === 3 ? r.left : r.left + u * r.width;
      const y = lado === 0 ? r.top : lado === 2 ? r.bottom : r.top + u * r.height;
      destellos.push({ x: x + (Math.random() - 0.5) * 14, y: y + (Math.random() - 0.5) * 14, nace: ahora, vida: 600 + Math.random() * 600, tam: 4 + Math.random() * 7 });
    }
    destellos = destellos.filter((d) => ahora - d.nace < d.vida);
    ctx.lineCap = "round";
    for (const d of destellos) {
      const p = Math.sin(Math.PI * ((ahora - d.nace) / d.vida));
      const s = d.tam * p;
      ctx.strokeStyle = `rgba(255,250,228,${(p * k).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(d.x - s, d.y); ctx.lineTo(d.x + s, d.y);
      ctx.moveTo(d.x, d.y - s); ctx.lineTo(d.x, d.y + s);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x - s * 0.4, d.y - s * 0.4); ctx.lineTo(d.x + s * 0.4, d.y + s * 0.4);
      ctx.moveTo(d.x + s * 0.4, d.y - s * 0.4); ctx.lineTo(d.x - s * 0.4, d.y + s * 0.4);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,245,${(p * k).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.6 * p, 0, 6.283);
      ctx.fill();
    }
  }

  function cuadro(ahora) {
    const objetivo = enFoco?.firstElementChild ?? null;
    luz += ((objetivo ? 1 : 0) - luz) * 0.2;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctxHaz.clearRect(0, 0, innerWidth, innerHeight);
    const rigTop = rig.getBoundingClientRect().top;
    const r = objetivo?.getBoundingClientRect();
    const centro = r ? r.left + r.width / 2 : 0;
    // La cabeza más cercana apunta (con el giro mecánico de una cabeza móvil); las otras miran abajo
    const elegida = r ? cabezas.reduce((a, b) => (Math.abs(b.x * innerWidth - centro) < Math.abs(a.x * innerWidth - centro) ? b : a)) : null;
    for (const c of cabezas) {
      const meta = c === elegida ? Math.atan2(centro - c.x * innerWidth, r.top + r.height * 0.55 - (rigTop + PIVOTE)) : 0;
      c.ang += (meta - c.ang) * 0.18;
      // solo se toca el estilo si el giro cambió a la vista (evita recalcular estilos en cada cuadro)
      if (Math.abs(c.ang - (c.giro ?? 0)) > 0.002) c.el.style.rotate = `${-(c.giro = c.ang)}rad`;
      c.el.classList.toggle("activa", (c === elegida || c === ultimo?.c) && luz > 0.3);
    }
    if (elegida) ultimo = { c: elegida, r };
    if (ultimo && luz > 0.02) dibujarHaz(ultimo.c, rigTop, objetivo ? r : ultimo.r, ahora);
    if (!objetivo && luz < 0.02) { detener(); return; }
    bucle = requestAnimationFrame(cuadro);
  }

  return {
    // contenedor: el elemento que queda por encima de la penumbra; su primer hijo es lo que se ilumina
    encender(contenedor) {
      if (sinMovimiento() || !contenedor || contenedor === enFoco) return;
      enFoco?.classList.remove("en-foco");
      enFoco = contenedor;
      contenedor.classList.add("en-foco");
      penumbra.classList.add("prendida");
      iniciar();
    },
    apagar(inmediato = false) {
      enFoco?.classList.remove("en-foco");
      enFoco = null;
      penumbra.classList.remove("prendida");
      if (inmediato) { luz = 0; detener(); }
    },
    destruir() {
      this.apagar(true);
      removeEventListener("resize", alRedimensionar);
      penumbra.remove();
      haz.remove();
      escena.remove();
      rig.remove();
    }
  };
}
