import { useState } from "react";
import { Alert, App, Col, Form, Input, Modal, Row, Switch } from "antd";
import { actualizarArtista, crearArtista } from "../../services/panelService.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";

// Alta y edición de un artista de la productora. artista: null para crear.
// Se monta solo mientras está abierto, así cada vez arranca limpio.
function ArtistaModal({ artista, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const editando = Boolean(artista);

  const guardar = async (valores) => {
    setGuardando(true);
    setErrorApi("");
    try {
      const { data } = editando ? await actualizarArtista(artista.id_artista, valores) : await crearArtista(valores);
      message.success(editando ? "Artista actualizado" : "Artista creado");
      onGuardado(data);
    } catch (error) {
      const campos = erroresPorCampo(error);
      if (Object.keys(campos).length > 0) {
        form.setFields(Object.entries(campos).map(([name, msg]) => ({ name, errors: [msg] })));
      } else {
        setErrorApi(mensajeDeError(error, "No se pudo guardar el artista"));
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      title={editando ? `Editar ${artista.nombre}` : "Nuevo artista"}
      okText={editando ? "Guardar cambios" : "Crear artista"}
      cancelText="Cancelar"
      confirmLoading={guardando}
      onOk={() => form.submit()}
      onCancel={onCerrar}
      width={640}
    >
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={guardar}
        requiredMark="optional"
        initialValues={artista ?? { activo: true }}
      >
        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, whitespace: true, message: "El nombre es obligatorio" }]}>
          <Input maxLength={150} placeholder="Ej: Los Caligaris" />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="genero" label="Género">
              <Input maxLength={60} placeholder="Ej: Rock, Indie, Trap" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="pais" label="País">
              <Input maxLength={60} placeholder="Ej: Argentina" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="bio" label="Bio" extra="Se va a mostrar en la página del artista en la cartelera">
          <Input.TextArea maxLength={2000} rows={3} showCount />
        </Form.Item>
        <Form.Item name="imagen_url" label="URL de una foto" rules={[{ type: "url", message: "No es una URL válida" }]}>
          <Input maxLength={300} placeholder="https://..." />
        </Form.Item>
        {editando && (
          <Form.Item
            name="activo"
            label="Activo"
            valuePropName="checked"
            required
            extra="Un artista dado de baja no se puede sumar a eventos nuevos"
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default ArtistaModal;
