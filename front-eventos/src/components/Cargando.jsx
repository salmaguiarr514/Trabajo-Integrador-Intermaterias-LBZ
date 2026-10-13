import { Spin } from "antd";

function Cargando({ texto }) {
  return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <Spin size="large" />
      {texto && <p>{texto}</p>}
    </div>
  );
}

export default Cargando;
