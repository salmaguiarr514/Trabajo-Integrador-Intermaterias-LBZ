import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, App, Button, Card, Empty, Form, Input, InputNumber, Modal, Segmented, Space, Table, Tag, Typography
} from "antd";
import { EnvironmentOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { crearLugar, obtenerLugares } from "../../services/adminService.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import { numero } from "../../utils/formato.js";
import { etiquetaTipoLugar, TIPOS_LUGAR } from "../../utils/estados.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";
import TagOrigen from "../../components/TagOrigen.jsx";
import LugarCampos from "./LugarCampos.jsx";

const FILTROS = [
  { value: "plataforma", label: "De la plataforma" },
  { value: "propio", label: "Propios de productoras" },
  { value: "", label: "Todos" }
];

function NuevoLugarModal({ abierto, onCerrar }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  const guardar = async (valores) => {
    setGuardando(true);
    setErrorApi("");
    try {
      const { data } = await crearLugar(valores);
      message.success("Lugar creado. Ahora podés cargar sus sectores y escenarios.");
      navigate(`/admin/lugares/${data.id_lugar}`);
    } catch (error) {
      const campos = erroresPorCampo(error);
      if (Object.keys(campos).length > 0) {
        form.setFields(Object.entries(campos).map(([name, msg]) => ({ name, errors: [msg] })));
      } else {
        setErrorApi(mensajeDeError(error, "No se pudo crear el lugar"));
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={abierto}
      title="Nuevo lugar de la plataforma"
      okText="Crear lugar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onCerrar}
      width={640}
      destroyOnHidden
    >
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={guardar} requiredMark="optional" preserve={false}>
        <LugarCampos />
        <Form.Item
          name="capacidad"
          label="Capacidad"
          extra='Se crea el sector "General" con esta capacidad y el escenario "Principal". Después los podés dividir y renombrar.'
          rules={[{ required: true, message: "La capacidad es obligatoria" }]}
        >
          <InputNumber min={1} step={100} style={{ width: "100%" }} placeholder="Ej: 5000" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function Lugares() {
  const navigate = useNavigate();
  const [origen, setOrigen] = useState("plataforma");
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const lugares = useCarga(() => obtenerLugares({ origen: origen || undefined }), origen, "No se pudieron cargar los lugares");

  if (lugares.cargando) return <Cargando texto="Cargando lugares..." />;
  if (lugares.error) return <Alert type="error" showIcon title={lugares.error} />;

  const texto = busqueda.trim().toLowerCase();
  const filtrados = lugares.datos.filter((l) =>
    [l.nombre, l.ciudad, l.provincia, l.productora].some((c) => c?.toLowerCase().includes(texto))
  );

  const columnas = [
    {
      title: "Lugar",
      dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (nombre, l) => (
        <Space orientation="vertical" size={0}>
          <Typography.Link strong onClick={() => navigate(`/admin/lugares/${l.id_lugar}`)}>{nombre}</Typography.Link>
          <Typography.Text type="secondary"><EnvironmentOutlined /> {l.ciudad}, {l.provincia}</Typography.Text>
        </Space>
      )
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      responsive: ["md"],
      filters: TIPOS_LUGAR.map((t) => ({ text: t.label, value: t.value })),
      onFilter: (valor, l) => l.tipo === valor,
      render: etiquetaTipoLugar
    },
    {
      title: "Capacidad",
      dataIndex: "capacidad_total",
      align: "right",
      sorter: (a, b) => a.capacidad_total - b.capacidad_total,
      render: (c) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{numero(c)}</span>
    },
    {
      title: "Sectores / escenarios",
      key: "partes",
      responsive: ["lg"],
      render: (_, l) => `${l.cantidad_espacios} / ${l.cantidad_escenarios}${l.tiene_plano ? " · con plano" : ""}`
    },
    { title: "Origen", key: "origen", responsive: ["md"], render: (_, l) => <TagOrigen lugar={l} /> },
    {
      title: "Eventos",
      dataIndex: "cantidad_eventos",
      align: "right",
      responsive: ["lg"],
      sorter: (a, b) => a.cantidad_eventos - b.cantidad_eventos
    },
    {
      title: "Estado",
      dataIndex: "activo",
      render: (activo) => (activo ? <Tag color="green">Activo</Tag> : <Tag>De baja</Tag>)
    }
  ];

  return (
    <div className="pila">
      <Encabezado
        titulo="Lugares"
        descripcion="El catálogo de la plataforma lo pueden usar todas las productoras. Los propios los carga cada una y acá solo se ven."
        acciones={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreando(true)}>
            Nuevo lugar
          </Button>
        }
      />

      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Segmented options={FILTROS} value={origen} onChange={setOrigen} />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por nombre, ciudad o productora"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: "1 1 260px" }}
          />
        </div>
        <Table
          rowKey="id_lugar"
          columns={columnas}
          dataSource={filtrados}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
          onRow={(l) => ({ onClick: () => navigate(`/admin/lugares/${l.id_lugar}`), style: { cursor: "pointer" } })}
          locale={{ emptyText: <Empty description="No hay lugares para mostrar" /> }}
        />
      </Card>

      <NuevoLugarModal abierto={creando} onCerrar={() => setCreando(false)} />
    </div>
  );
}

export default Lugares;
