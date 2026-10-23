import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { inicioDeRol, useAuth } from "../../context/auth.js";
import { mensajeDeError } from "../../services/api.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Aviso, botonPrimario, Campo, campoClase } from "../../components/afiche.jsx";

// A dónde lleva el ingreso, según quién sos (inicioDeRol en context/auth.js)
const DESTINOS = [
  { quien: "Público", donde: "La cartelera y tus entradas con QR" },
  { quien: "Productoras", donde: "Tu panel: eventos, ventas y control de acceso" },
  { quien: "Equipo Backstage", donde: "La administración de la plataforma" }
];

const USUARIOS_PRUEBA = [
  { rol: "Superadmin", email: "admin@backstage.com", password: "admin123" },
  { rol: "Productora", email: "staff@eventosdelcentro.com", password: "demo123" },
  { rol: "Cliente", email: "lucia.gomez@mail.com", password: "demo123" }
];

// /login: la entrada única. Con mail y contraseña, cada uno va a lo suyo según su rol.
function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [datos, setDatos] = useState({ email: "", password: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const campoEmail = useRef(null);
  const campoClave = useRef(null);
  useTitulo("Ingresar");

  // Con sesión (ya la tenía, o recién ingresó): a la página que quería ver, o a la de inicio de su rol.
  // Al ingresar, este render llega antes que el navigate de handleSubmit, así que el destino se decide acá.
  if (usuario) {
    return <Navigate to={location.state?.desde ?? inicioDeRol(usuario.rol)} replace />;
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const faltan = {
      ...(!datos.email.trim() && { email: "Ingresá tu email" }),
      ...(!datos.password && { password: "Ingresá tu contraseña" })
    };
    setErrores(faltan);
    setError("");
    if (faltan.email) return campoEmail.current?.focus();
    if (faltan.password) return campoClave.current?.focus();

    setEnviando(true);
    try {
      const logueado = await login(datos.email.trim(), datos.password);
      // Vuelve a la página que quería ver, o a la de inicio de su rol
      navigate(location.state?.desde ?? inicioDeRol(logueado.rol), { replace: true });
    } catch (err) {
      // Se registró pero nunca ingresó el código: a la pantalla de verificación, con un código nuevo
      if (err.response?.data?.motivo === "email_no_verificado") {
        navigate("/verificar", { state: { email: datos.email.trim(), reenviar: true } });
        return;
      }
      setError(mensajeDeError(err, "No se pudo iniciar sesión. Revisá el email y la contraseña."));
      setEnviando(false);
    }
  };

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  // En el celular: título, formulario y después a dónde lleva (el formulario queda a mano sin scrollear).
  // En pantallas grandes: el afiche (título + destinos, un solo bloque fucsia) a la izquierda y el formulario a la derecha.
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-0">
      <section className="entra grid gap-4 border-2 border-papel bg-fucsia p-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:p-8 lg:col-start-1 lg:row-start-1 lg:border-b-0 lg:pb-6">
        <h1 className="font-afiche text-5xl uppercase leading-[0.92] text-balance sm:text-7xl">Entrá a Backstage</h1>
        <p className="max-w-prose text-base font-medium">
          Una sola entrada para todos. Ingresá con tu mail y tu contraseña, y te llevamos a lo tuyo.
        </p>
      </section>

      <div className="entra grid gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1" style={{ "--i": 1 }}>
        <form onSubmit={handleSubmit} noValidate className="grid gap-5 border-2 border-papel bg-noche p-5 sm:p-6">
          <h2 className="font-afiche text-3xl uppercase leading-none">Ingresar</h2>
          {error && <Aviso>{error}</Aviso>}

          <Campo etiqueta="Email" error={errores.email}>
            <input
              ref={campoEmail}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="nombre@ejemplo.com"
              value={datos.email}
              onChange={cambiar("email")}
              className={campoClase}
            />
          </Campo>

          <Campo etiqueta="Contraseña" error={errores.password}>
            <input
              ref={campoClave}
              type={verClave ? "text" : "password"}
              autoComplete="current-password"
              value={datos.password}
              onChange={cambiar("password")}
              className={campoClase}
            />
          </Campo>
          <label className="-mt-2 flex items-center gap-2 text-sm text-gris">
            <input type="checkbox" checked={verClave} onChange={(e) => setVerClave(e.target.checked)} className="size-4 accent-amarillo" />
            Mostrar la contraseña
          </label>

          <button type="submit" disabled={enviando} className={botonPrimario}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>

          <p className="text-sm text-gris">
            ¿No tenés cuenta?{" "}
            <Link viewTransition to="/registro" className="font-semibold text-papel underline underline-offset-4 hover:text-amarillo">
              Creá una para comprar entradas
            </Link>
          </p>
        </form>

        {import.meta.env.DEV && (
          <section className="grid gap-2 border-2 border-dashed border-linea p-4 text-sm">
            <h2 className="font-semibold">Usuarios de prueba</h2>
            <p className="text-gris">Solo en desarrollo (database/11_seed_demo.sql). Tocá uno para completar el formulario.</p>
            <ul className="grid gap-1">
              {USUARIOS_PRUEBA.map((u) => (
                <li key={u.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setDatos({ email: u.email, password: u.password });
                      setErrores({});
                    }}
                    className="flex w-full flex-wrap justify-between gap-x-3 px-2 py-1.5 text-left hover:bg-noche"
                  >
                    <span className="font-semibold">{u.rol}</span>
                    <span className="text-gris">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section aria-label="A dónde te lleva el ingreso" className="entra border-2 border-papel bg-fucsia px-6 pb-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:px-8 sm:pb-8 max-lg:pt-6 lg:col-start-1 lg:row-start-2 lg:self-start lg:border-t-0">
        <dl className="grid gap-3 lg:border-t-2 lg:border-tinta lg:pt-5">
          {DESTINOS.map((d) => (
            <div key={d.quien} className="grid gap-0.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-afiche text-xl uppercase leading-tight">{d.quien}</dt>
              <dd className="text-base font-medium">{d.donde}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export default Login;
