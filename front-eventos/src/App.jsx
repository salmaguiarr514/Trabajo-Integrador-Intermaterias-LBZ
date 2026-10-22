import { lazy, Suspense } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import RutaProtegida from "./routes/RutaProtegida.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import Cargando from "./components/Cargando.jsx";
import Cartelera from "./pages/public/Cartelera.jsx";
import EventoDetalle from "./pages/public/EventoDetalle.jsx";

// La cartelera y el evento van en el paquete inicial. El resto se descarga al entrar:
// así el público no baja los paneles (ni antd) y cada panel trae solo lo suyo.
const Login = lazy(() => import("./pages/public/Login.jsx"));
const Registro = lazy(() => import("./pages/public/Registro.jsx"));
const VerificarEmail = lazy(() => import("./pages/public/VerificarEmail.jsx"));
const Checkout = lazy(() => import("./pages/cliente/Checkout.jsx"));
const MisEntradas = lazy(() => import("./pages/cliente/MisEntradas.jsx"));
const NoEncontradaPublica = lazy(() => import("./pages/public/NoEncontrada.jsx"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout.jsx"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const Empresas = lazy(() => import("./pages/admin/Empresas.jsx"));
const EmpresaForm = lazy(() => import("./pages/admin/EmpresaForm.jsx"));
const Usuarios = lazy(() => import("./pages/admin/Usuarios.jsx"));
const Artistas = lazy(() => import("./pages/admin/Artistas.jsx"));
const Eventos = lazy(() => import("./pages/admin/Eventos.jsx"));

const PanelLayout = lazy(() => import("./layouts/PanelLayout.jsx"));
const Inicio = lazy(() => import("./pages/panel/Inicio.jsx"));
const MisArtistas = lazy(() => import("./pages/panel/Artistas.jsx"));
const MiProductora = lazy(() => import("./pages/panel/MiProductora.jsx"));
const EventosPanel = lazy(() => import("./pages/panel/Eventos.jsx"));
const EventoAsistente = lazy(() => import("./pages/panel/evento/EventoAsistente.jsx"));
const VentasEvento = lazy(() => import("./pages/panel/VentasEvento.jsx"));
const ControlAcceso = lazy(() => import("./pages/panel/ControlAcceso.jsx"));

const Lugares = lazy(() => import("./pages/lugares/Lugares.jsx"));
const LugarDetalle = lazy(() => import("./pages/lugares/LugarDetalle.jsx"));
const NoEncontrada = lazy(() => import("./pages/NoEncontrada.jsx"));

// key distinta por id: al cambiar de empresa (o pasar a "nueva") el formulario arranca de cero
function EditarEmpresa() {
  const { id } = useParams();
  return <EmpresaForm key={id} />;
}

function App() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        {/* Público y cliente. /login es la entrada de todos: según el rol, va a su panel o a la cartelera */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Cartelera />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/verificar" element={<VerificarEmail />} />
          <Route path="/eventos/:id" element={<EventoDetalle />} />
          <Route element={<RutaProtegida roles={["cliente"]} />}>
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/mis-entradas" element={<MisEntradas />} />
          </Route>
          <Route path="*" element={<NoEncontradaPublica />} />
        </Route>

        {/* Superadmin */}
        <Route element={<RutaProtegida roles={["superadmin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="empresas/nueva" element={<EmpresaForm key="nueva" />} />
            <Route path="empresas/:id/editar" element={<EditarEmpresa />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="lugares" element={<Lugares ambito="admin" />} />
            <Route path="lugares/:id" element={<LugarDetalle ambito="admin" />} />
            <Route path="artistas" element={<Artistas />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="*" element={<NoEncontrada />} />
          </Route>
        </Route>

        {/* Productora */}
        <Route element={<RutaProtegida roles={["empresa"]} />}>
          <Route path="/panel" element={<PanelLayout />}>
            <Route index element={<Inicio />} />
            <Route path="lugares" element={<Lugares ambito="panel" />} />
            <Route path="lugares/:id" element={<LugarDetalle ambito="panel" />} />
            <Route path="artistas" element={<MisArtistas />} />
            <Route path="eventos" element={<EventosPanel />} />
            <Route path="eventos/nuevo" element={<EventoAsistente />} />
            <Route path="eventos/:id" element={<EventoAsistente />} />
            <Route path="eventos/:id/ventas" element={<VentasEvento />} />
            <Route path="acceso" element={<ControlAcceso />} />
            <Route path="mi-productora" element={<MiProductora />} />
            <Route path="*" element={<NoEncontrada />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
