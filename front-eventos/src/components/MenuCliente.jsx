import { startTransition, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inicioDeRol, useAuth } from "../context/auth.js";

// Menú de la cuenta en el sitio público (Tailwind, sin antd). Se cierra con Escape o al tocar afuera.
function MenuCliente() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const boton = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const afuera = (e) => !caja.current?.contains(e.target) && setAbierto(false);
    const tecla = (e) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", afuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", afuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const salir = () => {
    // React Router navega dentro de una transition: si el logout va aparte, se aplica
    // antes y RutaProtegida manda al login. Juntos, se renderizan a la vez.
    startTransition(() => {
      navigate("/", { viewTransition: true });
      logout();
    });
  };

  const opcion = "block w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-papel hover:text-tinta";

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 border-2 border-papel px-1.5 py-1 text-sm font-bold text-papel hover:bg-noche"
      >
        <span aria-hidden="true" className="grid size-7 place-items-center bg-amarillo font-afiche text-base text-tinta uppercase">
          {usuario.nombre.charAt(0)}
        </span>
        <span className="hidden max-w-32 truncate pr-1 sm:block">{usuario.nombre}</span>
        <span className="sr-only sm:hidden">Tu cuenta</span>
      </button>

      {abierto && (
        <div className="absolute right-0 z-20 mt-2 w-60 border-2 border-papel bg-tinta shadow-[6px_6px_0_var(--color-fucsia)]">
          <div className="border-b-2 border-linea px-4 py-3">
            <p className="truncate font-bold">{usuario.nombre} {usuario.apellido ?? ""}</p>
            <p className="truncate text-sm text-gris">{usuario.empresa ?? usuario.email}</p>
          </div>
          <ul className="py-1">
            <li>
              {usuario.rol === "cliente" ? (
                <Link viewTransition to="/mis-entradas" onClick={() => setAbierto(false)} className={opcion}>Mis entradas</Link>
              ) : (
                <Link viewTransition to={inicioDeRol(usuario.rol)} onClick={() => setAbierto(false)} className={opcion}>Ir a mi panel</Link>
              )}
            </li>
            <li>
              <button type="button" onClick={salir} className={opcion}>Cerrar sesión</button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default MenuCliente;
