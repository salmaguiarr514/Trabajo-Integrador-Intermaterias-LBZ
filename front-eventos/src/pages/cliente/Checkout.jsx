import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { comprar, cotizar } from "../../services/clienteService.js";
import { useAuth } from "../../context/auth.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";
import { itemsDelCarrito, leerCarrito, vaciarCarrito } from "../../utils/carrito.js";
import { pesos } from "../../utils/formato.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { conTransicion } from "../../utils/transicion.js";
import { Aviso, botonPrimario, botonSecundario, Campo, campoClase, TituloLetras } from "../../components/afiche.jsx";
import { lluviaDeEntradas } from "../../utils/movimiento.js";

const MEDIOS = [
  { valor: "credito", texto: "Crédito" },
  { valor: "debito", texto: "Débito" },
  { valor: "transferencia", texto: "Transferencia" }
];

// 4111 1111 1111 1111 mientras se escribe
const formatearTarjeta = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatearVencimiento = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function Resumen({ cotizacion }) {
  return (
    <section className="entra border-2 border-papel bg-noche" style={{ "--i": 1 }}>
      <h2 className="border-b-2 border-papel px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em]">Tu compra</h2>
      <div className="grid gap-2 p-4 text-sm">
        <p className="font-afiche text-2xl uppercase leading-tight">{cotizacion.evento.nombre}</p>
        {cotizacion.lineas.map((l) => (
          <div key={l.id_tarifa} className="flex justify-between gap-3">
            <span className="text-gris">
              {l.cantidad} × {l.espacio} · {l.nombre}
              {l.fecha ? ` (${l.fecha.slice(8, 10)}/${l.fecha.slice(5, 7)})` : " (abono)"}
            </span>
            <span className="tabular-nums">{pesos(l.importe)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-3 border-t-2 border-dashed border-linea pt-2">
          <span className="text-gris">Subtotal</span>
          <span className="tabular-nums">{pesos(cotizacion.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gris">Cargo por servicio ({cotizacion.cargo_servicio_pct}%)</span>
          <span className="tabular-nums">{pesos(cotizacion.cargo_servicio)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <span className="font-bold uppercase tracking-widest">Total</span>
          <span className="font-afiche text-3xl tabular-nums">{pesos(cotizacion.total)}</span>
        </div>
      </div>
    </section>
  );
}

// Qué pasó con el mail de las entradas (lo informa la API al comprar)
const AVISO_CORREO = {
  enviado: (email) => `Te las mandamos por mail a ${email}, con sus QR.`,
  sin_configurar: () => "El envío de mails no está configurado en este servidor: las entradas están en Mis entradas.",
  error: () => "No pudimos mandarte el mail, pero las entradas ya son tuyas: las ves en Mis entradas y desde ahí podés pedirlas por mail."
};

function Resultado({ compra, idEvento, onReintentar }) {
  const aprobada = compra.estado === "pagada";
  const { usuario } = useAuth();
  // Pago aprobado: lluvia de entraditas y sello; rechazado: la caja se sacude
  useEffect(() => {
    if (aprobada) lluviaDeEntradas();
  }, [aprobada]);
  return (
    <section className={`relative grid justify-items-start gap-4 border-2 p-6 sm:p-8 ${aprobada ? "border-verde" : "sacude border-fucsia"}`}>
      {aprobada && <span className="sello text-verde" aria-hidden="true">Pagado</span>}
      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-tinta ${aprobada ? "bg-verde" : "bg-fucsia"}`}>
        {aprobada ? "Pago aprobado" : "Pago rechazado"}
      </span>
      <h1 className="font-afiche text-5xl uppercase leading-none">{aprobada ? "¡Ya tenés tus entradas!" : "No se pudo cobrar"}</h1>
      <p className="max-w-prose text-gris">
        {aprobada
          ? `Compraste ${compra.cantidad} ${compra.cantidad === 1 ? "entrada" : "entradas"} para ${compra.evento.nombre} por ${pesos(compra.total)}. Cada una tiene su QR para mostrar en la puerta.`
          : "La tarjeta fue rechazada (es una simulación: las terminadas en 0000 se rechazan). No se te cobró nada."}
      </p>
      {aprobada && <p className="text-sm text-gris">Comprobante: <span className="font-mono text-papel">{compra.referencia_pago}</span></p>}
      {aprobada && compra.correo && (
        <p className={`entra border-l-4 pl-3 text-sm ${compra.correo === "enviado" ? "border-verde text-papel" : "border-amarillo text-amarillo"}`} style={{ "--i": 3 }}>
          {AVISO_CORREO[compra.correo]?.(usuario?.email)}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {aprobada ? (
          <Link viewTransition to="/mis-entradas" className={botonPrimario}>
            Ver mis entradas
          </Link>
        ) : (
          <button type="button" onClick={onReintentar} className={botonPrimario}>
            Probar con otra tarjeta
          </button>
        )}
        <Link viewTransition to={`/eventos/${idEvento}`} className={botonSecundario}>
          Volver al evento
        </Link>
      </div>
    </section>
  );
}

// /checkout/:id (solo clientes). La selección viene del detalle del evento (sessionStorage).
function Checkout() {
  const { id } = useParams();
  const [items] = useState(() => itemsDelCarrito(leerCarrito(id)));
  useTitulo("Pagar");
  const [cotizacion, setCotizacion] = useState(null);
  const [errorCotizar, setErrorCotizar] = useState(items.length === 0 ? "No elegiste entradas todavía." : "");
  const [medio, setMedio] = useState("credito");
  const [tarjeta, setTarjeta] = useState({ numero: "", nombre: "", vencimiento: "", cvv: "" });
  const [errores, setErrores] = useState({});
  const [pagando, setPagando] = useState(false);
  const [compra, setCompra] = useState(null);

  // Los importes los calcula la API (precio vigente, % de la productora y cupo disponible)
  useEffect(() => {
    if (items.length === 0) return;
    cotizar(Number(id), items)
      .then(({ data }) => setCotizacion(data))
      .catch((e) => setErrorCotizar(Object.values(erroresPorCampo(e))[0] ?? mensajeDeError(e, "No se pudo calcular la compra")));
  }, [id, items]);

  const pagar = async (ev) => {
    ev.preventDefault();
    setErrores({});
    setPagando(true);
    try {
      const { data } = await comprar({
        id_evento: Number(id),
        items,
        medio_pago: medio,
        tarjeta: medio === "transferencia" ? undefined : tarjeta
      });
      if (data.estado === "pagada") vaciarCarrito(id);
      setCompra(data);
    } catch (e) {
      const porCampo = erroresPorCampo(e);
      const deTarjeta = Object.fromEntries(Object.entries(porCampo).map(([k, v]) => [k.replace("tarjeta.", ""), v]));
      setErrores(Object.keys(porCampo).length > 0 ? deTarjeta : { general: mensajeDeError(e, "No se pudo hacer la compra") });
    } finally {
      setPagando(false);
    }
  };

  if (compra) return <Resultado compra={compra} idEvento={id} onReintentar={() => setCompra(null)} />;

  if (errorCotizar) {
    return (
      <section className="grid justify-items-start gap-4 py-12">
        <h1 className="font-afiche text-5xl uppercase leading-none">No se puede comprar así</h1>
        <p className="max-w-prose text-gris">{errorCotizar}</p>
        <Link viewTransition to={`/eventos/${id}`} className={botonPrimario}>
          Elegir entradas
        </Link>
      </section>
    );
  }

  if (!cotizacion) return <p className="py-16 text-center font-afiche text-2xl uppercase text-gris">Calculando tu compra…</p>;

  return (
    <div className="grid grid-cols-1 gap-8">
      <Link viewTransition to={`/eventos/${id}`} className="justify-self-start text-xs font-bold uppercase tracking-widest text-gris hover:text-papel">
        ← Cambiar entradas
      </Link>
      <TituloLetras texto="Pagar" className="font-afiche text-6xl uppercase leading-[0.9]" />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Resumen cotizacion={cotizacion} />

        <form onSubmit={pagar} className="entra grid gap-5 border-2 border-papel bg-noche p-5" style={{ "--i": 2 }} noValidate>
          <div className="border-2 border-dashed border-amarillo px-3 py-2 text-sm text-amarillo">
            Pago simulado: no se cobra nada. Para probar un rechazo, usá una tarjeta terminada en <strong>0000</strong>.
          </div>

          {/* Botones de opción nativos: se recorren con las flechas y se leen como "1 de 3, seleccionado" */}
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-semibold">Medio de pago</legend>
            <div className="flex flex-wrap gap-2">
              {MEDIOS.map((m) => (
                <label key={m.valor} className="cursor-pointer">
                  <input
                    type="radio"
                    name="medio"
                    value={m.valor}
                    checked={medio === m.valor}
                    onChange={() => conTransicion(() => setMedio(m.valor))}
                    className="peer sr-only"
                  />
                  <span className={`${medio === m.valor ? "vt-medio-activo " : ""}block border-2 border-borde px-4 py-2 text-xs font-bold uppercase tracking-widest text-gris hover:border-papel hover:text-papel peer-checked:border-papel peer-checked:bg-papel peer-checked:text-tinta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amarillo`}>
                    {m.texto}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {medio === "transferencia" ? (
            <p className="vt-panel-medio text-sm text-gris">Se aprueba al instante (es una simulación).</p>
          ) : (
            <div className="vt-panel-medio grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo etiqueta="Número de tarjeta" error={errores.numero}>
                  <input
                    className={campoClase}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4111 1111 1111 1111"
                    value={tarjeta.numero}
                    onChange={(e) => setTarjeta({ ...tarjeta, numero: formatearTarjeta(e.target.value) })}
                  />
                </Campo>
              </div>
              <div className="sm:col-span-2">
                <Campo etiqueta="Nombre en la tarjeta" error={errores.nombre}>
                  <input
                    className={campoClase}
                    autoComplete="cc-name"
                    value={tarjeta.nombre}
                    onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value })}
                  />
                </Campo>
              </div>
              <Campo etiqueta="Vencimiento" error={errores.vencimiento}>
                <input
                  className={campoClase}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={tarjeta.vencimiento}
                  onChange={(e) => setTarjeta({ ...tarjeta, vencimiento: formatearVencimiento(e.target.value) })}
                />
              </Campo>
              <Campo etiqueta="Código de seguridad" error={errores.cvv}>
                <input
                  className={campoClase}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={4}
                  value={tarjeta.cvv}
                  onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, "") })}
                />
              </Campo>
            </div>
          )}

          {(errores.general || errores.tarjeta) && (
            <Aviso>{errores.general ?? errores.tarjeta}</Aviso>
          )}

          <button type="submit" disabled={pagando} className={`${botonPrimario} py-3`}>
            {pagando ? "Procesando…" : `Pagar ${pesos(cotizacion.total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
