import { useState } from "react";
import { App, Button, Card, Empty, Input, Segmented, Space, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { CrownOutlined, EditOutlined, PlusOutlined, SearchOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { actualizarUsuario, obtenerUsuarios } from "../../services/adminService.js";
import { obtenerEmpresas } from "../../services/empresasService.js";
import { mensajeDeError } from "../../services/api.js";
import { useAuth } from "../../context/auth.js";
import { useCarga } from "../../hooks/useCarga.js";
import { fechaHora } from "../../utils/formato.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";
import UsuarioModal from "./UsuarioModal.jsx";
import ErrorPanel from "../../components/ErrorPanel.jsx";

const ROL = {
  superadmin: { texto: "Superadmin", color: "purple", icono: <CrownOutlined /> },
  empresa: { texto: "Productora", color: "blue", icono: <ShopOutlined /> },
  cliente: { texto: "Cliente", color: "default", icono: <UserOutlined /> }
};

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "superadmin", label: "Superadmin" },
  { value: "empresa", label: "Productoras" },
  { value: "cliente", label: "Clientes" }
];

function Usuarios() {
  const { usuario: yo } = useAuth();
  const { message } = App.useApp();
  const [rol, setRol] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState({ abierto: false, usuario: null });
  const [cambiando, setCambiando] = useState(null);

  const usuarios = useCarga(() => obtenerUsuarios({ rol: rol || undefined }), rol, "No se pudieron cargar los usuarios");
  const empresas = useCarga(obtenerEmpresas, "empresas", "No se pudieron cargar las productoras");

  if (usuarios.cargando) return <Cargando texto="Cargando usuarios…" />;
  if (usuarios.error) return <ErrorPanel mensaje={usuarios.error} onReintentar={usuarios.recargar} />;

  const reemplazar = (u) =>
    usuarios.setDatos((lista) => {
      const existe = lista.some((x) => x.id_usuario === u.id_usuario);
      return existe ? lista.map((x) => (x.id_usuario === u.id_usuario ? u : x)) : [u, ...lista];
    });

  const cambiarActivo = async (u, activo) => {
    setCambiando(u.id_usuario);
    try {
      const { data } = await actualizarUsuario(u.id_usuario, { activo });
      reemplazar(data);
      message.success(activo ? `${u.nombre} puede volver a entrar` : `${u.nombre} ya no puede entrar`);
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo cambiar el estado"));
    } finally {
      setCambiando(null);
    }
  };

  const texto = busqueda.trim().toLowerCase();
  const filtrados = usuarios.datos.filter((u) =>
    [u.nombre, u.apellido, u.email, u.empresa, u.dni].some((c) => c?.toLowerCase().includes(texto))
  );

  const columnas = [
    {
      title: "Usuario",
      key: "usuario",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (_, u) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>
            {u.nombre} {u.apellido}
            {u.id_usuario === yo.id_usuario && <Typography.Text type="secondary"> (vos)</Typography.Text>}
          </Typography.Text>
          <Typography.Text type="secondary">{u.email}</Typography.Text>
        </Space>
      )
    },
    {
      title: "Rol",
      dataIndex: "rol",
      render: (r, u) => (
        <Space orientation="vertical" size={2}>
          <Tag color={ROL[r].color} icon={ROL[r].icono}>{ROL[r].texto}</Tag>
          {u.empresa && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{u.empresa}</Typography.Text>}
        </Space>
      )
    },
    {
      title: "Contacto",
      key: "contacto",
      responsive: ["md"],
      render: (_, u) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>{u.telefono ?? "—"}</Typography.Text>
          <Typography.Text type="secondary">{u.dni ? `DNI ${u.dni}` : "Sin DNI"}</Typography.Text>
        </Space>
      )
    },
    {
      title: "Alta",
      dataIndex: "fecha_creacion",
      responsive: ["lg"],
      sorter: (a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion),
      render: fechaHora
    },
    {
      title: "Activo",
      dataIndex: "activo",
      filters: [
        { text: "Activos", value: true },
        { text: "Dados de baja", value: false }
      ],
      onFilter: (valor, u) => u.activo === valor,
      render: (activo, u) => (
        <Tooltip title={u.id_usuario === yo.id_usuario ? "No podés darte de baja a vos mismo" : undefined}>
          <Switch
            checked={activo}
            loading={cambiando === u.id_usuario}
            disabled={u.id_usuario === yo.id_usuario}
            onChange={(valor) => cambiarActivo(u, valor)}
          />
        </Tooltip>
      )
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "right",
      render: (_, u) =>
        u.rol === "cliente" ? (
          <Tooltip title="Los datos de un cliente los edita el cliente desde su perfil">
            <Button icon={<EditOutlined />} disabled />
          </Tooltip>
        ) : (
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => setModal({ abierto: true, usuario: u })} />
          </Tooltip>
        )
    }
  ];

  return (
    <div className="pila">
      <Encabezado
        titulo="Usuarios"
        descripcion="El equipo de Backstage, el personal de cada productora y los clientes registrados."
        acciones={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ abierto: true, usuario: null })}>
            Nuevo usuario
          </Button>
        }
      />

      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Segmented options={FILTROS} value={rol} onChange={setRol} />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por nombre, email, DNI o productora"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: "1 1 260px" }}
          />
        </div>
        <Table
          rowKey="id_usuario"
          columns={columnas}
          dataSource={filtrados}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="No hay usuarios para mostrar" /> }}
        />
      </Card>

      {modal.abierto && (
        <UsuarioModal
          usuario={modal.usuario}
          empresas={empresas.datos ?? []}
          esUnoMismo={modal.usuario?.id_usuario === yo.id_usuario}
          onCerrar={() => setModal({ abierto: false, usuario: null })}
          onGuardado={(u) => {
            setModal({ abierto: false, usuario: null });
            // Si el filtro de rol no lo incluye, se recarga para que no aparezca donde no va
            if (rol && u.rol !== rol) usuarios.recargar();
            else reemplazar(u);
          }}
        />
      )}
    </div>
  );
}

export default Usuarios;
