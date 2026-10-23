import { Link } from "react-router-dom";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import TagEstado from "./TagEstado.jsx";

// Título de una pantalla del panel: link para volver (opcional), título con su estado (opcional),
// descripción y acciones a la derecha. Es el mismo en todas las pantallas de los paneles.
//   <Encabezado volver={{ a: "/panel/eventos", texto: "Eventos" }} titulo="Ventas" estado="publicado" acciones={<Button/>} />
function Encabezado({ titulo, descripcion, acciones, volver, estado }) {
  return (
    <div>
      {volver && (
        <Link to={volver.a} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <ArrowLeftOutlined aria-hidden="true" /> {volver.texto}
        </Link>
      )}
      <div className="encabezado">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 12px" }}>
            <Typography.Title level={1} style={{ margin: 0, fontSize: 30 }}>{titulo}</Typography.Title>
            {estado && <TagEstado estado={estado} />}
          </div>
          {descripcion && (
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
              {descripcion}
            </Typography.Text>
          )}
        </div>
        {acciones}
      </div>
    </div>
  );
}

export default Encabezado;
