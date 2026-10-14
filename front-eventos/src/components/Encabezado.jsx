import { Typography } from "antd";

// Título de una pantalla del panel, con descripción y acciones a la derecha (botones)
function Encabezado({ titulo, descripcion, acciones }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>{titulo}</Typography.Title>
        {descripcion && <Typography.Text type="secondary">{descripcion}</Typography.Text>}
      </div>
      {acciones}
    </div>
  );
}

export default Encabezado;
