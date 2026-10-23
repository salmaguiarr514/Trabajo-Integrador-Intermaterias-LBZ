import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { inicioDeRol, useAuth } from "../../context/auth.js";
import { mensajeDeError } from "../../services/api.js";
import * as authService from "../../services/authService.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Aviso, botonPrimario, Campo, campoClase } from "../../components/afiche.jsx";

const SEGUNDOS_ENTRE_ENVIOS = 60;

// Se llega desde el registro o desde el login (si la cuenta no está verificada).
// El email viene en location.state; si se entra directo, se pide.
function VerificarEmail() {
  const { usuario, verificar } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(state?.email ? `Te mandamos un código de 6 números a ${state.email}.` : "");
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(state?.reenviar ? 0 : SEGUNDOS_ENTRE_ENVIOS);
  const reenvioInicial = useRef(false);
  const campoCodigo = useRef(null);
  useTitulo("Verificá tu email");

  // Cuenta regresiva para poder pedir otro código
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const reenviar = async (destino = email) => {
    setError("");
    try {
      await authService.reenviarCodigo(destino);
      setAviso(`Te mandamos un código nuevo a ${destino}.`);
      setEspera(SEGUNDOS_ENTRE_ENVIOS);
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo mandar el código. Probá de nuevo en un rato."));
    }
  };

  // Con un error, el foco vuelve al código para escribirlo de nuevo. Va en un efecto: mientras se verifica
  // el campo está deshabilitado, y recién después de este render vuelve a aceptar el foco.
  useEffect(() => {
    if (error && !enviando) campoCodigo.current?.focus();
  }, [error, enviando]);

  // Viene del login: el código que tenía pudo haber vencido, se manda uno nuevo
  useEffect(() => {
    if (state?.reenviar && state?.email && !reenvioInicial.current) {
      reenvioInicial.current = true;
      reenviar(state.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (usuario) {
    return <Navigate to={inicioDeRol(usuario.rol)} replace />;
  }

  const enviarCodigo = async (valor = codigo) => {
    if (valor.length !== 6 || !email) return;
    setError("");
    setEnviando(true);
    try {
      const verificado = await verificar(email, valor);
      navigate(inicioDeRol(verificado.rol), { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo verificar el código"));
      setCodigo("");
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-xl gap-8">
      <section className="entra grid gap-4 border-2 border-papel bg-fucsia p-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:p-8">
        <h1 className="font-afiche text-5xl uppercase leading-[0.92] text-balance sm:text-6xl">Verificá tu email</h1>
        <p className="text-base font-medium">Ingresá el código que te llegó por mail. Si no lo ves, fijate en spam.</p>
      </section>

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          enviarCodigo();
        }}
        noValidate
        style={{ "--i": 1 }}
        className="entra grid gap-5 border-2 border-papel bg-noche p-5 sm:p-6"
      >
        {aviso && !error && <Aviso tipo="info">{aviso}</Aviso>}
        {error && <Aviso>{error}</Aviso>}

        {!state?.email && (
          <Campo etiqueta="Email">
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="nombre@ejemplo.com" className={campoClase} />
          </Campo>
        )}

        {/* Se envía solo al completar los 6 números */}
        <Campo etiqueta="Código de 6 números">
          <input
            ref={campoCodigo}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={Boolean(state?.email)}
            maxLength={6}
            placeholder="123456"
            value={codigo}
            disabled={enviando}
            onChange={(e) => {
              const valor = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCodigo(valor);
              enviarCodigo(valor);
            }}
            className={`${campoClase} font-afiche text-3xl tracking-[0.4em] tabular-nums`}
          />
        </Campo>

        <button type="submit" disabled={enviando || codigo.length !== 6 || !email} className={botonPrimario}>
          {enviando ? "Verificando…" : "Verificar"}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={espera > 0 || !email}
            onClick={() => reenviar()}
            className="font-semibold text-papel underline underline-offset-4 hover:text-amarillo disabled:cursor-not-allowed disabled:text-gris disabled:no-underline"
          >
            {espera > 0 ? `Pedir otro código en ${espera} s` : "Mandarme otro código"}
          </button>
          <Link viewTransition to="/login" className="text-gris underline underline-offset-4 hover:text-papel">
            Volver al ingreso
          </Link>
        </div>
      </form>
    </div>
  );
}

export default VerificarEmail;
