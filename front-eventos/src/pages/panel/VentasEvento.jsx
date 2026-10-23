import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { Alert, Button, Card, Col, Empty, Progress, Result, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { EditOutlined, ScanOutlined } from "@ant-design/icons";
import { obtenerVentasEvento } from "../../services/panelService.js";
import { useCarga } from "../../hooks/useCarga.js";
import { diaCorto, numero, pesos } from "../../utils/formato.js";
import Encabezado from "../../components/Encabezado.jsx";
import TagEstado from "../../components/TagEstado.jsx";
import Cargando from "../../components/Cargando.jsx";
import { PANEL } from "../../tema.js";

const VIOLETA = PANEL.violeta;
const VERDE = PANEL.ok;
const MEDIO = { credito: "Crédito", debito: "Débito", transferencia: "Transferencia" };

// Barra con "vendidas de capacidad" (o "ingresaron de entradas") y el número al lado
function Medidor({ valor, total, color, detalle }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <Typography.Text style={{ fontVariantNumeric: "tabular-nums" }}>
          <b>{numero(valor)}</b> <Typography.Text type="secondary">de {numero(total)}</Typography.Text>
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>{detalle ?? `${Math.round(pct)} %`}</Typography.Text>
      </div>
      <Progress percent={pct} showInfo={false} strokeColor={color} size="small" />
    </div>
  );
}

