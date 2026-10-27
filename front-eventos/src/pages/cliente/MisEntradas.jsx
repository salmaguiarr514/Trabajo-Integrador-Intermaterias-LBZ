import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { QRCodeSVG } from "qrcode.react";
import { enviarEntradasPorMail, obtenerCompras, obtenerEntradas } from "../../services/clienteService.js";
import { mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import { diaMes, pesos, rangoLargo } from "../../utils/formato.js";
import { AFICHE } from "../../tema.js";
import { ESTADOS } from "../../utils/estados.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { ErrorCarga, Hueco, TituloLetras } from "../../components/afiche.jsx";

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

// Una entrada: el QR es un JWT firmado por la API con el código de la entrada (RN-29): en la puerta se
// verifica la firma, así que un QR modificado no entra. Debajo va el código, para escribirlo si no se lee.
// Tocándolo se abre a pantalla completa, en blanco, para que el lector lo tome fácil (Escape o "Cerrar" vuelve).
// numero/total: cuál es entre las del evento, para que cada QR tenga un nombre distinto al leerlo
function Entrada({ entrada, numero, total }) {
  const pantalla = useRef(null);
  const anulada = entrada.estado !== "valida";
  const usada = entrada.ingresos > 0;
  const dia = entrada.id_jornada ? etiquetaDia(entrada.fecha_jornada) : `Abono · ${entrada.cantidad_jornadas} jornadas`;

  return (
    <article className={`flex flex-col border-2 bg-noche sm:flex-row ${anulada ? "border-borde" : "border-papel"}`}>
      <button
        type="button"
        disabled={anulada}
        onClick={() => pantalla.current?.showModal()}
        aria-label={`Mostrar en pantalla completa el QR de la entrada ${numero} de ${total}: ${entrada.espacio}, ${dia}`}
        className={`grid shrink-0 place-items-center border-b-2 border-papel bg-papel p-3 sm:border-r-2 sm:border-b-0 ${anulada ? "opacity-40" : ""}`}
      >
        <QRCodeSVG value={entrada.qr ?? entrada.codigo} size={112} bgColor={AFICHE.papel} fgColor={AFICHE.tinta} level="M" aria-hidden="true" />
      </button>
      <dialog
        ref={pantalla}
        aria-label={`QR de la entrada: ${entrada.espacio}, ${dia}`}
        onClick={(ev) => ev.target === pantalla.current && pantalla.current.close()}
        className="dialogo-qr fixed inset-0 m-0 size-full max-h-none max-w-none bg-papel p-0 text-tinta backdrop:bg-tinta"
      >
        <div className="mx-auto grid h-full max-w-md content-center justify-items-center gap-4 p-6 text-center">
          <p className="font-afiche text-3xl uppercase leading-tight text-balance">{entrada.evento}</p>
          <p className="text-base font-semibold">{dia} · {entrada.espacio} · {entrada.tarifa}</p>
          <div className="relative w-full">
            <QRCodeSVG value={entrada.qr ?? entrada.codigo} size={512} aria-label={`Código QR de la entrada ${entrada.codigo}`} style={{ display: "block", width: "100%", height: "auto" }} bgColor={AFICHE.papel} fgColor={AFICHE.tinta} level="M" />
            <span className="escaneo" aria-hidden="true" />
          </div>
          <p className="font-mono text-sm break-all">{entrada.codigo}</p>
          <button
            type="button"
            onClick={() => pantalla.current?.close()}
            className="border-2 border-tinta px-5 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-tinta hover:text-papel"
          >
            Cerrar
          </button>
        </div>
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-fucsia">{dia}</span>
        <p className="font-afiche text-2xl uppercase leading-tight">{entrada.espacio}</p>
        <p className="text-sm text-gris">{entrada.tarifa} · {pesos(entrada.precio_pagado)}</p>
        <p className="mt-auto pt-2 font-mono text-xs break-all text-gris">{entrada.codigo}</p>
        {(anulada || usada) && (
          <span className="mt-1 justify-self-start text-xs font-bold uppercase tracking-widest text-amarillo">
            {anulada ? "Anulada" : entrada.id_jornada ? "Ya ingresó" : `Ingresó ${entrada.ingresos} de ${entrada.cantidad_jornadas} jornadas`}
          </span>
        )}
      </div>
    </article>
  );
}

// "Mandármelas por mail": las entradas válidas del evento, al mail de la cuenta (con sus QR)
function BotonMail({ idEvento }) {
  const [estado, setEstado] = useState({ enviando: false, texto: "", error: false });
  const mandar = async () => {
    setEstado({ enviando: true, texto: "", error: false });
    try {
      const { data } = await enviarEntradasPorMail(idEvento);
      setEstado({ enviando: false, texto: data.mensaje, error: !data.enviado });
    } catch (error) {
      setEstado({ enviando: false, texto: mensajeDeError(error, "No pudimos mandar el mail"), error: true });
    }
  };
  return (
    <div className="grid justify-items-end gap-1">
      <button
        type="button"
        onClick={mandar}
        disabled={estado.enviando}
        className="border-2 border-papel px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-papel hover:text-tinta disabled:border-borde disabled:text-borde"
      >
        {estado.enviando ? "Mandando…" : "Mandármelas por mail"}
      </button>
      <p role="status" className={`entra text-xs ${estado.error ? "text-amarillo" : "text-verde"}`}>
        {estado.texto}
      </p>
    </div>
  );
}

const encabezado = (
  <section className="entra grid gap-3">
    <TituloLetras texto="Mis entradas" className="font-afiche text-6xl uppercase leading-[0.9] sm:text-7xl" />
    <p className="max-w-prose text-gris">Mostrá el QR en la puerta. Tocalo para verlo en pantalla completa.</p>
  </section>
);

// Lugar reservado de una entrada mientras cargan (mismo alto que Entrada)
function EntradaHueco() {
  return (
    <div className="flex flex-col border-2 border-linea sm:flex-row">
      <Hueco className="h-[8.5rem] sm:w-[8.5rem]" fondo="bg-linea" />
      <div className="grid flex-1 content-start gap-2 p-4">
        <Hueco className="h-3 w-24" />
        <Hueco className="h-7 w-40" />
        <Hueco className="h-4 w-32" />
      </div>
    </div>
  );
}

function MisEntradas() {
  const entradas = useCarga(obtenerEntradas, "entradas", "No se pudieron cargar tus entradas");
  const compras = useCarga(obtenerCompras, "compras", "No se pudieron cargar tus compras");
  useTitulo("Mis entradas");

  if (entradas.cargando) {
    return (
      <div className="grid grid-cols-1 gap-10" aria-busy="true">
        {encabezado}
        <p role="status" className="sr-only">Cargando tus entradas…</p>
        <div className="grid gap-4">
          <Hueco className="h-9 w-2/3" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EntradaHueco />
            <EntradaHueco />
          </div>
        </div>
      </div>
    );
  }
  if (entradas.error) {
    return (
      <div className="grid grid-cols-1 gap-10">
        {encabezado}
        <ErrorCarga titulo="No pudimos cargar tus entradas" mensaje={entradas.error} onReintentar={entradas.recargar} />
      </div>
    );
  }

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
      {encabezado}

      {porEvento.length === 0 ? (
        <div className="border-2 border-dashed border-linea px-6 py-12 text-center">
          <p className="font-afiche text-2xl uppercase">Todavía no tenés entradas</p>
          <Link viewTransition to="/" className="mt-4 inline-block border-2 border-papel bg-papel px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-tinta hover:border-fucsia hover:bg-fucsia">
            Ver la cartelera
          </Link>
        </div>
      ) : (
        porEvento.map((g) => (
          <section key={g.id_evento} className="entra grid gap-4" style={{ "--i": 1 }}>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-papel pb-3">
              <div>
                <Link viewTransition to={`/eventos/${g.id_evento}`} className="font-afiche text-3xl uppercase leading-tight text-papel hover:text-amarillo">
                  {g.evento}
                </Link>
                <p className="text-sm text-gris">
                  {rangoLargo(g.fecha_inicio, g.fecha_fin)} · {g.lugar}, {g.direccion}, {g.ciudad}
                </p>
              </div>
              <div className="grid justify-items-end gap-2">
                <span className="text-sm font-bold uppercase tracking-widest text-gris">
                  {g.entradas.length} {g.entradas.length === 1 ? "entrada" : "entradas"}
                  {g.estado_evento === "cancelado" && <span className="ml-2 text-fucsia">· evento cancelado</span>}
                </span>
                {g.estado_evento !== "cancelado" && g.entradas.some((e) => e.estado === "valida") && <BotonMail idEvento={g.id_evento} />}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {g.entradas.map((e, i) => (
                <div key={e.id_entrada} className="voltea grid grid-cols-1" style={{ "--i": i }}>
                  <Entrada entrada={e} numero={i + 1} total={g.entradas.length} />
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {compras.datos?.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-gris">Historial de compras</h2>
          <div className="overflow-x-auto border-2 border-linea">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b-2 border-linea text-left text-xs uppercase tracking-widest text-gris">
                  <th className="px-3 py-2 font-bold">Fecha</th>
                  <th className="px-3 py-2 font-bold">Evento</th>
                  <th className="px-3 py-2 text-right font-bold">Entradas</th>
                  <th className="px-3 py-2 text-right font-bold">Total</th>
                  <th className="px-3 py-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.datos.map((c) => (
                  <tr key={c.id_compra} className="border-b border-linea last:border-b-0">
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums text-gris">{dayjs(c.fecha).format("DD/MM/YYYY HH:mm")}</td>
                    <td className="px-3 py-2">{c.evento}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.cantidad}</td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{pesos(c.total)}</td>
                    <td className={`px-3 py-2 text-xs font-bold uppercase tracking-widest ${ESTADO_COMPRA[c.estado]}`}>{ESTADOS.compra[c.estado]?.texto ?? c.estado}</td>
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
