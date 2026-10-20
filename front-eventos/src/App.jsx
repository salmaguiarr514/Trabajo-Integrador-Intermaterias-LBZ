import { Routes, Route, useParams } from "react-router-dom";
import RutaProtegida from "./routes/RutaProtegida.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import PanelLayout from "./layouts/PanelLayout.jsx";
import Cartelera from "./pages/public/Cartelera.jsx";
import Login from "./pages/public/Login.jsx";
import Registro from "./pages/public/Registro.jsx";
import VerificarEmail from "./pages/public/VerificarEmail.jsx";
import EventoDetalle from "./pages/public/EventoDetalle.jsx";
import Checkout from "./pages/cliente/Checkout.jsx";
import MisEntradas from "./pages/cliente/MisEntradas.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Empresas from "./pages/admin/Empresas.jsx";
import EmpresaForm from "./pages/admin/EmpresaForm.jsx";
import Usuarios from "./pages/admin/Usuarios.jsx";
import Artistas from "./pages/admin/Artistas.jsx";
import Eventos from "./pages/admin/Eventos.jsx";
import Lugares from "./pages/lugares/Lugares.jsx";
import LugarDetalle from "./pages/lugares/LugarDetalle.jsx";
import Inicio from "./pages/panel/Inicio.jsx";
import MisArtistas from "./pages/panel/Artistas.jsx";
import MiProductora from "./pages/panel/MiProductora.jsx";
import EventosPanel from "./pages/panel/Eventos.jsx";
import EventoAsistente from "./pages/panel/evento/EventoAsistente.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";

// key distinta por id: al cambiar de empresa (o pasar a "nueva") el formulario arranca de cero
function EditarEmpresa() {
  const { id } = useParams();
  return <EmpresaForm key={id} />;
}

function App() {
  return (
    <Routes>
      {/* Público y cliente */}
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
          <Route path="mi-productora" element={<MiProductora />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}

export default App;
