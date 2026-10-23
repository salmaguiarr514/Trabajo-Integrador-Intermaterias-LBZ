import { Suspense, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, Grid, Layout, Menu } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import Logo from "../components/Logo.jsx";
import MenuUsuario from "../components/MenuUsuario.jsx";
import Cargando from "../components/Cargando.jsx";
import ProveedorAntd from "./ProveedorAntd.jsx";
import { useTitulo } from "../hooks/useTitulo.js";
import { PANEL } from "../tema.js";

// Estructura común de los paneles (admin y productora): barra superior y menú lateral.
// items: [{ key: "/admin/empresas", icon, label }] → la key es la ruta.
// En pantallas chicas el menú se abre con un botón y queda encima del contenido.
function Estructura({ inicio, subtitulo, items }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const esMovil = !Grid.useBreakpoint().lg;
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Marca el ítem cuya ruta es la más larga que coincide con la actual
  const seleccionado = items
    .map((i) => i.key)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];

  // Título de la pestaña: la sección del menú y el panel ("Eventos · Eventos del Centro · Backstage")
  useTitulo(`${items.find((i) => i.key === seleccionado)?.label ?? "Panel"} · ${subtitulo}`);

  const irA = ({ key }) => {
    navigate(key, { viewTransition: true });
    setMenuAbierto(false);
  };

  return (
    <Layout style={{ minHeight: "100dvh", background: "transparent" }}>
      <header className="barra">
        <div className="barra-interior" style={{ paddingInline: 16, paddingBlock: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {esMovil && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                aria-label={menuAbierto ? "Cerrar el menú" : "Abrir el menú"}
                aria-expanded={menuAbierto}
                onClick={() => setMenuAbierto(!menuAbierto)}
              />
            )}
            <Logo to={inicio} subtitulo={subtitulo} />
          </div>
          <MenuUsuario />
        </div>
      </header>
      <Layout style={{ background: "transparent", position: "relative" }}>
        <Layout.Sider
          width={220}
          collapsedWidth={0}
          collapsed={esMovil && !menuAbierto}
          trigger={null}
          style={{
            background: PANEL.lateral,
            borderRight: esMovil && !menuAbierto ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
            ...(esMovil && { position: "absolute", insetBlock: 0, left: 0, zIndex: 20 })
          }}
        >
          {/* inert: con el menú cerrado en el celular, sus links no reciben foco (están fuera de la vista) */}
          <nav aria-label="Secciones del panel" inert={esMovil && !menuAbierto}>
            <Menu
              mode="inline"
              selectedKeys={seleccionado ? [seleccionado] : []}
              items={items}
              onClick={irA}
              style={{ background: "transparent", borderInlineEnd: "none", paddingTop: 12 }}
            />
          </nav>
        </Layout.Sider>
        <Layout.Content style={{ minWidth: 0 }}>
          <main className="contenido">
            {/* Cada pantalla se descarga al entrar: mientras, la barra y el menú quedan en su lugar */}
            <Suspense fallback={<Cargando />}>
              <Outlet />
            </Suspense>
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

function PanelBase(props) {
  return (
    <ProveedorAntd>
      <Estructura {...props} />
    </ProveedorAntd>
  );
}

export default PanelBase;
