import { startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, Space, Typography } from "antd";
import { AppstoreOutlined, LogoutOutlined, TagsOutlined, UserOutlined } from "@ant-design/icons";
import { inicioDeRol, useAuth } from "../context/auth.js";
import { PANEL } from "../tema.js";

const NOMBRE_ROL = { superadmin: "Equipo Backstage", empresa: "Productora", cliente: "Cliente" };

// Avatar con el nombre del usuario y un menú para ir a su panel o cerrar sesión
function MenuUsuario() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    {
      key: "info",
      disabled: true,
      label: (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{usuario.nombre} {usuario.apellido ?? ""}</Typography.Text>
          <Typography.Text type="secondary">{usuario.empresa ?? NOMBRE_ROL[usuario.rol]}</Typography.Text>
        </Space>
      )
    },
    { type: "divider" },
    usuario.rol === "cliente"
      ? { key: "entradas", icon: <TagsOutlined />, label: "Mis entradas", onClick: () => navigate("/mis-entradas", { viewTransition: true }) }
      : { key: "panel", icon: <AppstoreOutlined />, label: "Mi panel", onClick: () => navigate(inicioDeRol(usuario.rol), { viewTransition: true }) },
    {
      key: "salir",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Cerrar sesión",
      onClick: () => {
        // React Router navega dentro de una transition: si el logout va aparte, se aplica
        // antes y RutaProtegida manda al login. Juntos, se renderizan a la vez.
        startTransition(() => {
          navigate("/");
          logout();
        });
      }
    }
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <Button type="text" style={{ height: "auto", paddingBlock: 4 }} aria-label={`Cuenta de ${usuario.nombre}`}>
        <Space>
          <Avatar style={{ background: PANEL.violeta }} icon={<UserOutlined />} />
          <span className="ocultar-mobile">{usuario.nombre}</span>
        </Space>
      </Button>
    </Dropdown>
  );
}

export default MenuUsuario;
