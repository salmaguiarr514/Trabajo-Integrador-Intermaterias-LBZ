import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Button, Card, Col, Empty, Row, Space, Statistic, Table, Typography } from "antd";
import { CalendarOutlined, DollarOutlined, EditOutlined, PlusOutlined, RocketOutlined, TagsOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/auth.js";
import { obtenerResumen } from "../../services/panelService.js";
import { useCarga } from "../../hooks/useCarga.js";
import { numero, pesos, rangoFechas } from "../../utils/formato.js";
import Encabezado from "../../components/Encabezado.jsx";
import TagEstado from "../../components/TagEstado.jsx";
import Cargando from "../../components/Cargando.jsx";
import { PANEL } from "../../tema.js";
import ErrorPanel from "../../components/ErrorPanel.jsx";

// Inicio del panel de la productora: cómo viene y qué tiene por delante
function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const resumen = useCarga(obtenerResumen, "resumen", "No se pudo cargar el resumen");

  const encabezado = (
    <Encabezado
      titulo={`Hola, ${usuario.nombre}`}
      descripcion={`Panel de ${usuario.empresa}`}
      acciones={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/panel/eventos/nuevo")}>
          Nuevo evento
        </Button>
      }
    />
  );

  if (resumen.cargando) return <Cargando texto="Cargando tu panel…" />;
  if (resumen.error) return <div className="pila">{encabezado}<ErrorPanel mensaje={resumen.error} onReintentar={resumen.recargar} /></div>;

  const r = resumen.datos;

  return (
    <div className="pila">
      {encabezado}

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="Publicados" value={r.publicados} prefix={<RocketOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="En borrador" value={r.borradores} prefix={<EditOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic title="Entradas vendidas" value={r.entradas_vendidas} groupSeparator="." prefix={<TagsOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ height: "100%" }}>
            <Statistic
              title="Recaudado"
              value={r.recaudado}
              precision={0}
              groupSeparator="."
              prefix={<DollarOutlined />}
              styles={{ content: { color: PANEL.violetaTexto, fontWeight: 700 } }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Sin el cargo por servicio</Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<><CalendarOutlined /> Próximos eventos</>} extra={<Button type="link" onClick={() => navigate("/panel/eventos")}>Ver todos</Button>}>
            {r.proximos.length === 0 ? (
              <Empty description="No tenés eventos por delante">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/panel/eventos/nuevo")}>Armar uno</Button>
              </Empty>
            ) : (
              <div>
                {r.proximos.map((e) => (
                  <Link key={e.id_evento} to={`/panel/eventos/${e.id_evento}`} className="fila-enlace">
                    <Space orientation="vertical" size={2} style={{ minWidth: 0 }}>
                      <Space wrap size={8}>
                        <Typography.Text strong>{e.nombre}</Typography.Text>
                        <TagEstado estado={e.estado} />
                      </Space>
                      <Typography.Text type="secondary">
                        {rangoFechas(e.fecha_inicio, e.fecha_fin)} · {e.lugar}, {e.ciudad}
                      </Typography.Text>
                    </Space>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <Typography.Text strong style={{ fontVariantNumeric: "tabular-nums" }}>{numero(e.entradas_vendidas)} entradas</Typography.Text>
                      <br />
                      <Typography.Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>{pesos(e.recaudado)}</Typography.Text>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<><TagsOutlined /> Últimas ventas</>}>
            <Table
              rowKey="id_compra"
              size="small"
              pagination={false}
              dataSource={r.ultimas_ventas}
              locale={{ emptyText: <Empty description="Todavía no vendiste entradas" /> }}
              columns={[
                {
                  title: "Cuándo",
                  dataIndex: "fecha",
                  render: (f) => <span style={{ whiteSpace: "nowrap" }}>{dayjs(f).format("DD/MM HH:mm")}</span>
                },
                { title: "Evento", dataIndex: "evento", ellipsis: true },
                { title: "Entradas", dataIndex: "cantidad", align: "right" },
                { title: "Importe", dataIndex: "subtotal", align: "right", render: (v) => <span style={{ whiteSpace: "nowrap" }}>{pesos(v)}</span> }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Inicio;
