import {
  CalendarOutlined, CustomerServiceOutlined, DashboardOutlined, EnvironmentOutlined, TeamOutlined, UserOutlined
} from "@ant-design/icons";
import PanelBase from "./PanelBase.jsx";

// Panel del superadmin (fase 4)
const ITEMS = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Inicio" },
  { key: "/admin/empresas", icon: <TeamOutlined />, label: "Productoras" },
  { key: "/admin/usuarios", icon: <UserOutlined />, label: "Usuarios" },
  { key: "/admin/lugares", icon: <EnvironmentOutlined />, label: "Lugares" },
  { key: "/admin/artistas", icon: <CustomerServiceOutlined />, label: "Artistas" },
  { key: "/admin/eventos", icon: <CalendarOutlined />, label: "Eventos" }
];

function AdminLayout() {
  return <PanelBase inicio="/admin" subtitulo="Administración" items={ITEMS} />;
}

export default AdminLayout;
