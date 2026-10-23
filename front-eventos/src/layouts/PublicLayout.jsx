import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import MenuCliente from "../components/MenuCliente.jsx";
import Cargando from "../components/Cargando.jsx";
import Marca from "../components/Marca.jsx";

// Sitio público (cartelera, evento, ingreso, compra, mis entradas): Tailwind con estética de afiche.
const linkClase = ({ isActive }) =>
  `px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors sm:px-3 ${
    isActive ? "bg-papel text-tinta" : "text-gris hover:text-papel"
  }`;

// El resaltado de la sección actual tiene nombre de transición: al cambiar de pantalla se desliza
// de un link al otro (Cartelera → Mis entradas, Cartelera → Ingresar…)
const activo = ({ isActive }) => (isActive ? { viewTransitionName: "nav-activo" } : undefined);

function PublicLayout() {
  const { usuario } = useAuth();

  return (
    <div className="sitio flex min-h-dvh flex-col bg-tinta font-sans text-papel antialiased">
      <header className="sticky top-0 z-10 border-b-2 border-papel bg-tinta">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
          <Link viewTransition to="/" className="flex shrink-0 items-center gap-2.5 text-papel" aria-label="Backstage, ir a la cartelera">
            <Marca alto={30} />
            {/* En pantallas muy angostas queda solo el logo, para que entren Cartelera y Mis entradas */}
            <span aria-hidden="true" className="hidden font-afiche text-2xl uppercase tracking-wide min-[440px]:inline">Backstage</span>
          </Link>
          <nav aria-label="Principal" className="flex min-w-0 flex-1 gap-1">
            <NavLink viewTransition to="/" end className={linkClase} style={activo}>
              Cartelera
            </NavLink>
            {usuario?.rol === "cliente" && (
              <NavLink viewTransition to="/mis-entradas" className={linkClase} style={activo}>
                Mis entradas
              </NavLink>
            )}
          </nav>
          {usuario ? (
            <MenuCliente />
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <NavLink
                viewTransition
                to="/registro"
                style={activo}
                className={({ isActive }) => `hidden px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors sm:block ${isActive ? "bg-papel text-tinta" : "text-gris hover:text-papel"}`}
              >
                Crear cuenta
              </NavLink>
              <NavLink
                viewTransition
                to="/login"
                style={activo}
                className={({ isActive }) => `border-2 border-papel px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? "bg-papel text-tinta" : "text-papel hover:bg-papel hover:text-tinta"}`}
              >
                Ingresar
              </NavLink>
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
