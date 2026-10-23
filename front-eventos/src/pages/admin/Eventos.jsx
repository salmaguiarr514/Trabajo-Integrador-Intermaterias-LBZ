import { useState } from "react";
import {
  App, Button, Card, Empty, Input, Popconfirm, Select, Space, Table, Tooltip, Typography
} from "antd";
import { EnvironmentOutlined, EyeInvisibleOutlined, SearchOutlined, StopOutlined } from "@ant-design/icons";
import { cambiarEstadoEvento, obtenerEventos } from "../../services/adminService.js";
import { obtenerEmpresas } from "../../services/empresasService.js";
import { mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import { numero, pesos, rangoFechas } from "../../utils/formato.js";
import { OPCIONES_ESTADO_EVENTO } from "../../utils/estados.js";
import TagEstado from "../../components/TagEstado.jsx";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";
import ErrorPanel from "../../components/ErrorPanel.jsx";

const sePuedeDespublicar = (e) => ["publicado", "agotado"].includes(e.estado);
const sePuedeCancelar = (e) => !["cancelado", "finalizado"].includes(e.estado);

// Vista global de los eventos de todas las productoras, con moderación (despublicar o cancelar)
function Eventos() {
  const { message } = App.useApp();
  const [filtros, setFiltros] = useState({ estado: undefined, id_empresa: undefined });
  const [busqueda, setBusqueda] = useState("");
  const [cambiando, setCambiando] = useState(null);
  const eventos = useCarga(() => obtenerEventos(filtros), JSON.stringify(filtros), "No se pudieron cargar los eventos");
  const empresas = useCarga(obtenerEmpresas, "empresas", "No se pudieron cargar las productoras");

  if (eventos.cargando) return <Cargando texto="Cargando eventos…" />;
  if (eventos.error) return <ErrorPanel mensaje={eventos.error} onReintentar={eventos.recargar} />;

  const cambiarEstado = async (evento, estado) => {
    setCambiando(evento.id_evento);
    try {
      const { data } = await cambiarEstadoEvento(evento.id_evento, estado);
      eventos.setDatos((lista) => lista.map((e) => (e.id_evento === data.id_evento ? data : e)));
      message.success(estado === "cancelado" ? "Evento cancelado" : "Evento despublicado: ya no aparece en la cartelera");
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo cambiar el estado"));
    } finally {
      setCambiando(null);
    }
  };

  const texto = busqueda.trim().toLowerCase();
  const filtrados = eventos.datos.filter((e) =>
    [e.nombre, e.productora, e.lugar, e.ciudad].some((c) => c?.toLowerCase().includes(texto))
  );

  const columnas = [
    {
      title: "Evento",
      dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (nombre, e) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{nombre}</Typography.Text>
          <Typography.Text type="secondary">
            {e.tipo === "festival" ? `Festival · ${e.cantidad_jornadas} jornadas` : "Recital"} · {e.productora}
          </Typography.Text>
        </Space>
      )
    },
    {
      title: "Fecha",
      key: "fecha",
      defaultSortOrder: "ascend",
      sorter: (a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio),
      render: (_, e) => <span style={{ whiteSpace: "nowrap" }}>{rangoFechas(e.fecha_inicio, e.fecha_fin)}</span>
    },
    {
      title: "Lugar",
      key: "lugar",
      responsive: ["lg"],
      render: (_, e) => (
        <Typography.Text>
          <EnvironmentOutlined /> {e.lugar}, {e.ciudad}
        </Typography.Text>
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (estado) => <TagEstado estado={estado} />
    },
    {
      title: "Entradas",
      dataIndex: "entradas_vendidas",
      align: "right",
      responsive: ["md"],
      sorter: (a, b) => a.entradas_vendidas - b.entradas_vendidas,
      render: numero
    },
    {
      title: "Vendido",
      dataIndex: "recaudado",
      align: "right",
      responsive: ["md"],
      sorter: (a, b) => a.recaudado - b.recaudado,
      render: (v) => <span style={{ whiteSpace: "nowrap" }}>{pesos(v)}</span>
    },
    {
      title: "Moderación",
      key: "acciones",
      align: "right",
      render: (_, e) => (
        <Space>
          <Popconfirm
            title="Despublicar evento"
            description="Sale de la cartelera. La productora lo puede corregir y volver a publicar."
            okText="Despublicar"
            cancelText="Cancelar"
            disabled={!sePuedeDespublicar(e)}
            onConfirm={() => cambiarEstado(e, "borrador")}
          >
            <Tooltip title={sePuedeDespublicar(e) ? "Despublicar" : "Solo se despublica un evento publicado o agotado"}>
              <Button icon={<EyeInvisibleOutlined />} disabled={!sePuedeDespublicar(e)} loading={cambiando === e.id_evento} />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Cancelar evento"
            description={
              e.entradas_vendidas > 0
                ? `Tiene ${numero(e.entradas_vendidas)} entradas vendidas. Cancelar no tiene vuelta atrás.`
                : "Cancelar no tiene vuelta atrás."
            }
            okText="Cancelar evento"
            cancelText="Volver"
            okButtonProps={{ danger: true }}
            disabled={!sePuedeCancelar(e)}
            onConfirm={() => cambiarEstado(e, "cancelado")}
          >
            <Tooltip title={sePuedeCancelar(e) ? "Cancelar evento" : `Ya está ${e.estado}`}>
              <Button danger icon={<StopOutlined />} disabled={!sePuedeCancelar(e)} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="pila">
      <Encabezado
        titulo="Eventos"
        descripcion="Todos los eventos de todas las productoras. Desde acá se pueden despublicar o cancelar."
      />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Todos los estados"
            value={filtros.estado}
            onChange={(estado) => setFiltros({ ...filtros, estado })}
            options={OPCIONES_ESTADO_EVENTO}
            style={{ minWidth: 170 }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Todas las productoras"
            value={filtros.id_empresa}
            onChange={(id_empresa) => setFiltros({ ...filtros, id_empresa })}
            options={(empresas.datos ?? []).map((e) => ({ value: e.id_empresa, label: e.nombre }))}
            style={{ minWidth: 220 }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por evento, lugar o ciudad"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: "1 1 240px" }}
          />
        </div>
        <Table
          rowKey="id_evento"
          columns={columnas}
          dataSource={filtrados}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="No hay eventos para mostrar" /> }}
        />
      </Card>
    </div>
  );
}

export default Eventos;
