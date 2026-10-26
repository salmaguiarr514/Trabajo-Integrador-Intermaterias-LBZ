import { useId } from "react";
import { caja, centro, TIPOS_ELEMENTO, trazo } from "./geometria.js";

// Plano de un lugar en SVG: sectores (espacios), escenarios y elementos de referencia.
// Lo usan el panel (detalle del lugar, paso de tarifas) y el sitio (elegir sector al comprar).
//   <VisorPlano plano={plano} tema="afiche" sectores={{ [id_espacio]: { estado, detalle } }} elegido={id} onElegir={setId} />
// - tema: "panel" (violeta, antd) o "afiche" (sitio del cliente). Los colores están en index.css ("Plano").
// - sectores (opcional): estado de cada sector → "disponible" | "pocas" | "agotado" | "sin_venta", y un texto corto
//   (ej. "Desde $ 66.000") que se lee en el mapa y en el nombre accesible. El estado nunca es solo un color.
// - onElegir (opcional): los sectores pasan a ser botones (clic, Enter o Espacio).

// Texto que entra en la forma: el tamaño sale del ancho y alto disponibles, con un mínimo legible.
// Si en una línea queda chico y tiene espacios, se parte en dos (por el espacio más cercano al medio).
const LETRA = 0.58; // ancho medio de una letra en proporción al tamaño
const MINIMO = 12;
const enLineas = (texto, ancho, alto, max) => {
  const entra = (largo, lineas) => Math.min(max, (alto * 0.3) / lineas ** 0.5, (ancho * 0.9) / (Math.max(largo, 3) * LETRA));
  const una = entra(texto.length, 1);
  const espacios = [...texto.matchAll(/ /g)].map((m) => m.index);
  if (una >= 16 || espacios.length === 0) return { lineas: [texto], t: Math.max(MINIMO, una) };
  const corte = espacios.reduce((a, b) => (Math.abs(b - texto.length / 2) < Math.abs(a - texto.length / 2) ? b : a));
  const lineas = [texto.slice(0, corte), texto.slice(corte + 1)];
  const dos = entra(Math.max(...lineas.map((l) => l.length)), 2);
  return dos > una ? { lineas, t: Math.max(MINIMO, dos) } : { lineas: [texto], t: Math.max(MINIMO, una) };
};

export function Rotulo({ g, texto, detalle, max = 34, className = "" }) {
  const [cx, cy] = centro(g);
  const c = caja(g);
  const { lineas, t } = enLineas(texto, c.w, c.h, max);
  const conDetalle = detalle && c.h > t * (lineas.length + 1.4);
  const alto = t * 1.05 * lineas.length + (conDetalle ? t * 0.7 : 0);
  return (
    <text x={cx} y={cy - alto / 2 + t * 0.82} textAnchor="middle" fontSize={t} className={`plano-rotulo ${className}`} pointerEvents="none">
      {lineas.map((l, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? 0 : t * 1.05}>
          {l}
        </tspan>
      ))}
      {conDetalle && (
        <tspan x={cx} dy={t * 0.95} fontSize={t * 0.62} className="plano-detalle">
          {detalle}
        </tspan>
      )}
    </text>
  );
}

// El lienzo con su grilla (el id del patrón es único por plano en la página)
export function Lienzo({ ancho, alto, idGrilla }) {
  return (
    <>
      <defs>
        <pattern id={idGrilla} width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0 H0 V50" className="plano-grilla" fill="none" />
        </pattern>
      </defs>
      <rect width={ancho} height={alto} className="plano-lienzo" />
      <rect width={ancho} height={alto} fill={`url(#${idGrilla})`} pointerEvents="none" />
    </>
  );
}

export function Elementos({ elementos }) {
  return elementos.map((el, i) => (
    <g key={el.id_elemento ?? i} className="plano-elemento">
      <title>{el.etiqueta || TIPOS_ELEMENTO[el.tipo]?.texto}</title>
      <path d={trazo(el.geometria)} />
      <Rotulo g={el.geometria} texto={TIPOS_ELEMENTO[el.tipo]?.corto || el.etiqueta || ""} max={20} />
    </g>
  ));
}

export function Escenarios({ escenarios }) {
  return escenarios.map((sc) => (
    <g key={sc.id_escenario} className="plano-escenario">
      <title>Escenario {sc.nombre}</title>
      <path d={trazo(sc.geometria)} />
      <Rotulo g={sc.geometria} texto={sc.nombre.toUpperCase()} max={26} />
    </g>
  ));
}

const ESTADOS = {
  disponible: "Disponible",
  pocas: "Últimas entradas",
  agotado: "Agotado",
  sin_venta: "Sin entradas a la venta"
};

function VisorPlano({ plano, tema = "panel", sectores, elegido, onElegir, titulo = "Plano del lugar", leyenda = true }) {
  const idGrilla = `grilla-${useId().replace(/:/g, "")}`;
  const idRayado = `rayado-${idGrilla}`;
  const elegible = Boolean(onElegir);

  const tecla = (ev, id) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      onElegir(id);
    }
  };

  const estados = sectores ? [...new Set(Object.values(sectores).map((s) => s.estado))] : [];

  return (
    <figure className={`plano plano--${tema}`}>
      <svg
        viewBox={`0 0 ${plano.ancho} ${plano.alto}`}
        role={elegible ? "group" : "img"}
        aria-label={elegible ? `${titulo}: elegí un sector` : `${titulo}: ${plano.espacios.map((e) => e.nombre).join(", ")}`}
      >
        <Lienzo ancho={plano.ancho} alto={plano.alto} idGrilla={idGrilla} />
        <defs>
          <pattern id={idRayado} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" className="plano-rayado" />
          </pattern>
        </defs>
        {/* Barras, baños, ingresos: abajo (se ven a través de los sectores) y sin atrapar los clics */}
        <g pointerEvents="none">
          <Elementos elementos={plano.elementos} />
        </g>
        <Escenarios escenarios={plano.escenarios} />
        {plano.espacios.map((e, i) => {
          const s = sectores?.[e.id_espacio];
          const estado = s?.estado ?? "disponible";
          const nombre = `${e.nombre}${s ? `: ${ESTADOS[estado]}${s.detalle ? `, ${s.detalle}` : ""}` : ""}`;
          const props = elegible
            ? {
                role: "button",
                tabIndex: 0,
                "aria-pressed": elegido === e.id_espacio,
                "aria-label": nombre,
                onClick: () => onElegir(e.id_espacio),
                onKeyDown: (ev) => tecla(ev, e.id_espacio)
              }
            : { "aria-hidden": true };
          return (
            <g
              key={e.id_espacio}
              className={`plano-sector plano-sector--${estado} ${elegido === e.id_espacio ? "elegido" : ""} ${elegible ? "elegible" : ""}`}
              style={{ "--c": e.color || "#9e9e9e", "--i": i }}
              {...props}
            >
              {!elegible && <title>{nombre}</title>}
              <path d={trazo(e.geometria)} className="plano-forma" />
              {estado === "agotado" && <path d={trazo(e.geometria)} fill={`url(#${idRayado})`} pointerEvents="none" />}
              <Rotulo g={e.geometria} texto={e.nombre.toUpperCase()} detalle={s?.detalle ?? (sectores ? ESTADOS[estado] : null)} />
            </g>
          );
        })}
      </svg>
      {leyenda && estados.length > 0 && (
        <figcaption className="plano-leyenda">
          {estados.map((estado) => (
            <span key={estado} className={`plano-clave plano-clave--${estado}`}>
              {ESTADOS[estado]}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

export default VisorPlano;
