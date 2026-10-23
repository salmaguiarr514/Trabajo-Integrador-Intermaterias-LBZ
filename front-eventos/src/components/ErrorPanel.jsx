import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

// Error al cargar una pantalla del panel, con la salida: volver a intentar
function ErrorPanel({ mensaje, onReintentar }) {
  return (
    <Alert
      type="error"
      showIcon
      title={mensaje}
      action={
        <Button size="small" icon={<ReloadOutlined />} onClick={onReintentar}>
          Reintentar
        </Button>
      }
    />
  );
}

export default ErrorPanel;
