import { useState } from "react";
import { Alert, App, Button, Card, Empty, Input, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { eliminarArtista, obtenerArtistas } from "../../services/panelService.js";
import { mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";
import ArtistaModal from "./ArtistaModal.jsx";

// Artistas de la productora (RN-12: cada una carga los suyos y solo programa artistas propios)
function Artistas() {
  const { message } = App.useApp();
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState({ abierto: false, artista: null });
  const artistas = useCarga(obtenerArtistas, "artistas", "No se pudieron cargar los artistas");

  if (artistas.cargando) return <Cargando texto="Cargando artistas..." />;
  if (artistas.error) return <Alert type="error" showIcon title={artistas.error} />;

  const eliminar = async (a) => {
    try {
      await eliminarArtista(a.id_artista);
      artistas.setDatos((lista) => lista.filter((x) => x.id_artista !== a.id_artista));
      message.success("Artista eliminado");
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo eliminar el artista"));
    }
  };

  const texto = busqueda.trim().toLowerCase();
  const filtrados = artistas.datos.filter((a) =>
    [a.nombre, a.genero, a.pais].some((c) => c?.toLowerCase().includes(texto))
  );
  const generos = [...new Set(artistas.datos.map((a) => a.genero).filter(Boolean))].sort();

  const columnas = [
    {
      title: "Artista",
      dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (nombre, a) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{nombre}</Typography.Text>
          {a.bio && (
            <Typography.Text type="secondary" ellipsis style={{ maxWidth: 320 }}>{a.bio}</Typography.Text>
          )}
        </Space>
      )
    },
    {
      title: "Género",
      dataIndex: "genero",
      filters: generos.map((g) => ({ text: g, value: g })),
      onFilter: (valor, a) => a.genero === valor,
      render: (g) => g ?? "—"
    },
    { title: "País", dataIndex: "pais", responsive: ["md"], render: (p) => p ?? "—" },
    {
      title: "Shows",
      dataIndex: "cantidad_presentaciones",
      align: "right",
      sorter: (a, b) => a.cantidad_presentaciones - b.cantidad_presentaciones
    },
    {
      title: "Estado",
      dataIndex: "activo",
      filters: [
        { text: "Activos", value: true },
        { text: "De baja", value: false }
      ],
      onFilter: (valor, a) => a.activo === valor,
      render: (activo) => (activo ? <Tag color="green">Activo</Tag> : <Tag>De baja</Tag>)
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "right",
      render: (_, a) => (
        <Space>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => setModal({ abierto: true, artista: a })} />
          </Tooltip>
          {a.cantidad_presentaciones > 0 ? (
            <Tooltip title="Tiene shows en algún evento: dalo de baja desde Editar">
              <Button danger icon={<DeleteOutlined />} disabled />
            </Tooltip>
          ) : (
            <Popconfirm
              title="Eliminar artista"
              description={`¿Seguro que querés eliminar a "${a.nombre}"?`}
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminar(a)}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="pila">
      <Encabezado
        titulo="Artistas"
        descripcion="Los artistas que trae tu productora. Son los que vas a poder poner en el line-up de tus eventos."
        acciones={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ abierto: true, artista: null })}>
            Nuevo artista
          </Button>
        }
      />
      <Card>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Buscar por nombre, género o país"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id_artista"
          columns={columnas}
          dataSource={filtrados}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="Todavía no cargaste artistas" /> }}
        />
      </Card>

      {modal.abierto && (
        <ArtistaModal
          artista={modal.artista}
          onCerrar={() => setModal({ abierto: false, artista: null })}
          onGuardado={(a) => {
            setModal({ abierto: false, artista: null });
            artistas.setDatos((lista) => {
              const existe = lista.some((x) => x.id_artista === a.id_artista);
              const nueva = existe ? lista.map((x) => (x.id_artista === a.id_artista ? a : x)) : [...lista, a];
              return nueva.sort((x, y) => x.nombre.localeCompare(y.nombre));
            });
          }}
        />
      )}
    </div>
  );
}

export default Artistas;
