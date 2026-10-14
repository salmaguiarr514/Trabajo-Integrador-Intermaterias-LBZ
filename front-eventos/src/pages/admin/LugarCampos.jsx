import { Col, Form, Input, Row, Select } from "antd";
import { TIPOS_LUGAR } from "../../utils/estados.js";

// Campos de un lugar, compartidos entre el alta (modal) y la pestaña Datos del detalle.
// Para mostrarlos en solo lectura se usa <Form disabled>.
function LugarCampos() {
  const obligatorio = (mensaje) => [{ required: true, whitespace: true, message: mensaje }];

  return (
    <Row gutter={16}>
      <Col xs={24} md={16}>
        <Form.Item name="nombre" label="Nombre" rules={obligatorio("El nombre es obligatorio")}>
          <Input maxLength={150} placeholder="Ej: Estadio Mario Alberto Kempes" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="tipo" label="Tipo" rules={[{ required: true, message: "Elegí un tipo" }]}>
          <Select options={TIPOS_LUGAR} placeholder="Elegí" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item name="direccion" label="Dirección" rules={obligatorio("La dirección es obligatoria")}>
          <Input maxLength={200} placeholder="Av. Cárcano s/n" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="ciudad" label="Ciudad" rules={obligatorio("La ciudad es obligatoria")}>
          <Input maxLength={100} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="provincia" label="Provincia" rules={obligatorio("La provincia es obligatoria")}>
          <Input maxLength={100} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item name="imagen_url" label="URL de una imagen" rules={[{ type: "url", message: "No es una URL válida" }]}>
          <Input maxLength={300} placeholder="https://..." />
        </Form.Item>
      </Col>
    </Row>
  );
}

export default LugarCampos;
