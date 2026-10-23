import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { inicioDeRol, useAuth } from "../../context/auth.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { Aviso, botonPrimario, Campo, campoClase } from "../../components/afiche.jsx";

const VACIO = { nombre: "", apellido: "", email: "", password: "", confirmar: "", dni: "", telefono: "" };
const ORDEN = Object.keys(VACIO); // para llevar el foco al primer campo con error

// Las mismas reglas que valida la API; acá se avisan antes de mandar
const validar = (d) => ({
  ...(!d.nombre.trim() && { nombre: "Ingresá tu nombre" }),
  ...(!/^\S+@\S+\.\S+$/.test(d.email.trim()) && { email: "Ingresá un email válido, como nombre@ejemplo.com" }),
  ...(d.password.length < 6 && { password: "Usá al menos 6 caracteres" }),
  ...(d.confirmar !== d.password && { confirmar: "Las contraseñas no coinciden" }),
  ...(d.dni && !/^\d{7,10}$/.test(d.dni) && { dni: "Solo números, sin puntos" })
});

// Alta de clientes (el público que compra entradas). Después se verifica el email con un código.
function Registro() {
  const { usuario, registro } = useAuth();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const formulario = useRef(null);
  useTitulo("Crear cuenta");

  if (usuario) {
    return <Navigate to={inicioDeRol(usuario.rol)} replace />;
  }

  const enfocarPrimero = (errs) => {
    const campo = ORDEN.find((c) => errs[c]);
    if (campo) formulario.current?.querySelector(`[name="${campo}"]`)?.focus();
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validar(datos);
    setErrores(errs);
    setError("");
    if (Object.keys(errs).length > 0) return enfocarPrimero(errs);

    setEnviando(true);
    const { confirmar: _confirmar, ...enviar } = datos;
    try {
      await registro({ ...enviar, nombre: enviar.nombre.trim(), email: enviar.email.trim() });
      // La cuenta queda creada pero hay que verificar el email con el código que llega por mail
      navigate("/verificar", { replace: true, state: { email: enviar.email.trim() }, viewTransition: true });
    } catch (err) {
      // Los errores de validación de la API se muestran debajo de cada campo
      const campos = erroresPorCampo(err);
      setErrores(campos);
      if (Object.keys(campos).length === 0) setError(mensajeDeError(err, "No se pudo crear la cuenta. Probá de nuevo en un rato."));
      else enfocarPrimero(campos);
      setEnviando(false);
    }
  };

  const campo = (nombre, props = {}) => (
    <input name={nombre} value={datos[nombre]} onChange={(e) => setDatos({ ...datos, [nombre]: e.target.value })} className={campoClase} {...props} />
  );

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-12">
      <section className="entra grid gap-4 border-2 border-papel bg-fucsia p-6 text-tinta shadow-[8px_8px_0_var(--color-amarillo)] sm:p-8">
        <h1 className="font-afiche text-5xl uppercase leading-[0.92] text-balance sm:text-7xl">Creá tu cuenta</h1>
        <p className="max-w-prose text-base font-medium">
          Con tu cuenta comprás entradas y las tenés en el celular, con el QR para la puerta.
        </p>
        <p className="max-w-prose text-base font-medium">Después te mandamos un código por mail para confirmar que es tuyo.</p>
      </section>

      <form ref={formulario} onSubmit={handleSubmit} noValidate style={{ "--i": 1 }} className="entra grid gap-5 border-2 border-papel bg-noche p-5 sm:p-6">
        {error && <Aviso>{error}</Aviso>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={errores.nombre}>
            {campo("nombre", { autoComplete: "given-name", maxLength: 100, autoFocus: true })}
          </Campo>
          <Campo etiqueta="Apellido (opcional)" error={errores.apellido}>
            {campo("apellido", { autoComplete: "family-name", maxLength: 100 })}
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Email" error={errores.email}>
              {campo("email", { type: "email", autoComplete: "email", maxLength: 150, placeholder: "nombre@ejemplo.com" })}
            </Campo>
          </div>
          <Campo etiqueta="Contraseña" error={errores.password} ayuda="Al menos 6 caracteres">
            {campo("password", { type: "password", autoComplete: "new-password" })}
          </Campo>
          <Campo etiqueta="Repetir la contraseña" error={errores.confirmar}>
            {campo("confirmar", { type: "password", autoComplete: "new-password" })}
          </Campo>
          <Campo etiqueta="DNI (opcional)" error={errores.dni} ayuda="Solo números, sin puntos">
            {campo("dni", { inputMode: "numeric", maxLength: 10 })}
          </Campo>
          <Campo etiqueta="Teléfono (opcional)" error={errores.telefono}>
            {campo("telefono", { type: "tel", autoComplete: "tel", maxLength: 30 })}
          </Campo>
        </div>

        <button type="submit" disabled={enviando} className={botonPrimario}>
          {enviando ? "Creando la cuenta…" : "Crear cuenta"}
        </button>

        <p className="text-sm text-gris">
          ¿Ya tenés cuenta?{" "}
          <Link viewTransition to="/login" className="font-semibold text-papel underline underline-offset-4 hover:text-amarillo">
            Ingresá
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Registro;
