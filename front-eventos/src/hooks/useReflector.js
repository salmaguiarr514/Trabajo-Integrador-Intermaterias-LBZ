import { useEffect, useMemo, useRef } from "react";
import { crearReflector } from "../utils/reflector.js";

// Foco de escenario para una pantalla (ver utils/reflector.js). Se crea al montar y se quita al salir.
// Devuelve los manejadores para el contenedor de cada elemento iluminable:
//   const foco = useReflector();
//   <div {...foco.props}><a ...>evento</a></div>     (y foco.apagar(true) antes de navegar)
export function useReflector() {
  const reflector = useRef(null);

  useEffect(() => {
    reflector.current = crearReflector();
    return () => reflector.current.destruir();
  }, []);

  return useMemo(() => {
    const encender = (el) => reflector.current?.encender(el);
    const apagar = (inmediato) => reflector.current?.apagar(inmediato);
    return {
      apagar,
      props: {
        // Con el mouse (en pantallas táctiles no se prende) o al llegar con Tab
        onPointerEnter: (ev) => ev.pointerType === "mouse" && encender(ev.currentTarget),
        onPointerLeave: () => apagar(),
        onFocus: (ev) => ev.target.matches(":focus-visible") && encender(ev.currentTarget),
        onBlur: (ev) => !ev.currentTarget.contains(ev.relatedTarget) && apagar()
      }
    };
  }, []);
}
