import { useState } from "react";
import { Alert, App, Col, Form, Input, Modal, Row, Select, Switch } from "antd";
import { actualizarUsuario, crearUsuario } from "../../services/adminService.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";

const ROLES = [
  { value: "empresa", label: "Productora (personal de una productora)" },
  { value: "superadmin", label: "Superadmin (equipo de Backstage)" }
];

// Alta y edición de usuarios superadmin y de productoras.
// usuario: null para crear, o el usuario a editar. empresas: para elegir la productora.
// Se monta solo mientras está abierto, así cada vez arranca limpio.
function UsuarioModal({ usuario, empresas, esUnoMismo, onCerrar, onGuardado }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const rol = Form.useWatch("rol", form);
  const editando = Boolean(usuario);

  const guardar = async (valores) => {
    const datos = {
      ...valores,
      id_empresa: valores.rol === "empresa" ? valores.id_empresa : null,
      password: valores.password || undefined // en la edición, vacía = no se cambia
    };
    setGuardando(true);
    setErrorApi("");
    try {
      const { data } = editando ? await actualizarUsuario(usuario.id_usuario, datos) : await crearUsuario(datos);
      message.success(editando ? "Usuario actualizado" : "Usuario creado");
      onGuardado(data);
    } catch (error) {
      const campos = erroresPorCampo(error);
      if (Object.keys(campos).length > 0) {
        form.setFields(Object.entries(campos).map(([name, msg]) => ({ name, errors: [msg] })));
      } else {
        setErrorApi(mensajeDeError(error, "No se pudo guardar el usuario"));
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open
      title={editando ? `Editar a ${usuario.nombre}` : "Nuevo usuario"}
      okText={editando ? "Guardar cambios" : "Crear usuario"}
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
        initialValues={usuario ? { ...usuario, password: "" } : { rol: "empresa", activo: true }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="nombre" label="Nombre" rules={[{ required: true, whitespace: true, message: "El nombre es obligatorio" }]}>
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="apellido" label="Apellido">
              <Input maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Ingresá un email válido" }]}>
              <Input maxLength={150} autoComplete="off" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="password"
              label={editando ? "Nueva contraseña" : "Contraseña"}
              extra={editando ? "Dejala vacía para no cambiarla" : "Mínimo 6 caracteres. Pasásela al usuario por privado."}
              rules={[
                { required: !editando, message: "La contraseña es obligatoria" },
                { min: 6, message: "Mínimo 6 caracteres" }
              ]}
            >
              <Input.Password maxLength={72} autoComplete="new-password" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="dni" label="DNI" rules={[{ pattern: /^\d{7,10}$/, message: "Solo números (7 a 10)" }]}>
              <Input maxLength={10} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="telefono" label="Teléfono">
              <Input maxLength={30} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="rol" label="Rol" rules={[{ required: true }]}>
              <Select options={ROLES} disabled={esUnoMismo} />
            </Form.Item>
          </Col>
          {rol === "empresa" && (
            <Col xs={24} md={12}>
              <Form.Item name="id_empresa" label="Productora" rules={[{ required: true, message: "Elegí la productora" }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Elegí una productora"
                  options={empresas.map((e) => ({ value: e.id_empresa, label: e.activo ? e.nombre : `${e.nombre} (inactiva)` }))}
                />
              </Form.Item>
            </Col>
          )}
          {editando && (
            <Col xs={24} md={12}>
              <Form.Item name="activo" label="Activo" valuePropName="checked" required>
                <Switch disabled={esUnoMismo} />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
}

export default UsuarioModal;
