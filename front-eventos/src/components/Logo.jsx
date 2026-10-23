import { Link } from "react-router-dom";
import { Typography } from "antd";
import Marca from "./Marca.jsx";
import { MARCA } from "../tema.js";

// Logo de los paneles: el mismo "Pase" de la cartelera, en violeta, con el nombre en Anton
function Logo({ to = "/", subtitulo }) {
  return (
    <Link
      to={to}
      aria-label={`Backstage, inicio${subtitulo ? ` de ${subtitulo}` : ""}`}
      style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}
    >
      <Marca alto={28} colores={MARCA.panel} />
      <span aria-hidden="true" className="font-afiche" style={{ fontSize: 24, lineHeight: 1, letterSpacing: "0.02em", textTransform: "uppercase" }}>
        Backstage
      </span>
      {subtitulo && (
        <Typography.Text type="secondary" className="ocultar-mobile" aria-hidden="true">
          {subtitulo}
        </Typography.Text>
      )}
    </Link>
  );
}

export default Logo;
