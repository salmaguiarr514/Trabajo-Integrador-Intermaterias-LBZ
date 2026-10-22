import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Alert, Button, Card, Col, Empty, Input, Row, Select, Space, Tag, Typography } from "antd";
import { CheckCircleFilled, CloseCircleFilled, ScanOutlined } from "@ant-design/icons";
import { obtenerEvento, obtenerEventos, obtenerVentasEvento, validarEntrada } from "../../services/panelService.js";
import { mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import { diaCorto, numero } from "../../utils/formato.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";
import { PANEL } from "../../tema.js";

const VERDE = PANEL.ok;
const ROJO = PANEL.error;

// La jornada que conviene controlar: la de hoy, o la próxima, o la última
const jornadaSugerida = (jornadas) => {
  const hoy = dayjs().format("YYYY-MM-DD");
  return (jornadas.find((j) => j.fecha === hoy) ?? jornadas.find((j) => j.fecha > hoy) ?? jornadas[jornadas.length - 1])?.id_jornada;
};

// El cartel grande que ve la persona de la puerta
function Veredicto({ resultado }) {
  if (!resultado) {
    return (
      <div style={{ textAlign: "center", padding: "40px 16px" }}>
        <ScanOutlined style={{ fontSize: 56, opacity: 0.4 }} />
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          Escaneá el QR de la entrada o pegá el código.
        </Typography.Paragraph>
      </div>
    );
  }
  const ok = resultado.valida;
  const color = ok ? VERDE : ROJO;
  return (
    <div
      role="status"
      style={{ textAlign: "center", padding: "28px 16px", borderRadius: 12, background: `${color}22`, border: `2px solid ${color}` }}
    >
      {ok ? <CheckCircleFilled style={{ fontSize: 64, color }} /> : <CloseCircleFilled style={{ fontSize: 64, color }} />}
      <Typography.Title level={1} style={{ color, margin: "8px 0 4px", letterSpacing: 2 }}>{ok ? "ADELANTE" : "NO PASA"}</Typography.Title>
      {ok ? (
        <Space orientation="vertical" size={2}>
          <Typography.Text style={{ fontSize: 20 }} strong>{resultado.espacio}</Typography.Text>
          <Typography.Text type="secondary">
            {resultado.abono ? "Abono" : "Entrada del día"} · {resultado.tarifa} · {resultado.titular}
          </Typography.Text>
        </Space>
      ) : (
        <Typography.Text style={{ fontSize: 18 }}>{resultado.mensaje}</Typography.Text>
      )}
    </div>
  );
}

// /panel/acceso — control de acceso en la puerta (fase 7, RN-24).
// Un lector de QR de mano funciona como teclado: escribe el código y aprieta Enter.
function ControlAcceso() {
  const [params, setParams] = useSearchParams();
  const eventos = useCarga(obtenerEventos, "eventos", "No se pudieron cargar los eventos");
  const idEvento = Number(params.get("evento")) || null;
  const detalle = useCarga(() => (idEvento ? obtenerEvento(idEvento) : Promise.resolve({ data: false })), idEvento, "No se pudo cargar el evento");
  const [idJornada, setIdJornada] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [contador, setContador] = useState(null); // { ingresos, entradas } de la jornada
  const campo = useRef(null);

  const jornadas = detalle.datos ? detalle.datos.jornadas : [];
  const jornada = jornadas.find((j) => j.id_jornada === idJornada) ?? jornadas.find((j) => j.id_jornada === jornadaSugerida(jornadas));

  // Al cambiar de evento o jornada: el contador de esa jornada (de la asistencia del evento)
  useEffect(() => {
    if (!idEvento || !jornada) return;
    let vigente = true;
    obtenerVentasEvento(idEvento)
      .then(({ data }) => {
        const a = data.asistencia.find((x) => x.id_jornada === jornada.id_jornada);
        if (vigente && a) setContador({ ingresos: a.ingresos, entradas: a.entradas });
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [idEvento, jornada?.id_jornada]); // eslint-disable-line react-hooks/exhaustive-deps

  if (eventos.cargando) return <Cargando />;
  if (eventos.error) return <Alert type="error" showIcon title={eventos.error} />;

  // Solo tiene sentido controlar eventos que se venden
  const opcionesEventos = eventos.datos
    .filter((e) => ["publicado", "agotado"].includes(e.estado))
    .map((e) => ({ value: e.id_evento, label: `${e.nombre} · ${e.lugar}` }));

  const elegirEvento = (id) => {
    setParams({ evento: String(id) }, { replace: true });
    setIdJornada(null);
    setResultado(null);
    setContador(null);
  };

  const validar = async () => {
    const texto = codigo.trim();
    if (!texto || !jornada) return;
    setValidando(true);
    try {
      const { data } = await validarEntrada(texto, jornada.id_jornada);
      setResultado(data);
      setContador({ ingresos: data.ingresos, entradas: data.entradas });
      setHistorial((h) => [{ hora: data.hora, ok: true, texto: `${data.espacio} · ${data.titular}`, codigo: texto }, ...h].slice(0, 12));
    } catch (error) {
      const mensaje = mensajeDeError(error, "No se pudo validar la entrada");
      setResultado({ valida: false, mensaje });
      setHistorial((h) => [{ hora: dayjs().format("HH:mm"), ok: false, texto: mensaje, codigo: texto }, ...h].slice(0, 12));
    } finally {
      setValidando(false);
      setCodigo("");
      campo.current?.focus();
    }
  };

  return (
    <div className="pila">
      <Encabezado titulo="Control de acceso" descripcion="Para la puerta: elegí el evento y el día, y escaneá cada entrada." />

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Typography.Text type="secondary">Evento</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 4 }}
              placeholder="Elegí el evento"
              value={idEvento ?? undefined}
              onChange={elegirEvento}
              options={opcionesEventos}
              notFoundContent="No tenés eventos publicados"
            />
          </Col>
          <Col xs={24} md={10}>
            <Typography.Text type="secondary">Día que se controla</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 4 }}
              placeholder="Elegí el día"
              disabled={!jornada}
              value={jornada?.id_jornada}
              onChange={(v) => {
                setIdJornada(v);
                setResultado(null);
                setContador(null);
              }}
              options={jornadas.map((j) => ({
                value: j.id_jornada,
                label: `${diaCorto(j.fecha)}${j.fecha === dayjs().format("YYYY-MM-DD") ? " (hoy)" : ""}${j.nombre ? ` · ${j.nombre}` : ""}`
              }))}
            />
          </Col>
        </Row>
      </Card>

      {!idEvento ? (
        <Card>
          <Empty description="Elegí un evento para empezar" />
        </Card>
      ) : detalle.cargando ? (
        <Cargando />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Card>
              <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
                <Input
                  ref={campo}
                  size="large"
                  autoFocus
                  allowClear
                  prefix={<ScanOutlined />}
                  placeholder="Código de la entrada"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onPressEnter={validar}
                  disabled={!jornada}
                  aria-label="Código de la entrada"
                />
                <Button size="large" type="primary" loading={validando} disabled={!codigo.trim() || !jornada} onClick={validar}>
                  Validar
                </Button>
              </Space.Compact>
              <Veredicto resultado={resultado} />
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card title={jornada ? <span style={{ textTransform: "capitalize" }}>{diaCorto(jornada.fecha)}</span> : "Jornada"}>
              {contador ? (
                <div style={{ textAlign: "center" }}>
                  <Typography.Title level={2} style={{ margin: 0, fontVariantNumeric: "tabular-nums" }}>
                    {numero(contador.ingresos)} <Typography.Text type="secondary" style={{ fontSize: 18 }}>/ {numero(contador.entradas)}</Typography.Text>
                  </Typography.Title>
                  <Typography.Text type="secondary">ingresaron de las entradas que valen para este día</Typography.Text>
                </div>
              ) : (
                <Typography.Text type="secondary">Cargando el contador…</Typography.Text>
              )}
            </Card>
            <Card title="Últimos controles" style={{ marginTop: 16 }}>
              {historial.length === 0 ? (
                <Typography.Text type="secondary">Todavía no controlaste entradas.</Typography.Text>
              ) : (
                <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                  {historial.map((h, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <Typography.Text type="secondary" style={{ fontVariantNumeric: "tabular-nums", flex: "none" }}>{h.hora}</Typography.Text>
                      <Tag color={h.ok ? "green" : "red"} style={{ marginInlineEnd: 0, flex: "none" }}>{h.ok ? "Pasó" : "No pasó"}</Tag>
                      <Typography.Text ellipsis={{ tooltip: h.codigo }} style={{ minWidth: 0 }}>{h.texto}</Typography.Text>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default ControlAcceso;
