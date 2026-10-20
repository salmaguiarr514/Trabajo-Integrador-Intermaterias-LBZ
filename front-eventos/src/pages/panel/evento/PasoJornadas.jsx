import { useState } from "react";
import dayjs from "dayjs";
import { Alert, App, Button, DatePicker, Empty, Form, Input, Modal, Popconfirm, Space, Table, TimePicker, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { actualizarParteEvento, crearParteEvento, eliminarParteEvento } from "../../../services/panelService.js";
import { mensajeDeError } from "../../../services/api.js";
import { mostrarErrores } from "../../../utils/erroresForm.js";
import { diaCorto, fecha } from "../../../utils/formato.js";

// Alta y edición de una jornada. Solo se pueden elegir días del evento que no tengan jornada (RN-19).
function JornadaModal({ evento, jornada, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const ocupadas = new Set(evento.jornadas.filter((j) => j.id_jornada !== jornada?.id_jornada).map((j) => j.fecha));

  const fueraDeRango = (d) => {
    const iso = d.format("YYYY-MM-DD");
    return iso < evento.fecha_inicio || iso > evento.fecha_fin || ocupadas.has(iso);
  };

  const guardar = async (v) => {
    const datos = { fecha: v.fecha.format("YYYY-MM-DD"), hora_apertura: v.hora_apertura?.format("HH:mm") ?? null, nombre: v.nombre ?? null };
    setGuardando(true);
    setErrorApi("");
    try {
      if (jornada) await actualizarParteEvento(evento.id_evento, "jornadas", jornada.id_jornada, datos);
      else await crearParteEvento(evento.id_evento, "jornadas", datos);
      message.success(jornada ? "Jornada actualizada" : "Jornada agregada");
      onGuardado();
    } catch (error) {
      mostrarErrores(form, error, setErrorApi, "No se pudo guardar la jornada");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      title={jornada ? `Jornada del ${fecha(jornada.fecha)}` : "Nueva jornada"}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onCerrar}
    >
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={guardar}
        requiredMark="optional"
        initialValues={
          jornada
            ? { fecha: dayjs(jornada.fecha), hora_apertura: jornada.hora_apertura ? dayjs(`${jornada.fecha}T${jornada.hora_apertura}`) : null, nombre: jornada.nombre }
            : {}
        }
      >
        <Form.Item
          name="fecha"
          label="Día"
          rules={[{ required: true, message: "Elegí el día" }]}
          extra={jornada?.cantidad_presentaciones > 0 ? "Tiene shows: si cambiás el día, tienen que seguir cayendo en él" : undefined}
        >
          <DatePicker format="DD/MM/YYYY" disabledDate={fueraDeRango} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="hora_apertura" label="Apertura de puertas">
          <TimePicker format="HH:mm" minuteStep={15} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="nombre" label="Nombre" extra='Opcional. Ej: "Día 1", "Noche de cierre"'>
          <Input maxLength={60} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function PasoJornadas({ evento, soloLectura, onCambio }) {
  const { message } = App.useApp();
  const [modal, setModal] = useState({ abierto: false, jornada: null });

  // Días del rango que todavía no tienen jornada
  const totalDias = dayjs(evento.fecha_fin).diff(dayjs(evento.fecha_inicio), "day") + 1;
  const quedanDias = evento.jornadas.length < totalDias;

  const eliminar = async (j) => {
    try {
      await eliminarParteEvento(evento.id_evento, "jornadas", j.id_jornada);
      message.success("Jornada eliminada");
      onCambio();
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo eliminar la jornada"));
    }
  };

  const columnas = [
    {
      title: "Día",
      dataIndex: "fecha",
      render: (f, j) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong style={{ textTransform: "capitalize" }}>{diaCorto(f)}</Typography.Text>
          {j.nombre && <Typography.Text type="secondary">{j.nombre}</Typography.Text>}
        </Space>
      )
    },
    { title: "Apertura", dataIndex: "hora_apertura", render: (h) => h ?? "—" },
    { title: "Shows", dataIndex: "cantidad_presentaciones", align: "right" },
    { title: "Tarifas", dataIndex: "cantidad_tarifas", align: "right", responsive: ["md"] },
    ...(soloLectura
      ? []
      : [
          {
            title: "Acciones",
            key: "acciones",
            align: "right",
            render: (_, j) => (
              <Space>
                <Tooltip title="Editar">
                  <Button icon={<EditOutlined />} onClick={() => setModal({ abierto: true, jornada: j })} />
                </Tooltip>
                <Popconfirm
                  title="Eliminar jornada"
                  description={
                    j.cantidad_presentaciones + j.cantidad_tarifas > 0
                      ? `Se borran también sus ${j.cantidad_presentaciones} shows y ${j.cantidad_tarifas} tarifas. ¿Seguro?`
                      : "¿Seguro?"
                  }
                  okText="Eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => eliminar(j)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ])
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Cada jornada es un día del evento. Cada una tiene su line-up y sus tarifas; el abono vale para todas.
        </Typography.Text>
        {!soloLectura && (
          <Tooltip title={quedanDias ? undefined : "Ya hay una jornada por cada día del evento. Para sumar días, cambiá las fechas en Datos"}>
            <Button icon={<PlusOutlined />} disabled={!quedanDias} onClick={() => setModal({ abierto: true, jornada: null })}>
              Agregar jornada
            </Button>
          </Tooltip>
        )}
      </div>
      <Table
        rowKey="id_jornada"
        columns={columnas}
        dataSource={evento.jornadas}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: <Empty description="Sin jornadas: agregá al menos una" /> }}
      />
      {modal.abierto && (
        <JornadaModal
          evento={evento}
          jornada={modal.jornada}
          onCerrar={() => setModal({ abierto: false, jornada: null })}
          onGuardado={() => {
            setModal({ abierto: false, jornada: null });
            onCambio();
          }}
        />
      )}
    </>
  );
}

export default PasoJornadas;
