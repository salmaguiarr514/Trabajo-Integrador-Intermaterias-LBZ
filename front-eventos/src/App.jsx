import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import Raiz from "./components/Raiz.jsx";
import RutaProtegida from "./routes/RutaProtegida.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import Cargando from "./components/Cargando.jsx";
import Cartelera from "./pages/public/Cartelera.jsx";
import EventoDetalle from "./pages/public/EventoDetalle.jsx";

// Router "de datos" (createBrowserRouter): permite las transiciones entre pantallas (viewTransition en los
// links) y vuelve arriba al navegar (ScrollRestoration).
// La cartelera y el evento van en el paquete inicial. El resto se descarga al entrar, pero ANTES de cambiar
// de pantalla (lazy de la ruta): así la transición va directo a la pantalla nueva, sin pasar por "Cargando…",
// y el público no baja los paneles (ni antd).
const cargar = (importar, props) => async () => {
  const { default: Pantalla } = await importar();
  return { element: <Pantalla {...props} /> };
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Raiz />} hydrateFallbackElement={<Cargando />}>
      {/* Público y cliente. /login es la entrada de todos: según el rol, va a su panel o a la cartelera */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Cartelera />} />
        <Route path="/login" lazy={cargar(() => import("./pages/public/Login.jsx"))} />
        <Route path="/registro" lazy={cargar(() => import("./pages/public/Registro.jsx"))} />
        <Route path="/verificar" lazy={cargar(() => import("./pages/public/VerificarEmail.jsx"))} />
        <Route path="/eventos/:id" element={<EventoDetalle />} />
        <Route element={<RutaProtegida roles={["cliente"]} />}>
          <Route path="/checkout/:id" lazy={cargar(() => import("./pages/cliente/Checkout.jsx"))} />
          <Route path="/mis-entradas" lazy={cargar(() => import("./pages/cliente/MisEntradas.jsx"))} />
        </Route>
        <Route path="*" lazy={cargar(() => import("./pages/public/NoEncontrada.jsx"))} />
      </Route>

      {/* Superadmin */}
      <Route element={<RutaProtegida roles={["superadmin"]} />}>
        <Route path="/admin" lazy={cargar(() => import("./layouts/AdminLayout.jsx"))}>
          <Route index lazy={cargar(() => import("./pages/admin/Dashboard.jsx"))} />
          <Route path="empresas" lazy={cargar(() => import("./pages/admin/Empresas.jsx"))} />
          <Route path="empresas/nueva" lazy={async () => {
            const { default: EmpresaForm } = await import("./pages/admin/EmpresaForm.jsx");
            return { element: <EmpresaForm key="nueva" /> };
          }} />
          <Route path="empresas/:id/editar" lazy={cargar(() => import("./pages/admin/EditarEmpresa.jsx"))} />
          <Route path="usuarios" lazy={cargar(() => import("./pages/admin/Usuarios.jsx"))} />
          <Route path="lugares" lazy={cargar(() => import("./pages/lugares/Lugares.jsx"), { ambito: "admin" })} />
          <Route path="lugares/:id" lazy={cargar(() => import("./pages/lugares/LugarDetalle.jsx"), { ambito: "admin" })} />
          <Route path="artistas" lazy={cargar(() => import("./pages/admin/Artistas.jsx"))} />
          <Route path="eventos" lazy={cargar(() => import("./pages/admin/Eventos.jsx"))} />
          <Route path="*" lazy={cargar(() => import("./pages/NoEncontrada.jsx"))} />
        </Route>
      </Route>

      {/* Productora */}
      <Route element={<RutaProtegida roles={["empresa"]} />}>
        <Route path="/panel" lazy={cargar(() => import("./layouts/PanelLayout.jsx"))}>
          <Route index lazy={cargar(() => import("./pages/panel/Inicio.jsx"))} />
          <Route path="lugares" lazy={cargar(() => import("./pages/lugares/Lugares.jsx"), { ambito: "panel" })} />
          <Route path="lugares/:id" lazy={cargar(() => import("./pages/lugares/LugarDetalle.jsx"), { ambito: "panel" })} />
          <Route path="artistas" lazy={cargar(() => import("./pages/panel/Artistas.jsx"))} />
          <Route path="eventos" lazy={cargar(() => import("./pages/panel/Eventos.jsx"))} />
          <Route path="eventos/nuevo" lazy={cargar(() => import("./pages/panel/evento/EventoAsistente.jsx"))} />
          <Route path="eventos/:id" lazy={cargar(() => import("./pages/panel/evento/EventoAsistente.jsx"))} />
          <Route path="eventos/:id/ventas" lazy={cargar(() => import("./pages/panel/VentasEvento.jsx"))} />
          <Route path="acceso" lazy={cargar(() => import("./pages/panel/ControlAcceso.jsx"))} />
          <Route path="mi-productora" lazy={cargar(() => import("./pages/panel/MiProductora.jsx"))} />
          <Route path="*" lazy={cargar(() => import("./pages/NoEncontrada.jsx"))} />
        </Route>
      </Route>
    </Route>
  )
);
