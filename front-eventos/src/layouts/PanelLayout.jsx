import { CalendarOutlined, CustomerServiceOutlined, EnvironmentOutlined, HomeOutlined, ShopOutlined } from "@ant-design/icons";
import { useAuth } from "../context/auth.js";
import PanelBase from "./PanelBase.jsx";

// Panel de la productora (fase 5). Las ventas (fase 7) se agregan acá.
const ITEMS = [
  { key: "/panel", icon: <HomeOutlined />, label: "Inicio" },
  { key: "/panel/eventos", icon: <CalendarOutlined />, label: "Eventos" },
  { key: "/panel/lugares", icon: <EnvironmentOutlined />, label: "Lugares" },
  { key: "/panel/artistas", icon: <CustomerServiceOutlined />, label: "Artistas" },
  { key: "/panel/mi-productora", icon: <ShopOutlined />, label: "Mi productora" }
];

function PanelLayout() {
  const { usuario } = useAuth();
  return <PanelBase inicio="/panel" subtitulo={usuario.empresa} items={ITEMS} />;
}

export default PanelLayout;
