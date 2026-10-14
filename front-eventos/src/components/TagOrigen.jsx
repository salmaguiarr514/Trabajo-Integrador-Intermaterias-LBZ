import { Tag } from "antd";
import { GlobalOutlined, ShopOutlined } from "@ant-design/icons";

// Lugar de la plataforma (lo usan todas las productoras) o propio de una productora
function TagOrigen({ lugar }) {
  return lugar.origen === "plataforma"
    ? <Tag color="purple" icon={<GlobalOutlined />}>Plataforma</Tag>
    : <Tag color="blue" icon={<ShopOutlined />}>Propio · {lugar.productora}</Tag>;
}

export default TagOrigen;
