import { Card, Col, Empty, Progress, Row, Space, Table, Typography } from "antd";
import {
  DollarOutlined, FireOutlined, ShopOutlined, TagsOutlined, TeamOutlined, UserOutlined
} from "@ant-design/icons";
import { obtenerMetricas } from "../../services/adminService.js";
import { useCarga } from "../../hooks/useCarga.js";
import { mesAnio, numero, pesos } from "../../utils/formato.js";
import TagEstado from "../../components/TagEstado.jsx";
import { PANEL } from "../../tema.js";
import ErrorPanel from "../../components/ErrorPanel.jsx";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";
import Indicador from "../../components/Indicador.jsx";

const formatoPesos = { prefix: "$", groupSeparator: ".", decimalSeparator: ",", precision: 0 };

function Dashboard() {
  const { datos: m, cargando, error, recargar } = useCarga(obtenerMetricas, "metricas", "No se pudieron cargar las métricas");

  if (cargando) return <Cargando texto="Cargando métricas…" />;
  if (error) return <ErrorPanel mensaje={error} onReintentar={recargar} />;

  const maxProductora = Math.max(1, ...m.recaudacion_por_productora.map((p) => p.service_charge));

  return (
    <div className="pila">
      <Encabezado titulo="Inicio" descripcion="Cómo viene la plataforma. Solo cuentan las compras pagadas." />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Indicador
              title="Recaudación de Backstage (cargo por servicio)"
              value={m.service_charge_total}
              {...formatoPesos}
              prefix={<DollarOutlined />}
              styles={{ content: { color: PANEL.violetaTexto, fontWeight: 700 } }}
            />
            <Typography.Text type="secondary">
              Sobre {pesos(m.ventas_total)} vendidos en total (lo demás es de las productoras)
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ height: "100%" }}>
            <Indicador title="Entradas vendidas" value={m.entradas_vendidas} groupSeparator="." prefix={<TagsOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ height: "100%" }}>
            <Indicador title="Clientes registrados" value={m.clientes} groupSeparator="." prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Indicador
              title="Productoras activas"
              value={m.productoras_activas}
              suffix={`/ ${m.productoras_total}`}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={18}>
          <Card title={<><FireOutlined /> Eventos por estado</>} styles={{ body: { paddingBlock: 20 } }}>
            {m.eventos_por_estado.length === 0 ? (
              <Typography.Text type="secondary">Todavía no hay eventos</Typography.Text>
            ) : (
              <Space wrap>
                {m.eventos_por_estado.map((e) => (
                  <TagEstado key={e.estado} estado={e.estado} style={{ fontSize: 14, padding: "4px 10px" }}>
                    : <b>{e.cantidad}</b>
                  </TagEstado>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<><ShopOutlined /> Cargo por servicio de cada productora</>}>
            {m.recaudacion_por_productora.length === 0 ? (
              <Empty description="Todavía no hay ventas" />
            ) : (
              <Space orientation="vertical" size={14} style={{ width: "100%" }}>
                {m.recaudacion_por_productora.map((p) => (
                  <div key={p.id_empresa}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <Typography.Text strong>{p.productora}</Typography.Text>
                      <Typography.Text style={{ fontVariantNumeric: "tabular-nums" }}>{pesos(p.service_charge)}</Typography.Text>
                    </div>
                    <Progress
                      aria-label={`Cargo por servicio de ${p.productora}, comparado con la que más recaudó`}
                      percent={(p.service_charge / maxProductora) * 100}
                      showInfo={false}
                      strokeColor={PANEL.violeta}
                      size="small"
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {numero(p.compras)} {p.compras === 1 ? "compra" : "compras"} · {pesos(p.total)} vendidos
                    </Typography.Text>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><DollarOutlined /> Recaudación por mes</>}>
            <Table
              rowKey="mes"
              size="small"
              pagination={false}
              dataSource={m.recaudacion_por_mes}
              scroll={{ x: true }}
              locale={{ emptyText: <Empty description="Todavía no hay ventas" /> }}
              columns={[
                { title: "Mes", dataIndex: "mes", render: (mes) => mesAnio(mes) },
                { title: "Compras", dataIndex: "compras", align: "right" },
                { title: "Vendido", dataIndex: "total", align: "right", render: pesos },
                { title: "Cargo por servicio", dataIndex: "service_charge", align: "right", render: (v) => <b>{pesos(v)}</b> }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
