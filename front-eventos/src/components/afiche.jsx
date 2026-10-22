import { cloneElement, useId } from "react";

// Piezas del sitio público (Tailwind, estética de afiche) que se repiten entre pantallas.

// Botones y links con forma de botón. "Presionar" achica un poco el botón (solo si no pide movimiento reducido).
const base =
  "inline-flex items-center justify-center gap-2 border-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest transition-[background-color,border-color,color,scale] duration-150 ease-out motion-safe:enabled:active:scale-96 disabled:cursor-not-allowed";

export const botonPrimario = `${base} border-papel bg-papel text-tinta hover:border-fucsia hover:bg-fucsia disabled:border-borde disabled:bg-borde disabled:text-papel`;
export const botonSecundario = `${base} border-papel text-papel hover:bg-papel hover:text-tinta`;

export const campoClase =
  "w-full border-2 border-borde bg-tinta px-3 py-2.5 text-base text-papel placeholder:text-gris focus:border-amarillo focus:outline-none aria-invalid:border-fucsia";

// Campo con etiqueta y error. El error queda asociado al control (aria-describedby) y lo marca como inválido.
//   <Campo etiqueta="Email" error={errores.email}><input className={campoClase} /></Campo>
export function Campo({ etiqueta, error, ayuda, children }) {
  const id = useId();
  const idDetalle = `${id}-detalle`;
  return (
    <div className="grid gap-1.5 text-sm">
      <label htmlFor={id} className="font-semibold text-papel">
        {etiqueta}
      </label>
      {cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || ayuda ? idDetalle : undefined
      })}
      {(error || ayuda) && (
        <span id={idDetalle} className={error ? "text-fucsia" : "text-gris"}>
          {error ?? ayuda}
        </span>
      )}
    </div>
  );
}

// Aviso dentro de un formulario: error (fucsia) o información (amarillo)
export function Aviso({ tipo = "error", children }) {
  const color = tipo === "error" ? "border-fucsia text-fucsia" : "border-amarillo text-amarillo";
  return (
    <p role={tipo === "error" ? "alert" : "status"} className={`border-2 px-3 py-2 text-sm ${color}`}>
      {children}
    </p>
  );
}
