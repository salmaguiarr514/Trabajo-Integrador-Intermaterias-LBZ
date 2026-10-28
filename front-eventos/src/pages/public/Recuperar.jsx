import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mensajeDeError } from "../../services/api.js";
import * as authService from "../../services/authService.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Aviso, botonPrimario, Campo, campoClase } from "../../components/afiche.jsx";

const SIN_CORREO =
  "Este servidor todavía no tiene configurado el envío de mails, así que el enlace no te va a llegar. Queda en la consola de la API: pedíselo a quien la administra, o probá más tarde.";

// /recuperar: "¿Olvidaste tu contraseña?". Manda un enlace para elegir una nueva; sirve también
// para una cuenta que quedó sin verificar (al usar el enlace, el email queda verificado).
// El email puede venir del login o de la verificación (location.state).
function Recuperar() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  useTitulo("Recuperar la cuenta");

  const enviar = async (ev) => {
    ev.preventDefault();
    setError("");
    setAviso("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Escribí el email de tu cuenta, por ejemplo nombre@ejemplo.com");
      return;
    }
    setEnviando(true);
    try {
      const { data } = await authService.recuperar(email.trim());
      setAviso(data.correo === "sin_configurar" ? SIN_CORREO : `Si ${email.trim()} tiene una cuenta, te mandamos un mail con un botón para elegir una contraseña nueva. Vence en 30 minutos.`);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos mandar el mail. Probá de nuevo en un rato."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-xl gap-8">
      <section className="entra grid gap-4 border-2 border-papel bg-fucsia p-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:p-8">
        <h1 className="font-afiche text-5xl uppercase leading-[0.92] text-balance sm:text-6xl">Recuperá tu cuenta</h1>
        <p className="text-base font-medium">
          Te mandamos un enlace para elegir una contraseña nueva. Si tu cuenta quedó sin verificar, con ese enlace también se verifica.
        </p>
      </section>

      <form onSubmit={enviar} noValidate style={{ "--i": 1 }} className="entra grid gap-5 border-2 border-papel bg-noche p-5 sm:p-6">
        {error && <Aviso>{error}</Aviso>}
        {aviso && <Aviso tipo="info">{aviso}</Aviso>}
        <Campo etiqueta="Email de tu cuenta">
          <input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" className={campoClase} />
        </Campo>
        <button type="submit" disabled={enviando} className={botonPrimario}>
          {enviando ? "Mandando…" : aviso ? "Mandármelo de nuevo" : "Mandarme el enlace"}
        </button>
        <Link viewTransition to="/login" className="justify-self-start text-sm text-gris underline underline-offset-4 hover:text-papel">
          Volver al ingreso
        </Link>
      </form>
    </div>
  );
}

export default Recuperar;
