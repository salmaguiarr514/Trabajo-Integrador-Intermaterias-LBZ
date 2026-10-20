import { useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { QRCodeSVG } from "qrcode.react";
import { obtenerCompras, obtenerEntradas } from "../../services/clienteService.js";
import { useCarga } from "../../hooks/useCarga.js";
import { diaMes, pesos, rangoLargo } from "../../utils/formato.js";

const etiquetaDia = (iso) => {
  const { dia, mes, semana } = diaMes(iso);
  return `${semana} ${dia} ${mes}`;
};

const ESTADO_COMPRA = {
  pagada: "text-verde",
  rechazada: "text-fucsia",
  pendiente: "text-amarillo",
  cancelada: "text-gris"
};

// Una entrada: el QR lleva el código (UUID, RN-29) que se escanea en la puerta
function Entrada({ entrada }) {
  const [grande, setGrande] = useState(false);
  const anulada = entrada.estado !== "valida";
  const usada = entrada.ingresos > 0;

  return (
    <article className={`flex flex-col border-2 border-papel bg-noche sm:flex-row ${anulada ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={() => setGrande(!grande)}
        aria-label={grande ? "Achicar el QR" : "Agrandar el QR para mostrarlo en la puerta"}
        className="grid shrink-0 place-items-center border-b-2 border-papel bg-papel p-3 sm:border-r-2 sm:border-b-0"
      >
        <QRCodeSVG value={entrada.codigo} size={grande ? 220 : 112} bgColor="#fff6ec" fgColor="#0d0a0b" level="M" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-fucsia">
          {entrada.id_jornada ? etiquetaDia(entrada.fecha_jornada) : `Abono · ${entrada.cantidad_jornadas} jornadas`}
        </span>
        <p className="font-afiche text-2xl uppercase leading-tight">{entrada.espacio}</p>
        <p className="text-sm text-gris">{entrada.tarifa} · {pesos(entrada.precio_pagado)}</p>
        <p className="mt-auto pt-2 font-mono text-[11px] break-all text-gris">{entrada.codigo}</p>
        {(anulada || usada) && (
          <span className="mt-1 justify-self-start text-xs font-bold uppercase tracking-widest text-amarillo">
            {anulada ? "Anulada" : entrada.id_jornada ? "Ya ingresó" : `Ingresó ${entrada.ingresos} de ${entrada.cantidad_jornadas} jornadas`}
          </span>
        )}
      </div>
    </article>
  );
}

function MisEntradas() {
  const entradas = useCarga(obtenerEntradas, "entradas", "No se pudieron cargar tus entradas");
  const compras = useCarga(obtenerCompras, "compras", "No se pudieron cargar tus compras");

  if (entradas.cargando) return <p className="py-16 text-center font-afiche text-2xl uppercase text-gris">Cargando tus entradas…</p>;
  if (entradas.error) return <p className="border-2 border-fucsia px-4 py-6 text-center">{entradas.error}</p>;

  // Agrupadas por evento, en orden de fecha
  const porEvento = [];
  for (const e of entradas.datos) {
    let grupo = porEvento.find((g) => g.id_evento === e.id_evento);
    if (!grupo) {
      grupo = { ...e, entradas: [] };
      porEvento.push(grupo);
    }
    grupo.entradas.push(e);
  }

  return (
    <div className="grid grid-cols-1 gap-10">
      <section className="grid gap-3">
        <span className="justify-self-start bg-fucsia px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-tinta">Tu acceso</span>
        <h1 className="font-afiche text-6xl uppercase leading-[0.9] sm:text-7xl">Mis entradas</h1>
        <p className="max-w-prose text-gris">Mostrá el QR en la puerta. Tocalo para agrandarlo.</p>
      </section>

      {porEvento.length === 0 ? (
        <div className="border-2 border-dashed border-borde px-6 py-12 text-center">
          <p className="font-afiche text-2xl uppercase">Todavía no tenés entradas</p>
          <Link to="/" className="mt-4 inline-block border-2 border-papel bg-papel px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-tinta hover:border-fucsia hover:bg-fucsia">
            Ver la cartelera
          </Link>
        </div>
      ) : (
        porEvento.map((g) => (
          <section key={g.id_evento} className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-papel pb-3">
              <div>
                <Link to={`/eventos/${g.id_evento}`} className="font-afiche text-3xl uppercase leading-tight text-papel hover:text-amarillo">
                  {g.evento}
                </Link>
                <p className="text-sm text-gris">
                  {rangoLargo(g.fecha_inicio, g.fecha_fin)} · {g.lugar}, {g.direccion}, {g.ciudad}
                </p>
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-gris">
                {g.entradas.length} {g.entradas.length === 1 ? "entrada" : "entradas"}
                {g.estado_evento === "cancelado" && <span className="ml-2 text-fucsia">· evento cancelado</span>}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {g.entradas.map((e) => (
                <Entrada key={e.id_entrada} entrada={e} />
              ))}
            </div>
          </section>
        ))
      )}

      {compras.datos?.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gris">Historial de compras</h2>
          <div className="overflow-x-auto border-2 border-borde">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b-2 border-borde text-left text-xs uppercase tracking-widest text-gris">
                  <th className="px-3 py-2 font-bold">Fecha</th>
                  <th className="px-3 py-2 font-bold">Evento</th>
                  <th className="px-3 py-2 text-right font-bold">Entradas</th>
                  <th className="px-3 py-2 text-right font-bold">Total</th>
                  <th className="px-3 py-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.datos.map((c) => (
                  <tr key={c.id_compra} className="border-b border-borde last:border-b-0">
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums text-gris">{dayjs(c.fecha).format("DD/MM/YYYY HH:mm")}</td>
                    <td className="px-3 py-2">{c.evento}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.cantidad}</td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{pesos(c.total)}</td>
                    <td className={`px-3 py-2 text-xs font-bold uppercase tracking-widest ${ESTADO_COMPRA[c.estado]}`}>{c.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default MisEntradas;
