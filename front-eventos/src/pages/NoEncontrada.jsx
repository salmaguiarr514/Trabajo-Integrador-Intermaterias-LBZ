import { useNavigate } from "react-router-dom";
import { Button, Result } from "antd";

function NoEncontrada() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="La página que buscás no existe."
      extra={<Button type="primary" onClick={() => navigate(-1)}>Volver</Button>}
    />
  );
}

export default NoEncontrada;
