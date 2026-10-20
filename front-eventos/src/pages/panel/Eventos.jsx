import { useNavigate } from "react-router-dom";
import { Alert, App, Button, Card, Empty, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import { eliminarEvento, obtenerEventos } from "../../services/panelService.js";
import { mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import { numero, rangoFechas } from "../../utils/formato.js";
import { COLOR_ESTADO } from "../../utils/estados.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";

// Qué le falta a un borrador para poder publicarse (RN-20)
const faltante = (e) =>
  [
    e.cantidad_jornadas === 0 && "jornadas",
    e.cantidad_presentaciones === 0 && "line-up",
    e.cantidad_tarifas === 0 && "tarifas"
  ].filter(Boolean);

function Eventos() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const eventos = useCarga(obtenerEventos, "eventos", "No se pudieron cargar los eventos");

  if (eventos.cargando) return <Cargando texto="Cargando eventos..." />;
  if (eventos.error) return <Alert type="error" showIcon title={eventos.error} />;

  const eliminar = async (e) => {
    try {
      await eliminarEvento(e.id_evento);
      eventos.setDatos((lista) => lista.filter((x) => x.id_evento !== e.id_evento));
      message.success("Evento eliminado");
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo eliminar el evento"));
    }
  };

  const abrir = (e) => navigate(`/panel/eventos/${e.id_evento}`);

  const columnas = [
    {
      title: "Evento",
      dataIndex: "nombre",
      render: (nombre, e) => (
        <Space orientation="vertical" size={0}>
          <Typography.Link strong onClick={() => abrir(e)}>{nombre}</Typography.Link>
          <Typography.Text type="secondary">
            {e.tipo === "festival" ? "Festival" : "Recital"} · <EnvironmentOutlined /> {e.lugar}, {e.ciudad}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: "Fecha",
      key: "fecha",
      sorter: (a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio),
      render: (_, e) => <span style={{ whiteSpace: "nowrap" }}>{rangoFechas(e.fecha_inicio, e.fecha_fin)}</span>
    },
    {
      title: "Estado",
      dataIndex: "estado",
      filters: Object.keys(COLOR_ESTADO).map((estado) => ({ text: estado, value: estado })),
      onFilter: (valor, e) => e.estado === valor,
      render: (estado, e) => {
        const falta = estado === "borrador" ? faltante(e) : [];
        return (
          <Space orientation="vertical" size={2}>
            <Tag color={COLOR_ESTADO[estado]}>{estado}</Tag>
            {falta.length > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Falta: {falta.join(", ")}</Typography.Text>
            )}
          </Space>
        );
      }
    },
    {
      title: "Armado",
      key: "armado",
      responsive: ["md"],
      render: (_, e) => (
        <Typography.Text type="secondary" style={{ whiteSpace: "nowrap" }}>
          {e.cantidad_jornadas} {e.cantidad_jornadas === 1 ? "jornada" : "jornadas"} · {e.cantidad_presentaciones} shows ·{" "}
          {e.cantidad_tarifas} tarifas
        </Typography.Text>
      )
    },
    {
      title: "Entradas",
      dataIndex: "entradas_vendidas",
      align: "right",
      responsive: ["md"],
      render: numero
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "right",
      render: (_, e) => (
        <Space>
          <Tooltip title="Abrir el asistente">
            <Button icon={<EditOutlined />} onClick={() => abrir(e)} />
          </Tooltip>
          {e.cantidad_compras > 0 ? (
            <Tooltip title="Tiene ventas: no se puede eliminar, solo cancelar">
              <Button danger icon={<DeleteOutlined />} disabled />
            </Tooltip>
          ) : (
            <Popconfirm
              title="Eliminar evento"
              description={`Se borra "${e.nombre}" con sus jornadas, line-up y tarifas. ¿Seguro?`}
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => eliminar(e)}
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
        titulo="Eventos"
        descripcion="Tus recitales y festivales. Se arman en borrador y aparecen en la cartelera cuando los publicás."
        acciones={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/panel/eventos/nuevo")}>
            Nuevo evento
          </Button>
        }
      />
      <Card>
        <Table
          rowKey="id_evento"
          columns={columnas}
          dataSource={eventos.datos}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
          locale={{
            emptyText: (
              <Empty description="Todavía no armaste eventos">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/panel/eventos/nuevo")}>
                  Armar el primero
                </Button>
              </Empty>
            )
          }}
        />
      </Card>
    </div>
  );
}

export default Eventos;
