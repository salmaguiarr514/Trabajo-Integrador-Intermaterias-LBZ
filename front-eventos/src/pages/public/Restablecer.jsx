import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { inicioDeRol, useAuth } from "../../context/auth.js";
import { mensajeDeError } from "../../services/api.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Aviso, botonPrimario, Campo, campoClase } from "../../components/afiche.jsx";

// /restablecer?token=…: el enlace del mail de recuperación (un JWT de un solo uso que firma la API).
// Se elige la contraseña nueva y se entra directo; si la cuenta no estaba verificada, queda verificada.
function Restablecer() {
  const { restablecer } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [datos, setDatos] = useState({ password: "", confirmar: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(token ? "" : "Falta el enlace: abrí el botón del mail que te mandamos, o pedí uno nuevo.");
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);
  useTitulo("Contraseña nueva");

  const cambiar = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const enviar = async (ev) => {
    ev.preventDefault();
    const errs = {};
    if (datos.password.length < 6) errs.password = "Usá al menos 6 caracteres";
    if (datos.confirmar !== datos.password) errs.confirmar = "Las dos contraseñas tienen que ser iguales";
    setErrores(errs);
    setError("");
    if (Object.keys(errs).length > 0 || !token) return;
    setEnviando(true);
    try {
      const usuario = await restablecer(token, datos.password);
      navigate(inicioDeRol(usuario.rol), { replace: true, viewTransition: true });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo cambiar la contraseña"));
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-xl gap-8">
      <section className="entra grid gap-4 border-2 border-papel bg-fucsia p-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:p-8">
        <h1 className="font-afiche text-5xl uppercase leading-[0.92] text-balance sm:text-6xl">Contraseña nueva</h1>
        <p className="text-base font-medium">Elegila y entrás directo. Si tu cuenta no estaba verificada, queda verificada.</p>
      </section>

      <form onSubmit={enviar} noValidate style={{ "--i": 1 }} className="entra grid gap-5 border-2 border-papel bg-noche p-5 sm:p-6">
        {error && (
          <Aviso>
            {error}{" "}
            <Link viewTransition to="/recuperar" className="font-semibold underline underline-offset-4">
              Pedir otro enlace
            </Link>
          </Aviso>
        )}
        <Campo etiqueta="Contraseña nueva" error={errores.password} ayuda="Al menos 6 caracteres">
          <input type={verClave ? "text" : "password"} autoComplete="new-password" autoFocus value={datos.password} onChange={cambiar("password")} className={campoClase} />
        </Campo>
        <Campo etiqueta="Repetila" error={errores.confirmar}>
          <input type={verClave ? "text" : "password"} autoComplete="new-password" value={datos.confirmar} onChange={cambiar("confirmar")} className={campoClase} />
        </Campo>
        <label className="-mt-2 flex items-center gap-2 text-sm text-gris">
          <input type="checkbox" checked={verClave} onChange={(e) => setVerClave(e.target.checked)} className="size-4 accent-amarillo" />
          Mostrar la contraseña
        </label>
        <button type="submit" disabled={enviando || !token} className={botonPrimario}>
          {enviando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}

export default Restablecer;
