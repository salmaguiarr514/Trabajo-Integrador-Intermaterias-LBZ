import { useState } from "react";
import { Alert, App, Button, Card, Col, Descriptions, Form, Input, Row, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { actualizarMiEmpresa, obtenerMiEmpresa } from "../../services/panelService.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";
import { useAuth } from "../../context/auth.js";
import { useCarga } from "../../hooks/useCarga.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";

// Datos de la propia productora. El CUIT y el % de service charge (RN-05) los maneja el superadmin.
function MiProductora() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { actualizarUsuario } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const empresa = useCarga(obtenerMiEmpresa, "mi-empresa", "No se pudieron cargar los datos de la productora");

  if (empresa.cargando) return <Cargando />;
  if (empresa.error) return <Alert type="error" showIcon title={empresa.error} />;

  const guardar = async (valores) => {
    setGuardando(true);
    setErrorApi("");
    try {
      const { data } = await actualizarMiEmpresa(valores);
      empresa.setDatos(data);
      actualizarUsuario({ empresa: data.nombre });
      message.success("Datos guardados");
    } catch (error) {
      const campos = erroresPorCampo(error);
      if (Object.keys(campos).length > 0) {
        form.setFields(Object.entries(campos).map(([name, msg]) => ({ name, errors: [msg] })));
      } else {
        setErrorApi(mensajeDeError(error, "No se pudieron guardar los datos"));
      }
    } finally {
      setGuardando(false);
    }
  };

  const e = empresa.datos;

  return (
    <div className="pila" style={{ maxWidth: 760 }}>
      <Encabezado titulo="Mi productora" descripcion="Los datos de contacto que ven tus clientes en la cartelera." />

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2 }}
          items={[
            { label: "CUIT", children: e.cuit },
            { label: "Service charge", children: `${e.cargo_servicio_pct} % sobre cada venta` }
          ]}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Para cambiar el CUIT o el service charge, escribile al equipo de Backstage.
        </Typography.Text>
      </Card>

      <Card>
        {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={guardar} requiredMark="optional" initialValues={e}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="nombre" label="Nombre" rules={[{ required: true, whitespace: true, message: "El nombre es obligatorio" }]}>
                <Input maxLength={150} />
              </Form.Item>
            </Col>
            <Col xs={24} md={14}>
              <Form.Item name="email" label="Email de contacto" rules={[{ type: "email", message: "No es un email válido" }]}>
                <Input maxLength={150} />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item name="telefono" label="Teléfono">
                <Input maxLength={30} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="direccion" label="Dirección">
                <Input maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="logo_url" label="URL del logo" rules={[{ type: "url", message: "No es una URL válida" }]}>
                <Input maxLength={300} placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={guardando}>
            Guardar cambios
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default MiProductora;
