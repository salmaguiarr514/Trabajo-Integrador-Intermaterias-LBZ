import { Outlet, ScrollRestoration } from "react-router-dom";

// Ruta raíz de toda la app: muestra la pantalla actual y vuelve arriba al navegar
function Raiz() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

export default Raiz;
