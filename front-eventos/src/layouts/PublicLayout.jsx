import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import MenuCliente from "../components/MenuCliente.jsx";
import Cargando from "../components/Cargando.jsx";
import Marca from "../components/Marca.jsx";

// Sitio público (cartelera, evento, compra, mis entradas): Tailwind con estética de afiche.
// Los links llevan su color explícito: antd pinta todos los <a> de azul.
const linkClase = ({ isActive }) =>
  `px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
    isActive ? "bg-papel text-tinta" : "text-gris hover:text-papel"
  }`;

function PublicLayout() {
  const { usuario } = useAuth();

  return (
    <div className="sitio flex min-h-dvh flex-col bg-tinta font-sans text-papel antialiased">
      <header className="sticky top-0 z-10 border-b-2 border-papel bg-tinta">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-papel" aria-label="Backstage, ir a la cartelera">
            <Marca alto={30} />
            <span aria-hidden="true" className="font-afiche text-2xl uppercase tracking-wide">Backstage</span>
          </Link>
          <nav className="flex min-w-0 flex-1 gap-1">
            <NavLink to="/" end className={(e) => `hidden sm:block ${linkClase(e)}`}>
              Cartelera
            </NavLink>
            {usuario?.rol === "cliente" && (
              <NavLink to="/mis-entradas" className={(e) => `hidden sm:block ${linkClase(e)}`}>
                Mis entradas
              </NavLink>
            )}
          </nav>
          {usuario ? (
            <MenuCliente />
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/registro" className="hidden px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gris hover:text-papel sm:block">
                Crear cuenta
              </Link>
              <Link
                to="/login"
                className="border-2 border-papel px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-papel hover:bg-papel hover:text-tinta"
              >
                Ingresar
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16">
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t-2 border-dashed border-linea">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gris">
          Backstage · entradas para recitales y festivales. El pago es simulado: todo es ficticio.
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
