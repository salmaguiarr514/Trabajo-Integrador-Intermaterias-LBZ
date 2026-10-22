import { Link } from "react-router-dom";
import { useTitulo } from "../../hooks/useTitulo.js";
import { botonPrimario } from "../../components/afiche.jsx";

// 404 del sitio público (los paneles tienen la suya, pages/NoEncontrada.jsx)
function NoEncontrada() {
  useTitulo("Página no encontrada");
  return (
    <section className="grid justify-items-start gap-4 py-16">
      <h1 className="font-afiche text-6xl uppercase leading-[0.9] sm:text-8xl">Esta página no existe</h1>
      <p className="max-w-prose text-base text-gris">Puede que el link esté mal escrito o que el evento ya no esté publicado.</p>
      <Link to="/" className={botonPrimario}>
        Ver la cartelera
      </Link>
    </section>
  );
}

export default NoEncontrada;
