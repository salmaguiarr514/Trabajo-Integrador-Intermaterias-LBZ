import { HomeOutlined } from "@ant-design/icons";
import { useAuth } from "../context/auth.js";
import PanelBase from "./PanelBase.jsx";

// Panel de la productora. Las secciones de la fase 5 (lugares, artistas, eventos, ventas)
// se agregan acá.
const ITEMS = [
  { key: "/panel", icon: <HomeOutlined />, label: "Inicio" }
];

function PanelLayout() {
  const { usuario } = useAuth();
  return <PanelBase inicio="/panel" subtitulo={usuario.empresa} items={ITEMS} />;
}

export default PanelLayout;