// /panel/eventos/:id/ventas — ventas, ocupación y asistencia de un evento (fase 7)
function VentasEvento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ventas = useCarga(() => obtenerVentasEvento(id), id, "No se pudieron cargar las ventas");

  if (ventas.cargando) return <Cargando texto="Cargando ventas…" />;
  if (ventas.error) {
    return (
      <Result
        status="404"
        title="Evento no encontrado"
        subTitle={ventas.error}
        extra={[
          <Button key="reintentar" onClick={ventas.recargar}>Reintentar</Button>,
          <Button key="volver" type="primary" onClick={() => navigate("/panel/eventos")}>Volver a eventos</Button>
        ]}
      />
    );
  }

  const v = ventas.datos;
  const dias = [...new Set(v.ocupacion.map((o) => o.fecha))];

  return (
    <div className="pila">
      <Encabezado
        volver={{ a: "/panel/eventos", texto: "Eventos" }}
        titulo={`Ventas · ${v.evento.nombre}`}
        estado={v.evento.estado}
        acciones={
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/panel/eventos/${id}`)}>Armado del evento</Button>
            <Button icon={<ScanOutlined />} onClick={() => navigate(`/panel/acceso?evento=${id}`)}>Control de acceso</Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="Entradas vendidas" value={v.entradas} groupSeparator="." />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              En {v.compras} {v.compras === 1 ? "compra" : "compras"}
              {v.rechazadas > 0 && ` · ${v.rechazadas} rechazadas`}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="Para la productora" value={v.subtotal} formatter={pesos} styles={{ content: { color: PANEL.violetaTexto, fontWeight: 700 } }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Subtotal de las entradas</Typography.Text>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="Cargo por servicio" value={v.service_charge} formatter={pesos} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Para Backstage</Typography.Text>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="Cobrado al público" value={v.total} formatter={pesos} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Subtotal + cargo por servicio</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Ocupación por día y sector" style={{ height: "100%" }}>
            {dias.length === 0 ? (
              <Empty description="Todavía no hay tarifas activas" />
            ) : (
              <Space orientation="vertical" size={20} style={{ width: "100%" }}>
                {dias.map((d) => (
                  <div key={d}>
                    <Typography.Text strong style={{ textTransform: "capitalize" }}>{diaCorto(d)}</Typography.Text>
                    <Space orientation="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
                      {v.ocupacion
                        .filter((o) => o.fecha === d)
                        .map((o) => (
                          <div key={o.id_espacio}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{o.espacio}</Typography.Text>
                            <Medidor valor={o.vendidas} total={o.capacidad} color={VIOLETA} detalle={o.disponibles === 0 ? "Agotado" : `Quedan ${numero(o.disponibles)}`} />
                          </div>
                        ))}
                    </Space>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Asistencia"
            style={{ height: "100%" }}
            extra={<Button type="link" icon={<ScanOutlined />} onClick={() => navigate(`/panel/acceso?evento=${id}`)}>Controlar</Button>}
          >
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
              Entradas que valen para cada día (las del día más los abonos) y cuántas ya ingresaron.
            </Typography.Paragraph>
            <Space orientation="vertical" size={14} style={{ width: "100%" }}>
              {v.asistencia.map((a) => (
                <div key={a.id_jornada}>
                  <Typography.Text strong style={{ textTransform: "capitalize" }}>{diaCorto(a.fecha)}</Typography.Text>
                  <Medidor valor={a.ingresos} total={a.entradas} color={VERDE} detalle={`${numero(a.entradas - a.ingresos)} por entrar`} />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Por tarifa">
        <Table
          rowKey="id_tarifa"
          size="small"
          pagination={false}
          scroll={{ x: "max-content" }}
          dataSource={v.por_tarifa}
          locale={{ emptyText: <Empty description="Sin tarifas" /> }}
          columns={[
            {
              title: "Sector y tarifa",
              key: "tarifa",
              render: (_, t) => (
                <Space orientation="vertical" size={0}>
                  <Typography.Text strong>{t.espacio}</Typography.Text>
                  <Typography.Text type="secondary">{t.nombre}{!t.activa && " · inactiva"}</Typography.Text>
                </Space>
              )
            },
            {
              title: "Vale para",
              key: "para",
              render: (_, t) => (t.id_jornada ? <span style={{ textTransform: "capitalize" }}>{diaCorto(t.fecha)}</span> : <Tag color="purple">Abono</Tag>)
            },
            { title: "Precio", dataIndex: "precio", align: "right", render: (p) => <span style={{ whiteSpace: "nowrap" }}>{pesos(p)}</span> },
            { title: "Vendidas", dataIndex: "vendidas", align: "right", render: numero },
            { title: "Importe", dataIndex: "importe", align: "right", render: (p) => <b style={{ whiteSpace: "nowrap" }}>{pesos(p)}</b> }
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Ventas por día" style={{ height: "100%" }}>
            <Table
              rowKey="dia"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              dataSource={v.por_dia}
              locale={{ emptyText: <Empty description="Todavía no hay ventas" /> }}
              columns={[
                { title: "Día", dataIndex: "dia", render: (d) => dayjs(d).format("DD/MM/YYYY") },
                { title: "Compras", dataIndex: "compras", align: "right" },
                { title: "Entradas", dataIndex: "entradas", align: "right" },
                { title: "Importe", dataIndex: "importe", align: "right", render: (p) => <span style={{ whiteSpace: "nowrap" }}>{pesos(p)}</span> }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Últimas compras" style={{ height: "100%" }}>
            {v.rechazadas > 0 && (
              <Alert type="info" showIcon style={{ marginBottom: 12 }} title="Las compras rechazadas no generan entradas ni cuentan en los totales" />
            )}
            <Table
              rowKey="id_compra"
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
              dataSource={v.ultimas_compras}
              locale={{ emptyText: <Empty description="Todavía no hay compras" /> }}
              columns={[
                { title: "Cuándo", dataIndex: "fecha", render: (f) => <span style={{ whiteSpace: "nowrap" }}>{dayjs(f).format("DD/MM HH:mm")}</span> },
                { title: "Entradas", dataIndex: "cantidad", align: "right" },
                { title: "Medio", dataIndex: "medio_pago", render: (m) => MEDIO[m] ?? m },
                { title: "Importe", dataIndex: "subtotal", align: "right", render: (p) => <span style={{ whiteSpace: "nowrap" }}>{pesos(p)}</span> },
                { title: "Estado", dataIndex: "estado", render: (e) => <TagEstado tipo="compra" estado={e} /> }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default VentasEvento;
