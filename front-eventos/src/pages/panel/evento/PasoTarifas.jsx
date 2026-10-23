import { useState } from "react";
import dayjs from "dayjs";
import {
  Alert, App, AutoComplete, Button, Col, DatePicker, Descriptions, Empty, Form, InputNumber, Modal, Popconfirm, Row, Select,
  Space, Switch, Table, Tag, Tooltip, Typography
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { actualizarParteEvento, crearParteEvento, eliminarParteEvento } from "../../../services/panelService.js";
import { mensajeDeError } from "../../../services/api.js";
import { mostrarErrores } from "../../../utils/erroresForm.js";
import { diaCorto, numero, pesos } from "../../../utils/formato.js";

const ABONO = "abono"; // en el Select; en la API el abono es id_jornada = null
const FORMATO = "YYYY-MM-DDTHH:mm";
const NOMBRES = ["General", "Preventa", "Preventa 1", "Preventa 2", "Venta general", "Abono"].map((value) => ({ value }));

const separarMiles = (v) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const sacarMiles = (v) => (v ?? "").replace(/\./g, "");

function TarifaModal({ evento, tarifa, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const idEspacio = Form.useWatch("id_espacio", form);
  const espacio = evento.espacios.find((e) => e.id_espacio === idEspacio);
  const vendida = tarifa?.entradas_emitidas > 0;

  const guardar = async (v) => {
    const datos = {
      id_espacio: v.id_espacio,
      id_jornada: v.id_jornada === ABONO ? null : v.id_jornada,
      nombre: v.nombre,
      precio: v.precio,
      venta_desde: v.venta?.[0]?.format(FORMATO) ?? null,
      venta_hasta: v.venta?.[1]?.format(FORMATO) ?? null,
      activa: v.activa
    };
    setGuardando(true);
    setErrorApi("");
    try {
      if (tarifa) await actualizarParteEvento(evento.id_evento, "tarifas", tarifa.id_tarifa, datos);
      else await crearParteEvento(evento.id_evento, "tarifas", datos);
      message.success(tarifa ? "Tarifa actualizada" : "Tarifa creada");
      onGuardado();
    } catch (error) {
      mostrarErrores(form, error, setErrorApi, "No se pudo guardar la tarifa");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      title={tarifa ? "Editar tarifa" : "Nueva tarifa"}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onCerrar}
      width={600}
    >
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      {vendida && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Ya tiene ${tarifa.entradas_emitidas} entradas vendidas: se puede cambiar el precio (las vendidas mantienen el suyo), pero no el sector ni la jornada`}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={guardar}
        requiredMark="optional"
        initialValues={
          tarifa
            ? {
                ...tarifa,
                id_jornada: tarifa.id_jornada ?? ABONO,
                venta: tarifa.venta_desde || tarifa.venta_hasta ? [tarifa.venta_desde && dayjs(tarifa.venta_desde), tarifa.venta_hasta && dayjs(tarifa.venta_hasta)] : null
              }
            : { activa: true, id_jornada: evento.jornadas.length === 1 ? evento.jornadas[0].id_jornada : undefined }
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="id_espacio"
              label="Sector"
              rules={[{ required: true, message: "Elegí el sector" }]}
              extra={espacio && `Cupo: ${numero(espacio.capacidad)} (la capacidad del sector)`}
            >
              <Select disabled={vendida} options={evento.espacios.map((e) => ({ value: e.id_espacio, label: e.nombre }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="id_jornada" label="Vale para" rules={[{ required: true, message: "Elegí la jornada o abono" }]}>
              <Select
                disabled={vendida}
                options={[
                  ...evento.jornadas.map((j) => ({ value: j.id_jornada, label: `Jornada ${diaCorto(j.fecha)}` })),
                  ...(evento.jornadas.length > 1 ? [{ value: ABONO, label: "Abono: todas las jornadas" }] : [])
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="nombre" label="Nombre" rules={[{ required: true, whitespace: true, message: "Poné un nombre" }]}>
              <AutoComplete options={NOMBRES} maxLength={60} placeholder="General, Preventa..." filterOption />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="precio" label="Precio" rules={[{ required: true, message: "Poné el precio" }]} extra="Sin el cargo por servicio: ese se suma al comprar">
              <InputNumber min={0} step={1000} prefix="$" formatter={separarMiles} parser={sacarMiles} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="venta" label="Período de venta" extra="Opcional. Sin fechas, se vende mientras esté activa">
              <DatePicker.RangePicker showTime={{ format: "HH:mm" }} format="DD/MM/YYYY HH:mm" allowEmpty={[true, true]} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="activa" label="Activa" valuePropName="checked" required extra="Una tarifa inactiva no se vende ni cuenta para publicar">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

function PasoTarifas({ evento, soloLectura, onCambio }) {
  const { message } = App.useApp();
  const [modal, setModal] = useState(null); // { tarifa }
  const [cambiando, setCambiando] = useState(null);

  const eliminar = async (t) => {
    try {
      await eliminarParteEvento(evento.id_evento, "tarifas", t.id_tarifa);
      message.success("Tarifa eliminada");
      onCambio();
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo eliminar la tarifa"));
    }
  };

  const cambiarActiva = async (t, activa) => {
    setCambiando(t.id_tarifa);
    try {
      await actualizarParteEvento(evento.id_evento, "tarifas", t.id_tarifa, { activa });
      onCambio();
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo cambiar la tarifa"));
    } finally {
      setCambiando(null);
    }
  };

  const columnas = [
    {
      title: "Sector",
      dataIndex: "espacio",
      render: (espacio, t) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{espacio}</Typography.Text>
          <Typography.Text type="secondary">{t.nombre}</Typography.Text>
        </Space>
      )
    },
    {
      title: "Vale para",
      dataIndex: "id_jornada",
      render: (id, t) => (id ? <span style={{ textTransform: "capitalize" }}>{diaCorto(t.fecha_jornada)}</span> : <Tag color="purple">Abono</Tag>)
    },
    {
      title: "Precio",
      dataIndex: "precio",
      align: "right",
      render: (p) => <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{pesos(p)}</span>
    },
    {
      title: "Venta",
      key: "venta",
      responsive: ["lg"],
      render: (_, t) =>
        t.venta_desde || t.venta_hasta ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t.venta_desde ? `Desde ${dayjs(t.venta_desde).format("DD/MM HH:mm")}` : ""}
            {t.venta_desde && t.venta_hasta ? " · " : ""}
            {t.venta_hasta ? `Hasta ${dayjs(t.venta_hasta).format("DD/MM HH:mm")}` : ""}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">Siempre</Typography.Text>
        )
    },
    { title: "Vendidas", dataIndex: "entradas_emitidas", align: "right", responsive: ["md"], render: numero },
    {
      title: "Activa",
      dataIndex: "activa",
      render: (activa, t) => (
        <Switch size="small" checked={activa} disabled={soloLectura} loading={cambiando === t.id_tarifa} onChange={(v) => cambiarActiva(t, v)} />
      )
    },
    ...(soloLectura
      ? []
      : [
          {
            title: "Acciones",
            key: "acciones",
            align: "right",
            render: (_, t) => (
              <Space>
                <Tooltip title="Editar">
                  <Button icon={<EditOutlined />} onClick={() => setModal({ tarifa: t })} />
                </Tooltip>
                {t.entradas_emitidas > 0 ? (
                  <Tooltip title="Tiene entradas vendidas: desactivala en lugar de eliminarla">
                    <Button danger icon={<DeleteOutlined />} disabled />
                  </Tooltip>
                ) : (
                  <Popconfirm title="¿Eliminar esta tarifa?" okText="Eliminar" cancelText="Cancelar" okButtonProps={{ danger: true }} onConfirm={() => eliminar(t)}>
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            )
          }
        ])
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Descriptions
        size="small"
        title="Cupos por sector"
        column={{ xs: 1, sm: 2, md: 3 }}
        items={evento.espacios.map((e) => ({ key: e.id_espacio, label: e.nombre, children: numero(e.capacidad) }))}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Typography.Text type="secondary">
          Cada tarifa es un precio para un sector, por jornada o como abono. El cupo no se carga: es la capacidad del sector,
          y las tarifas de un mismo sector lo comparten.
        </Typography.Text>
        {!soloLectura && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ tarifa: null })} disabled={evento.jornadas.length === 0}>
            Nueva tarifa
          </Button>
        )}
      </div>
      <Table
        rowKey="id_tarifa"
        columns={columnas}
        dataSource={evento.tarifas}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: <Empty description="Sin tarifas: cargá al menos una para poder publicar" /> }}
      />
      {modal && (
        <TarifaModal
          evento={evento}
          tarifa={modal.tarifa}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            onCambio();
          }}
        />
      )}
    </Space>
  );
}

export default PasoTarifas;
