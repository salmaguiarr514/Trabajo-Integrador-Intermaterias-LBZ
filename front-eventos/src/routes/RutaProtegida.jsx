import { Navigate, Outlet, useLocation } from "react-router-dom";
import { inicioDeRol, useAuth } from "../context/auth.js";
import Cargando from "../components/Cargando.jsx";

// <Route element={<RutaProtegida roles={["superadmin"]} />}> ... </Route>
// Sin sesión → al login (y después vuelve a donde quería ir).
// Con otro rol → a la pantalla de inicio de su rol.
function RutaProtegida({ roles }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <Cargando />;
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={inicioDeRol(usuario.rol)} replace />;
  }
  return <Outlet />;
}

export default RutaProtegida;
