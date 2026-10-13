import { Outlet, useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import { useAuth } from "../context/auth.js";
import Logo from "../components/Logo.jsx";
import MenuUsuario from "../components/MenuUsuario.jsx";

// Cartelera y páginas públicas: barra superior con login o el usuario logueado
function PublicLayout() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="barra">
        <div className="contenido barra-interior">
          <Logo subtitulo="Recitales y festivales" />
          {usuario ? (
            <MenuUsuario />
          ) : (
            <Space>
              <Button type="text" onClick={() => navigate("/registro")} className="ocultar-mobile">
                Crear cuenta
              </Button>
              <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate("/login")}>
                Ingresar
              </Button>
            </Space>
          )}
        </div>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
    </>
  );
}

export default PublicLayout;
