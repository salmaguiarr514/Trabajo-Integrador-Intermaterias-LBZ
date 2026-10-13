import { TeamOutlined } from "@ant-design/icons";
import PanelBase from "./PanelBase.jsx";

// Panel del superadmin. Las secciones de la fase 4 (usuarios, lugares, artistas, eventos)
// se agregan acá.
const ITEMS = [
  { key: "/admin/empresas", icon: <TeamOutlined />, label: "Productoras" }
];

function AdminLayout() {
  return <PanelBase inicio="/admin" subtitulo="Administración" items={ITEMS} />;
}

export default AdminLayout;
