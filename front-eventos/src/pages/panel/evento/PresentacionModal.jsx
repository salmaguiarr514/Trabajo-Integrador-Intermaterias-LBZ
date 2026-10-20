import { useState } from "react";
import dayjs from "dayjs";
import { Alert, App, Button, Col, Form, Modal, Popconfirm, Row, Select, Switch, TimePicker, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { actualizarParteEvento, crearParteEvento, eliminarParteEvento } from "../../../services/panelService.js";
import { mensajeDeError } from "../../../services/api.js";
import { mostrarErrores } from "../../../utils/erroresForm.js";
import { diaCorto } from "../../../utils/formato.js";
import { calcularHorario, MADRUGADA } from "../../../utils/horarios.js";

// presentacion: null para crear. escenarioInicial: el de la columna donde se tocó "+".
function PresentacionModal({ evento, jornada, presentacion, escenarioInicial, artistas, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const inicio = Form.useWatch("inicio", form);
  const fin = Form.useWatch("fin", form);
  const horario = calcularHorario(jornada.fecha, inicio, fin);

  const habilitados = evento.escenarios.filter((s) => s.habilitado);
  const opcionesArtistas = artistas
    .filter((a) => a.activo || a.id_artista === presentacion?.id_artista)
    .map((a) => ({ value: a.id_artista, label: a.genero ? `${a.nombre} · ${a.genero}` : a.nombre }));

  const guardar = async (v) => {
    const datos = {
      id_jornada: jornada.id_jornada,
      id_escenario: v.id_escenario,
      id_artista: v.id_artista,
      inicio: horario.inicio,
      fin: horario.fin,
      headliner: Boolean(v.headliner)
    };
    setGuardando(true);
    setErrorApi("");
    try {
      if (presentacion) await actualizarParteEvento(evento.id_evento, "presentaciones", presentacion.id_presentacion, datos);
      else await crearParteEvento(evento.id_evento, "presentaciones", datos);
      message.success(presentacion ? "Show actualizado" : "Show agregado al line-up");
      onGuardado();
    } catch (error) {
      // Una superposición (409) llega con un mensaje que dice con quién choca: va arriba, bien visible
      mostrarErrores(form, error, setErrorApi, "No se pudo guardar el show");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    try {
      await eliminarParteEvento(evento.id_evento, "presentaciones", presentacion.id_presentacion);
      message.success("Show eliminado");
      onGuardado();
    } catch (error) {
      setErrorApi(mensajeDeError(error, "No se pudo eliminar el show"));
    }
  };

  return (
    <Modal
      open
      title={`${presentacion ? "Editar show" : "Nuevo show"} · ${diaCorto(jornada.fecha)}`}
      onCancel={onCerrar}
      footer={[
        presentacion && (
          <Popconfirm key="borrar" title="¿Sacar este show del line-up?" okText="Sacar" cancelText="Cancelar" okButtonProps={{ danger: true }} onConfirm={eliminar}>
            <Button danger icon={<DeleteOutlined />} style={{ float: "left" }}>Sacar del line-up</Button>
          </Popconfirm>
        ),
        <Button key="cancelar" onClick={onCerrar}>Cancelar</Button>,
        <Button key="guardar" type="primary" loading={guardando} onClick={() => form.submit()}>Guardar</Button>
      ]}
    >
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={guardar}
        requiredMark="optional"
        initialValues={
          presentacion
            ? {
                id_artista: presentacion.id_artista,
                id_escenario: presentacion.id_escenario,
                inicio: dayjs(presentacion.inicio),
                fin: dayjs(presentacion.fin),
                headliner: presentacion.headliner
              }
            : { id_escenario: escenarioInicial ?? habilitados[0]?.id_escenario, headliner: false }
        }
      >
        <Form.Item name="id_artista" label="Artista" rules={[{ required: true, message: "Elegí el artista" }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Elegí uno de tus artistas"
            options={opcionesArtistas}
            notFoundContent="No hay artistas: cargalos en Artistas"
          />
        </Form.Item>
        <Form.Item name="id_escenario" label="Escenario" rules={[{ required: true, message: "Elegí el escenario" }]}>
          <Select options={habilitados.map((s) => ({ value: s.id_escenario, label: s.nombre }))} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="inicio" label="Empieza" rules={[{ required: true, message: "¿A qué hora?" }]}>
              <TimePicker format="HH:mm" minuteStep={5} needConfirm={false} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="fin" label="Termina" rules={[{ required: true, message: "¿A qué hora?" }]}>
              <TimePicker format="HH:mm" minuteStep={5} needConfirm={false} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        {horario && (
          <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
            Del {diaCorto(horario.inicio)} {horario.desde.format("HH:mm")} al {diaCorto(horario.fin)} {horario.hasta.format("HH:mm")}
            {" "}({horario.hasta.diff(horario.desde, "minute")} min). Antes de las {MADRUGADA}:00 cuenta como la madrugada siguiente.
          </Typography.Paragraph>
        )}
        <Form.Item name="headliner" label="Cierre / headliner" valuePropName="checked" required extra="Se destaca en la cartelera">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default PresentacionModal;
