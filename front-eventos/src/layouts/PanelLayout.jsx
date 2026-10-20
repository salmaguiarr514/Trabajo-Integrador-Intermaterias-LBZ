import { CalendarOutlined, CustomerServiceOutlined, EnvironmentOutlined, HomeOutlined, ScanOutlined, ShopOutlined } from "@ant-design/icons";
import { useAuth } from "../context/auth.js";
import PanelBase from "./PanelBase.jsx";

// Panel de la productora (fases 5 y 7). Las ventas de cada evento se abren desde Eventos.
const ITEMS = [
  { key: "/panel", icon: <HomeOutlined />, label: "Inicio" },
  { key: "/panel/eventos", icon: <CalendarOutlined />, label: "Eventos" },
  { key: "/panel/acceso", icon: <ScanOutlined />, label: "Control de acceso" },
  { key: "/panel/lugares", icon: <EnvironmentOutlined />, label: "Lugares" },
  { key: "/panel/artistas", icon: <CustomerServiceOutlined />, label: "Artistas" },
  { key: "/panel/mi-productora", icon: <ShopOutlined />, label: "Mi productora" }
];

function PanelLayout() {
  const { usuario } = useAuth();
  return <PanelBase inicio="/panel" subtitulo={usuario.empresa} items={ITEMS} />;
}

export default PanelLayout;
