import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerCartelera, obtenerCiudades } from "../../services/publicService.js";
import { mensajeDeError } from "../../services/api.js";
import { diaMes, pesos } from "../../utils/formato.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { ErrorCarga, Hueco } from "../../components/afiche.jsx";

const TIPOS = [
  { valor: "", texto: "Todos" },
  { valor: "festival", texto: "Festivales" },
  { valor: "recital", texto: "Recitales" }
];

function TarjetaEvento({ evento }) {
  const { dia, mes, semana } = diaMes(evento.fecha_inicio);
  const varios = evento.fecha_inicio !== evento.fecha_fin;

  return (
    <Link
      to={`/eventos/${evento.id_evento}`}
      state={{ previa: evento }} // el detalle muestra esto al instante, mientras llega el resto
      className="group flex flex-col border-2 border-papel bg-noche text-papel shadow-[6px_6px_0_var(--color-fucsia)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--color-fucsia)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amarillo"
    >
      <div className="flex items-stretch border-b-2 border-papel">
        <div className="grid w-20 shrink-0 place-items-center border-r-2 border-papel bg-amarillo py-2 text-tinta">
          <span className="text-xs font-bold uppercase tracking-widest">{semana}</span>
          <span className="font-afiche text-4xl leading-none">{dia}</span>
          <span className="text-xs font-bold uppercase tracking-widest">{mes}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-fucsia">
            {evento.tipo}
            {varios && " · varias jornadas"}
            {evento.estado === "agotado" && " · agotado"}
          </span>
          <span className="truncate text-sm text-gris">
            {evento.lugar} · {evento.ciudad}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="font-afiche text-3xl uppercase leading-[1.05] text-balance group-hover:text-amarillo">{evento.nombre}</h2>
        {evento.headliners && <p className="text-sm text-gris">Con {evento.headliners}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <span className="text-xs text-gris">por {evento.productora}</span>
          {evento.precio_desde != null && (
            <span className="text-right">
              <span className="block text-xs uppercase tracking-widest text-gris">Desde</span>
              <span className="font-afiche text-2xl tabular-nums">{pesos(evento.precio_desde)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Lugar reservado de una tarjeta mientras carga la cartelera (mismo alto que TarjetaEvento)
function TarjetaHueco() {
  return (
    <div className="flex flex-col border-2 border-linea">
      <div className="flex border-b-2 border-linea">
        <Hueco className="h-[5.75rem] w-20" fondo="bg-linea" />
        <div className="grid flex-1 content-center gap-2 px-4">
          <Hueco className="h-3 w-20" />
          <Hueco className="h-4 w-40 max-w-full" />
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <Hueco className="h-8 w-3/4" />
        <Hueco className="h-4 w-1/2" />
        <Hueco className="mt-8 h-7 w-24 justify-self-end" />
      </div>
    </div>
  );
}

function Cartelera() {
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState("");
  const [ciudades, setCiudades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [intento, setIntento] = useState(0); // "Reintentar" lo suma y vuelve a pedir
  useTitulo("Cartelera");

  useEffect(() => {
    obtenerCiudades().then(({ data }) => setCiudades(data)).catch(() => {});
  }, []);

  // La búsqueda la hace la API (nombre, artistas, géneros, lugar, productora). Solo si hay texto se espera
  // a que se deje de tipear; la primera carga y los filtros piden enseguida.
  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(() => {
      obtenerCartelera({ q: busqueda.trim() || undefined, tipo: tipo || undefined, ciudad: ciudad || undefined })
        .then(({ data }) => vigente && (setEventos(data), setError("")))
        .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar la cartelera")));
    }, busqueda.trim() ? 300 : 0);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [busqueda, tipo, ciudad, intento]);

  const reintentar = () => {
    setError("");
    setIntento((n) => n + 1);
  };

  const filtrando = busqueda || tipo || ciudad;

  return (
    <div className="grid grid-cols-1 gap-8">
      <section className="grid gap-3">
        <span className="justify-self-start bg-fucsia px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-tinta">Próximos shows</span>
        <h1 className="font-afiche text-6xl uppercase leading-[0.9] sm:text-8xl">Cartelera</h1>
        <p className="max-w-prose text-gris">Recitales y festivales de todas las productoras. Elegí un evento para ver la grilla y comprar tus entradas.</p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 basis-64 items-center gap-2 border-2 border-papel bg-noche px-3 focus-within:border-amarillo">
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gris" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar artista, género, evento o lugar"
            aria-label="Buscar en la cartelera"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-papel placeholder:text-gris focus:outline-none"
          />
        </label>
        {ciudades.length > 1 && (
          <select
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            aria-label="Ciudad"
            className="border-2 border-borde bg-noche px-3 py-2.5 text-sm text-papel focus:border-amarillo focus:outline-none"
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTipo(t.valor)}
              aria-pressed={tipo === t.valor}
              className={`border-2 px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                tipo === t.valor ? "border-papel bg-papel text-tinta" : "border-borde text-gris hover:border-papel hover:text-papel"
              }`}
            >
              {t.texto}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <ErrorCarga titulo="No pudimos cargar la cartelera" mensaje={error} onReintentar={reintentar} />
      ) : eventos === null ? (
        <section aria-busy="true" className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <p role="status" className="sr-only">Cargando la cartelera…</p>
          <TarjetaHueco />
          <TarjetaHueco />
          <TarjetaHueco />
        </section>
      ) : eventos.length === 0 ? (
        <div className="border-2 border-dashed border-linea px-6 py-12 text-center">
          <p className="font-afiche text-2xl uppercase">{filtrando ? "No hay shows con esa búsqueda" : "Todavía no hay shows publicados"}</p>
          <p className="mt-1 text-sm text-gris">{filtrando ? "Probá con otro artista o ciudad." : "Volvé pronto."}</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((e) => (
            <TarjetaEvento key={e.id_evento} evento={e} />
          ))}
        </section>
      )}
    </div>
  );
}

export default Cartelera;
