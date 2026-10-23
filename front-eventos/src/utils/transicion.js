import { flushSync } from "react-dom";

// Cambio dentro de una misma pantalla (pestañas, filtros, opciones) con View Transitions: la página no se
// mueve; lo que tiene view-transition-name (la opción elegida, el panel que cambia) se desliza o se funde
// a su estado nuevo (ver "Movimiento" en index.css). Sin soporte o con movimiento reducido, cambia al instante.
//   conTransicion(() => setPestaña(valor))
export function conTransicion(cambio) {
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reducido) {
    cambio();
    return;
  }
  const raiz = document.documentElement;
  raiz.dataset.transicion = "local";
  const t = document.startViewTransition(() => flushSync(cambio));
  t.finished.finally(() => delete raiz.dataset.transicion);
}
