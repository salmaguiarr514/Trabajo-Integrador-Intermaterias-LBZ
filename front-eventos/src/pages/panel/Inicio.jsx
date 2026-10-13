import { Card, Typography } from "antd";
import { useAuth } from "../../context/auth.js";

// Dashboard de la productora: se completa en la fase 5 (próximos eventos y ventas)
function Inicio() {
  const { usuario } = useAuth();

  return (
    <div className="pila">
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>Hola, {usuario.nombre}</Typography.Title>
        <Typography.Text type="secondary">Panel de {usuario.empresa}</Typography.Text>
      </div>
      <Card>
        <Typography.Paragraph style={{ margin: 0 }}>
          Desde acá vas a cargar tus lugares y artistas, armar eventos con su line-up y tarifas, y seguir las ventas.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}

export default Inicio;
