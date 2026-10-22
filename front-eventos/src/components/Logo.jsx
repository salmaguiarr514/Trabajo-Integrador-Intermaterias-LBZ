import { Link } from "react-router-dom";
import { Typography } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import { PANEL } from "../tema.js";

function Logo({ to = "/", subtitulo }) {
  return (
    <Link to={to} style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SoundOutlined style={{ fontSize: 24, color: PANEL.violetaTexto }} />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Backstage
      </Typography.Title>
      {subtitulo && (
        <Typography.Text type="secondary" className="ocultar-mobile">
          {subtitulo}
        </Typography.Text>
      )}
    </Link>
  );
}

export default Logo;
