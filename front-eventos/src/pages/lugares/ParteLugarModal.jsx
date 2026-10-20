import { useState } from "react";
import { Alert, App, ColorPicker, Form, Input, InputNumber, Modal, Segmented } from "antd";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";

const TEXTOS = {
  espacios: { nuevo: "Nuevo sector", editar: "Editar sector", creado: "Sector creado", guardado: "Sector actualizado" },
  escenarios: { nuevo: "Nuevo escenario", editar: "Editar escenario", creado: "Escenario creado", guardado: "Escenario actualizado" }
};

// Alta y edición de un sector (espacios) o de un escenario de un lugar.
// parte: null para crear, o la fila a editar. Se monta solo mientras está abierto.
// servicio: el de lugaresService según el ámbito (admin o panel)
function ParteLugarModal({ servicio, tipo, idLugar, parte, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const textos = TEXTOS[tipo];
  const esSector = tipo === "espacios";
  const id = parte && (esSector ? parte.id_espacio : parte.id_escenario);

  const guardar = async (valores) => {
    setGuardando(true);
    setErrorApi("");
    try {
      const { data } = id
        ? await servicio.actualizarParte(idLugar, tipo, id, valores)
        : await servicio.crearParte(idLugar, tipo, valores);
      message.success(id ? textos.guardado : textos.creado);
      onGuardado(data);
    } catch (error) {
      const campos = erroresPorCampo(error);
      if (Object.keys(campos).length > 0) {
        form.setFields(Object.entries(campos).map(([name, msg]) => ({ name, errors: [msg] })));
      } else {
        setErrorApi(mensajeDeError(error, "No se pudo guardar"));
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      title={id ? textos.editar : textos.nuevo}
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
        initialValues={parte ?? (esSector ? { modalidad: "de_pie" } : {})}
      >
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, whitespace: true, message: "El nombre es obligatorio" }]}>
          <Input maxLength={100} placeholder={esSector ? "Ej: Platea Norte, Campo, VIP" : "Ej: Principal, Alternativo"} />
        </Form.Item>

        {esSector ? (
          <>
            <Form.Item
              name="capacidad"
              label="Capacidad"
              extra="Es el cupo: lo máximo que se puede vender en este sector por jornada"
              rules={[{ required: true, message: "La capacidad es obligatoria" }]}
            >
              <InputNumber min={1} step={100} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="modalidad" label="Modalidad">
              <Segmented options={[{ value: "de_pie", label: "De pie" }, { value: "sentado", label: "Sentado" }]} />
            </Form.Item>
            <Form.Item
              name="color"
              label="Color en el plano"
              getValueFromEvent={(color) => (color ? color.toHexString() : null)}
            >
              <ColorPicker allowClear showText disabledAlpha format="hex" />
            </Form.Item>
          </>
        ) : (
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea maxLength={300} rows={2} placeholder="Ej: Carpa cerrada para música electrónica" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default ParteLugarModal;
