import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { obtenerEventoPublico } from "../../services/publicService.js";
import { useAuth } from "../../context/auth.js";
import { useCarga } from "../../hooks/useCarga.js";
import { diaMes, hora, numero, pesos, rangoLargo } from "../../utils/formato.js";
import { guardarCarrito, leerCarrito } from "../../utils/carrito.js";

const ABONO = "abono";
const MAX_ENTRADAS = 10; // RN-30

const etiquetaDia = (iso) => {
  const { dia, mes, semana } = diaMes(iso);
  return `${semana} ${dia} ${mes}`;
};

// Por qué una tarifa no se puede comprar ahora (o null si se puede)
const motivoNoDisponible = (t) => {
  if (t.disponibles <= 0) return "Agotado";
  if (!t.en_venta) {
    if (t.venta_desde && t.venta_desde > dayjs().format("YYYY-MM-DDTHH:mm")) {
      return `A la venta desde el ${t.venta_desde.slice(8, 10)}/${t.venta_desde.slice(5, 7)}`;
    }
    return "Venta cerrada";
  }
  return null;
};

function Grilla({ evento, jornada }) {
  if (jornada === ABONO) {
    return (
      <ul>
        {evento.jornadas.map((j) => {
          const cierre = evento.presentaciones.find((p) => p.id_jornada === j.id_jornada && p.headliner);
          return (
            <li key={j.id_jornada} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-4 border-b-2 border-dashed border-linea px-4 py-3 last:border-b-0">
              <span className="text-sm uppercase text-gris">{etiquetaDia(j.fecha)}</span>
              <span className="font-afiche text-xl uppercase leading-tight">
                {cierre?.artista ?? "—"}
                <span className="block font-sans text-xs normal-case text-gris">Cierre de la jornada{j.nombre ? ` · ${j.nombre}` : ""}</span>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  const shows = evento.presentaciones.filter((p) => p.id_jornada === jornada);
  if (shows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-gris">Todavía no se anunció el line-up de este día.</p>;
  }
  return (
    <ul>
      {shows.map((p) => (
        <li key={p.id_presentacion} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b-2 border-dashed border-linea px-4 py-3 last:border-b-0">
          <span className="text-sm tabular-nums text-gris">{hora(p.inicio)}</span>
          <span className="min-w-0 font-afiche text-xl uppercase leading-tight">
            {p.artista}
            <span className="block font-sans text-xs normal-case text-gris">
              {p.escenario} · hasta {hora(p.fin)}
              {p.genero ? ` · ${p.genero}` : ""}
            </span>
          </span>
          {p.headliner ? (
            <span className="border-2 border-amarillo px-2 text-xs font-extrabold uppercase tracking-widest text-amarillo">Cierre</span>
          ) : (
            <span />
          )}
        </li>
      ))}
    </ul>
  );
}

function Contador({ valor, maximo, onCambio, nombre }) {
  return (
    <div className="flex items-center border-2 border-papel">
      <button type="button" aria-label={`Una entrada menos de ${nombre}`} disabled={valor <= 0} onClick={() => onCambio(valor - 1)} className="size-9 font-bold disabled:text-borde">
        −
      </button>
      <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">{valor}</span>
      <button type="button" aria-label={`Una entrada más de ${nombre}`} disabled={valor >= maximo} onClick={() => onCambio(valor + 1)} className="size-9 font-bold disabled:text-borde">
        +
      </button>
    </div>
  );
}

function EventoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const evento = useCarga(() => obtenerEventoPublico(id), id, "No se pudo cargar el evento");
  const [pestaña, setPestaña] = useState(null);
  const [carrito, setCarrito] = useState(() => leerCarrito(id)); // { id_tarifa: cantidad }
  const [aviso, setAviso] = useState("");

  if (evento.cargando) return <p className="py-16 text-center font-afiche text-2xl uppercase text-gris">Cargando evento…</p>;
  if (evento.error) {
    return (
      <section className="grid justify-items-start gap-4 py-16">
        <span className="bg-fucsia px-3 py-1 font-afiche text-xl text-tinta">404</span>
        <h1 className="font-afiche text-5xl uppercase leading-none">Evento no encontrado</h1>
        <p className="text-gris">{evento.error}</p>
        <Link to="/" className="border-2 border-papel bg-papel px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-tinta hover:border-fucsia hover:bg-fucsia">
          Volver a la cartelera
        </Link>
      </section>
    );
  }

  const e = evento.datos;
  const hayAbono = e.tarifas.some((t) => t.id_jornada === null);
  const actual = pestaña ?? e.jornadas[0]?.id_jornada ?? ABONO;
  const tarifas = e.tarifas.filter((t) => (actual === ABONO ? t.id_jornada === null : t.id_jornada === actual));
  const pestañas = [
    ...e.jornadas.map((j) => ({ valor: j.id_jornada, texto: etiquetaDia(j.fecha) })),
    ...(hayAbono ? [{ valor: ABONO, texto: e.jornadas.length > 1 ? `Abono ${e.jornadas.length} días` : "Abono" }] : [])
  ];

  // Lo elegido, en todas las pestañas
  const elegidas = e.tarifas.filter((t) => carrito[t.id_tarifa] > 0).map((t) => ({ ...t, cantidad: carrito[t.id_tarifa] }));
  const cantidadTotal = elegidas.reduce((s, t) => s + t.cantidad, 0);
  const subtotal = elegidas.reduce((s, t) => s + t.precio * t.cantidad, 0);
  const cargo = Math.round(subtotal * e.cargo_servicio_pct) / 100;

  const cambiar = (t, cantidad) => {
    const nuevo = { ...carrito, [t.id_tarifa]: cantidad };
    setCarrito(nuevo);
    guardarCarrito(id, nuevo);
    setAviso("");
  };

  const comprar = () => {
    guardarCarrito(id, carrito);
    if (!usuario) {
      navigate("/login", { state: { desde: `/checkout/${id}` } });
    } else if (usuario.rol !== "cliente") {
      setAviso("Para comprar entradas, ingresá con una cuenta de cliente.");
    } else {
      navigate(`/checkout/${id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <Link to="/" className="justify-self-start text-xs font-bold uppercase tracking-widest text-gris hover:text-papel">
        ← Cartelera
      </Link>

      <section className="grid gap-4 border-2 border-papel bg-fucsia p-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:p-8">
        <span className="justify-self-start bg-tinta px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amarillo">
          {e.tipo} · {e.jornadas.length} {e.jornadas.length === 1 ? "jornada" : "jornadas"}
          {e.estado === "agotado" && " · agotado"}
        </span>
        <h1 className="font-afiche text-5xl uppercase leading-[0.92] text-balance sm:text-7xl">{e.nombre}</h1>
        {e.descripcion && <p className="max-w-prose font-medium">{e.descripcion}</p>}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
          <span>{rangoLargo(e.fecha_inicio, e.fecha_fin)}</span>
          <span>{e.lugar} · {e.direccion}, {e.ciudad}</span>
          <span>Organiza {e.productora}</span>
        </div>
      </section>

      {pestañas.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jornadas">
          {pestañas.map((p) => (
            <button
              key={p.valor}
              type="button"
              role="tab"
              aria-selected={actual === p.valor}
              onClick={() => setPestaña(p.valor)}
              className={`border-2 px-4 py-2 text-sm font-extrabold uppercase tracking-wider ${
                actual === p.valor ? "border-papel bg-papel text-tinta" : "border-papel text-papel hover:bg-noche"
              }`}
            >
              {p.texto}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="border-2 border-papel bg-noche">
          <h2 className="border-b-2 border-papel px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em]">
            {actual === ABONO ? "Cierres incluidos en el abono" : "Grilla del día"}
          </h2>
          <Grilla evento={e} jornada={actual} />
        </section>

        <section className="border-2 border-papel bg-noche lg:sticky lg:top-24">
          <h2 className="border-b-2 border-papel px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em]">Entradas</h2>
          <div className="grid gap-3 p-4">
            {tarifas.length === 0 && <p className="py-4 text-center text-sm text-gris">No hay entradas a la venta para este día.</p>}
            {tarifas.map((t) => {
              const motivo = motivoNoDisponible(t);
              const cantidad = carrito[t.id_tarifa] ?? 0;
              const maximo = Math.min(t.disponibles, cantidad + MAX_ENTRADAS - cantidadTotal);
              return (
                <div
                  key={t.id_tarifa}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-2 px-4 py-3 ${
                    cantidad > 0 ? "border-amarillo" : motivo ? "border-linea" : "border-borde"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold">
                      {t.espacio} <span className="font-normal text-gris">· {t.nombre}</span>
                    </p>
                    <p className="text-sm tabular-nums">
                      <span className="font-bold">{pesos(t.precio)}</span>
                      <span className="text-gris">
                        {" · "}
                        {motivo ? <span className="font-semibold text-amarillo">{motivo}</span> : t.disponibles < 100 ? `Últimas ${t.disponibles}` : `Quedan ${numero(t.disponibles)}`}
                      </span>
                    </p>
                  </div>
                  {!motivo && <Contador valor={cantidad} maximo={maximo} onCambio={(v) => cambiar(t, v)} nombre={`${t.espacio} ${t.nombre}`} />}
                </div>
              );
            })}

            <div className="mt-2 grid gap-1 border-t-2 border-dashed border-linea pt-3 text-sm">
              {elegidas.length === 0 ? (
                <p className="text-gris">Elegí tus entradas. Podés combinar días, sectores y abonos (hasta {MAX_ENTRADAS} por compra).</p>
              ) : (
                <>
                  {elegidas.map((t) => (
                    <div key={t.id_tarifa} className="flex justify-between gap-3">
                      <span className="text-gris">
                        {t.cantidad} × {t.espacio} · {t.nombre}
                      </span>
                      <span className="tabular-nums">{pesos(t.precio * t.cantidad)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3">
                    <span className="text-gris">Service charge ({e.cargo_servicio_pct}%)</span>
                    <span className="tabular-nums">{pesos(cargo)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 pt-2">
                    <span className="font-bold uppercase tracking-widest">Total</span>
                    <span className="font-afiche text-3xl tabular-nums">{pesos(subtotal + cargo)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={cantidadTotal === 0}
              onClick={comprar}
              className="border-2 border-papel bg-papel py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-tinta hover:border-fucsia hover:bg-fucsia disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-papel disabled:hover:bg-papel"
            >
              {cantidadTotal > 0 ? `Comprar ${cantidadTotal} ${cantidadTotal === 1 ? "entrada" : "entradas"}` : "Comprar entradas"}
            </button>
            {!usuario && cantidadTotal > 0 && <p className="text-center text-xs text-gris">Te vamos a pedir que ingreses o crees una cuenta.</p>}
            {aviso && <p role="status" className="border-2 border-amarillo px-3 py-2 text-sm text-amarillo">{aviso}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default EventoDetalle;
