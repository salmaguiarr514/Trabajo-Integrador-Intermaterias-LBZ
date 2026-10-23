import { Tag } from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EditOutlined, FireOutlined, MinusCircleOutlined
} from "@ant-design/icons";
import { ESTADOS } from "../utils/estados.js";

const ICONO = {
  borrador: <EditOutlined />,
  publicado: <CheckCircleOutlined />,
  agotado: <FireOutlined />,
  cancelado: <CloseCircleOutlined />,
  finalizado: <ClockCircleOutlined />,
  pagada: <CheckCircleOutlined />,
  rechazada: <CloseCircleOutlined />,
  pendiente: <ClockCircleOutlined />,
  cancelada: <MinusCircleOutlined />
};

// Estado de un evento o de una compra: texto, color e ícono (el color nunca va solo)
//   <TagEstado estado="publicado" />   <TagEstado tipo="compra" estado="pagada" />
//   <TagEstado estado="publicado">: <b>4</b></TagEstado>   (algo más después del texto)
function TagEstado({ estado, tipo = "evento", children, ...props }) {
  const e = ESTADOS[tipo][estado] ?? { texto: estado, color: "default" };
  return (
    <Tag color={e.color} icon={ICONO[estado]} {...props}>
      {e.texto}
      {children}
    </Tag>
  );
}

export default TagEstado;
