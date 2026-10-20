import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, App, Button, Checkbox, Empty, Space, Tag, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { reemplazarEscenarios } from "../../../services/panelService.js";
import { mensajeDeError } from "../../../services/api.js";

// Qué escenarios del lugar usa el evento (RN-16). Un escenario con shows no se puede sacar.
function PasoEscenarios({ evento, soloLectura, onCambio }) {
  const { message } = App.useApp();
  const [elegidos, setElegidos] = useState(() => evento.escenarios.filter((s) => s.habilitado).map((s) => s.id_escenario));
  const [guardando, setGuardando] = useState(false);

  const shows = (idEscenario) => evento.presentaciones.filter((p) => p.id_escenario === idEscenario).length;
  const original = evento.escenarios.filter((s) => s.habilitado).map((s) => s.id_escenario);
  const cambio = original.length !== elegidos.length || original.some((id) => !elegidos.includes(id));

  if (evento.escenarios.length === 0) {
    return (
      <Empty description="El lugar no tiene escenarios cargados">
        <Typography.Text type="secondary">
          Si es un lugar tuyo, agregalos en <Link to={`/panel/lugares/${evento.id_lugar}`}>Lugares</Link>.
        </Typography.Text>
      </Empty>
    );
  }

  const guardar = async () => {
    setGuardando(true);
    try {
      await reemplazarEscenarios(evento.id_evento, elegidos);
      message.success("Escenarios guardados");
      onCambio();
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudieron guardar los escenarios"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Text type="secondary">
        Marcá los escenarios de {evento.lugar} que vas a usar. Solo esos aparecen en el line-up.
      </Typography.Text>
      <Checkbox.Group value={elegidos} onChange={setElegidos} disabled={soloLectura} style={{ width: "100%" }}>
        <Space orientation="vertical" size={10}>
          {evento.escenarios.map((s) => {
            const cantidad = shows(s.id_escenario);
            return (
              <Checkbox key={s.id_escenario} value={s.id_escenario} disabled={cantidad > 0 && elegidos.includes(s.id_escenario)}>
                <Typography.Text strong>{s.nombre}</Typography.Text>
                {s.descripcion && <Typography.Text type="secondary"> · {s.descripcion}</Typography.Text>}
                {cantidad > 0 && <Tag style={{ marginLeft: 8 }}>{cantidad} {cantidad === 1 ? "show" : "shows"}</Tag>}
              </Checkbox>
            );
          })}
        </Space>
      </Checkbox.Group>
      {elegidos.length === 0 && <Alert type="warning" showIcon title="Sin escenarios no se puede armar el line-up" />}
      {!soloLectura && (
        <Button type="primary" icon={<SaveOutlined />} disabled={!cambio} loading={guardando} onClick={guardar}>
          Guardar escenarios
        </Button>
      )}
    </Space>
  );
}

export default PasoEscenarios;
