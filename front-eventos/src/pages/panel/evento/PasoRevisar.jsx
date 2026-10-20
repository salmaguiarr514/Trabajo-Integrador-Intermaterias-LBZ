import { useState } from "react";
import { Alert, App, Button, Card, Descriptions, Popconfirm, Space, Typography } from "antd";
import { CheckCircleFilled, CloseCircleFilled, EyeInvisibleOutlined, RocketOutlined, StopOutlined } from "@ant-design/icons";
import { cambiarEstadoEvento } from "../../../services/panelService.js";
import { mensajeDeError } from "../../../services/api.js";
import { numero, pesos, rangoFechas } from "../../../utils/formato.js";

// Lo que pide RN-20 para publicar, con el paso donde se arregla cada cosa
const requisitos = (e) => [
  { ok: e.jornadas.length > 0, texto: `${e.jornadas.length} ${e.jornadas.length === 1 ? "jornada" : "jornadas"}`, falta: "Al menos una jornada", paso: 1 },
  { ok: e.presentaciones.length > 0, texto: `${e.presentaciones.length} shows en el line-up`, falta: "Al menos un show en el line-up", paso: 3 },
  {
    ok: e.tarifas.some((t) => t.activa),
    texto: `${e.tarifas.filter((t) => t.activa).length} tarifas activas`,
    falta: "Al menos una tarifa activa",
    paso: 4
  }
];

function PasoRevisar({ evento, soloLectura, onCambio, irA }) {
  const { message } = App.useApp();
  const [cambiando, setCambiando] = useState(false);
  const lista = requisitos(evento);
  const listo = lista.every((r) => r.ok);
  const precios = evento.tarifas.filter((t) => t.activa).map((t) => t.precio);
  const headliners = evento.presentaciones.filter((p) => p.headliner).map((p) => p.artista);

  const cambiar = async (estado, texto) => {
    setCambiando(true);
    try {
      await cambiarEstadoEvento(evento.id_evento, estado);
      message.success(texto);
      onCambio();
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo cambiar el estado"));
    } finally {
      setCambiando(false);
    }
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <Descriptions
        size="small"
        column={{ xs: 1, md: 2 }}
        items={[
          { label: "Fechas", children: rangoFechas(evento.fecha_inicio, evento.fecha_fin) },
          { label: "Lugar", children: `${evento.lugar}, ${evento.ciudad}` },
          { label: "Cierres", children: headliners.length ? headliners.join(", ") : "—" },
          { label: "Precios", children: precios.length ? `${pesos(Math.min(...precios))} a ${pesos(Math.max(...precios))}` : "—" },
          { label: "Entradas vendidas", children: numero(evento.entradas_vendidas) }
        ]}
      />

      <Card size="small" title="Requisitos para publicar">
        <Space orientation="vertical" size={8} style={{ width: "100%" }}>
          {lista.map((r) => (
            <div key={r.paso} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <Space>
                {r.ok ? <CheckCircleFilled style={{ color: "#52c41a" }} /> : <CloseCircleFilled style={{ color: "#ff4d4f" }} />}
                <Typography.Text>{r.ok ? r.texto : r.falta}</Typography.Text>
              </Space>
              {!r.ok && !soloLectura && (
                <Button type="link" onClick={() => irA(r.paso)} style={{ paddingInline: 0 }}>
                  Completar
                </Button>
              )}
            </div>
          ))}
        </Space>
      </Card>

      {evento.estado === "borrador" && (
        <Alert
          type={listo ? "success" : "info"}
          showIcon
          title={listo ? "Está todo listo para publicar" : "Todavía es un borrador: nadie lo ve en la cartelera"}
          description={listo ? "Al publicarlo aparece en la cartelera y se empiezan a vender las entradas." : undefined}
        />
      )}
      {evento.estado === "publicado" && (
        <Alert type="success" showIcon title="Publicado: está en la cartelera" description={evento.cantidad_compras > 0 ? "Ya tiene ventas: no se puede despublicar." : undefined} />
      )}

      {!soloLectura && (
        <Space wrap>
          {evento.estado === "borrador" && (
            <Button type="primary" size="large" icon={<RocketOutlined />} disabled={!listo} loading={cambiando} onClick={() => cambiar("publicado", "¡Evento publicado!")}>
              Publicar
            </Button>
          )}
          {["publicado", "agotado"].includes(evento.estado) && evento.cantidad_compras === 0 && (
            <Popconfirm
              title="Despublicar"
              description="Sale de la cartelera y vuelve a borrador."
              okText="Despublicar"
              cancelText="Volver"
              onConfirm={() => cambiar("borrador", "Evento despublicado")}
            >
              <Button icon={<EyeInvisibleOutlined />} loading={cambiando}>Despublicar</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Cancelar el evento"
            description={
              evento.entradas_vendidas > 0
                ? `Tiene ${numero(evento.entradas_vendidas)} entradas vendidas. Cancelar no tiene vuelta atrás.`
                : "Cancelar no tiene vuelta atrás."
            }
            okText="Cancelar evento"
            cancelText="Volver"
            okButtonProps={{ danger: true }}
            onConfirm={() => cambiar("cancelado", "Evento cancelado")}
          >
            <Button danger icon={<StopOutlined />} loading={cambiando}>Cancelar evento</Button>
          </Popconfirm>
        </Space>
      )}
    </Space>
  );
}

export default PasoRevisar;
