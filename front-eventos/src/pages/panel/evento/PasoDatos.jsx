import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Alert, App, Button, Col, DatePicker, Form, Input, Row, Segmented, Select } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { actualizarEvento, crearEvento } from "../../../services/panelService.js";
import { lugaresService } from "../../../services/lugaresService.js";
import { useCarga } from "../../../hooks/useCarga.js";
import { mostrarErrores } from "../../../utils/erroresForm.js";
import { numero } from "../../../utils/formato.js";

const lugares = lugaresService("panel");
const FORMATO = "YYYY-MM-DD";

// Un recital es de un día; un festival tiene un rango (una jornada por día, RN-19)
const valoresIniciales = (evento) =>
  evento
    ? {
        ...evento,
        fecha: dayjs(evento.fecha_inicio),
        rango: [dayjs(evento.fecha_inicio), dayjs(evento.fecha_fin)]
      }
    : { tipo: "recital" };

function PasoDatos({ evento, soloLectura, onCambio }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const tipo = Form.useWatch("tipo", form) ?? evento?.tipo ?? "recital";
  const opciones = useCarga(() => lugares.obtenerLugares(), "lugares", "No se pudieron cargar los lugares");

  // RN-21: con line-up o tarifas cargadas, el lugar ya no se cambia
  const lugarBloqueado = evento && (evento.cantidad_presentaciones > 0 || evento.cantidad_tarifas > 0);

  const grupo = (origen, etiqueta) => ({
    label: etiqueta,
    options: (opciones.datos ?? [])
      .filter((l) => l.origen === origen && (l.activo || l.id_lugar === evento?.id_lugar))
      .map((l) => ({
        value: l.id_lugar,
        label: `${l.nombre} · ${l.ciudad} (capacidad ${numero(l.capacidad_total)})`
      }))
  });

  const guardar = async ({ fecha, rango, ...valores }) => {
    const [desde, hasta] = valores.tipo === "festival" ? rango : [fecha, fecha];
    const datos = { ...valores, fecha_inicio: desde.format(FORMATO), fecha_fin: hasta.format(FORMATO) };
    setGuardando(true);
    setErrorApi("");
    try {
      if (evento) {
        await actualizarEvento(evento.id_evento, datos);
        message.success("Datos guardados");
        onCambio();
      } else {
        const { data } = await crearEvento(datos);
        message.success("Evento creado en borrador, con una jornada por día y todos los escenarios del lugar");
        navigate(`/panel/eventos/${data.id_evento}?paso=1`);
      }
    } catch (error) {
      mostrarErrores(form, error, setErrorApi, "No se pudo guardar el evento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={guardar}
        requiredMark="optional"
        disabled={soloLectura}
        initialValues={valoresIniciales(evento)}
        style={{ maxWidth: 760 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="nombre" label="Nombre" rules={[{ required: true, whitespace: true, message: "El nombre es obligatorio" }]}>
              <Input maxLength={150} placeholder="Ej: Punilla Rock Fest 2027" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="tipo" label="Tipo">
              <Segmented options={[{ value: "recital", label: "Recital" }, { value: "festival", label: "Festival" }]} block />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="id_lugar"
              label="Lugar"
              rules={[{ required: true, message: "Elegí dónde se hace" }]}
              extra={
                lugarBloqueado
                  ? "Ya tiene line-up o tarifas: para cambiar el lugar, primero sacalos"
                  : "Podés usar los lugares de la plataforma o los tuyos (se cargan en Lugares)"
              }
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Elegí un lugar"
                loading={opciones.cargando}
                disabled={lugarBloqueado}
                options={[grupo("propio", "Mis lugares"), grupo("plataforma", "De la plataforma")].filter((g) => g.options.length > 0)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            {tipo === "festival" ? (
              <Form.Item
                name="rango"
                label="Fechas"
                rules={[{ required: true, message: "Elegí el primer y el último día" }]}
                extra={evento ? "Si cambiás el rango, revisá las jornadas en el paso siguiente" : "Se crea una jornada por día"}
              >
                <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            ) : (
              <Form.Item name="fecha" label="Fecha" rules={[{ required: true, message: "Elegí la fecha" }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            )}
          </Col>
          <Col span={24}>
            <Form.Item name="descripcion" label="Descripción" extra="Se muestra en la página del evento">
              <Input.TextArea rows={3} maxLength={5000} showCount />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="imagen_url" label="URL de una imagen (flyer)" rules={[{ type: "url", message: "No es una URL válida" }]}>
              <Input maxLength={300} placeholder="https://..." />
            </Form.Item>
          </Col>
        </Row>
        {!soloLectura && (
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={guardando}>
            {evento ? "Guardar datos" : "Crear evento"}
          </Button>
        )}
      </Form>
    </>
  );
}

export default PasoDatos;
