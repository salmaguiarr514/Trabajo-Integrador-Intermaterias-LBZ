import { Result } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

// Se completa en la fase 6 (GET /api/public/eventos → vista v_cartelera)
function Cartelera() {
  return (
    <Result
      icon={<CalendarOutlined style={{ color: "#a855f7" }} />}
      title="Cartelera"
      subTitle="Acá van a aparecer los recitales y festivales publicados por las productoras."
    />
  );
}

export default Cartelera;
