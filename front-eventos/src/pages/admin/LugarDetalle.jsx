import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, App, Button, Card, Descriptions, Empty, Form, Popconfirm, Result, Space, Switch, Table, Tabs, Tag, Tooltip, Typography
} from "antd";
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { actualizarLugar, eliminarLugar, eliminarParteLugar, obtenerLugar } from "../../services/adminService.js";
import { erroresPorCampo, mensajeDeError } from "../../services/api.js";
import { useCarga } from "../../hooks/useCarga.js";
import { numero } from "../../utils/formato.js";
import { etiquetaTipoLugar } from "../../utils/estados.js";
import Cargando from "../../components/Cargando.jsx";
import TagOrigen from "../../components/TagOrigen.jsx";
import LugarCampos from "./LugarCampos.jsx";
import ParteLugarModal from "./ParteLugarModal.jsx";

const LISTADO = "/admin/lugares";

function DatosLugar({ lugar, editable, onGuardado }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  useEffect(() => {
    form.setFieldsValue(lugar);
  }, [lugar, form]);

  const guardar = async (valores) => {
    setGuardando(true);
    setErrorApi("");
    try {
      const { data } = await actualizarLugar(lugar.id_lugar, valores);
      message.success("Lugar actualizado");
      onGuardado(data);
    } catch (error) {
      const campos = erroresPorCampo(error);
      if (Object.keys(campos).length > 0) {
        form.setFields(Object.entries(campos).map(([name, msg]) => ({ name, errors: [msg] })));
      } else {
        setErrorApi(mensajeDeError(error, "No se pudo guardar el lugar"));
      }
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    try {
      await eliminarLugar(lugar.id_lugar);
      message.success("Lugar eliminado");
      navigate(LISTADO);
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo eliminar el lugar"));
    }
  };

  return (
    <>
      {errorApi && <Alert type="error" showIcon title={errorApi} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={guardar} disabled={!editable} requiredMark="optional" style={{ maxWidth: 720 }}>
        <LugarCampos />
        <Form.Item name="activo" label="Activo" valuePropName="checked" required extra="Un lugar dado de baja no se puede elegir para eventos nuevos">
          <Switch />
        </Form.Item>
        {editable && (
          <Space wrap>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={guardando}>
              Guardar cambios
            </Button>
            <Popconfirm
              title="Eliminar lugar"
              description={
                lugar.cantidad_eventos > 0
                  ? "Tiene eventos: no se va a poder eliminar. Dalo de baja."
                  : `Se borran también sus sectores y escenarios. ¿Seguro?`
              }
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true, disabled: lugar.cantidad_eventos > 0 }}
              onConfirm={eliminar}
            >
              <Button danger icon={<DeleteOutlined />}>Eliminar lugar</Button>
            </Popconfirm>
          </Space>
        )}
      </Form>
    </>
  );
}

// Tabla de sectores o escenarios del lugar, con alta, edición y baja
function PartesLugar({ tipo, lugar, editable, onCambio }) {
  const { message } = App.useApp();
  const [modal, setModal] = useState({ abierto: false, parte: null });
  const esSector = tipo === "espacios";
  const filas = esSector ? lugar.espacios : lugar.escenarios;
  const idDe = (p) => (esSector ? p.id_espacio : p.id_escenario);

  const eliminar = async (p) => {
    try {
      await eliminarParteLugar(lugar.id_lugar, tipo, idDe(p));
      message.success(esSector ? "Sector eliminado" : "Escenario eliminado");
      onCambio();
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo eliminar"));
    }
  };

  // Por qué no se puede borrar (si no se puede)
  const bloqueo = (p) => {
    if (esSector && filas.length <= 1) return "Un lugar necesita al menos un sector";
    if (esSector && p.cantidad_tarifas > 0) return "Tiene tarifas en algún evento";
    if (!esSector && p.cantidad_eventos > 0) return "Está habilitado en algún evento";
    return null;
  };

  const columnas = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      render: (nombre, p) => (
        <Space>
          {esSector && (
            <span
              aria-hidden="true"
              style={{ width: 12, height: 12, borderRadius: 3, display: "inline-block", background: p.color ?? "transparent", border: "1px solid rgba(255,255,255,0.25)" }}
            />
          )}
          <Typography.Text strong>{nombre}</Typography.Text>
        </Space>
      )
    },
    ...(esSector
      ? [
          { title: "Modalidad", dataIndex: "modalidad", render: (m) => (m === "sentado" ? "Sentado" : "De pie") },
          {
            title: "Capacidad",
            dataIndex: "capacidad",
            align: "right",
            render: (c) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{numero(c)}</span>
          },
          { title: "Tarifas", dataIndex: "cantidad_tarifas", align: "right", responsive: ["md"] }
        ]
      : [
          { title: "Descripción", dataIndex: "descripcion", render: (d) => d ?? <Typography.Text type="secondary">—</Typography.Text> },
          { title: "Eventos", dataIndex: "cantidad_eventos", align: "right", responsive: ["md"] }
        ]),
    ...(editable
      ? [
          {
            title: "Acciones",
            key: "acciones",
            align: "right",
            render: (_, p) => (
              <Space>
                <Tooltip title="Editar">
                  <Button icon={<EditOutlined />} onClick={() => setModal({ abierto: true, parte: p })} />
                </Tooltip>
                {bloqueo(p) ? (
                  <Tooltip title={`No se puede eliminar: ${bloqueo(p).toLowerCase()}`}>
                    <Button danger icon={<DeleteOutlined />} disabled />
                  </Tooltip>
                ) : (
                  <Popconfirm
                    title={esSector ? "Eliminar sector" : "Eliminar escenario"}
                    description={`¿Seguro que querés eliminar "${p.nombre}"?`}
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => eliminar(p)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            )
          }
        ]
      : [])
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Typography.Text type="secondary">
          {esSector
            ? `Capacidad total: ${numero(lugar.capacidad_total)}. Cada sector es lo que después tiene tarifa.`
            : "Donde tocan los artistas. Cada evento elige cuáles usa."}
        </Typography.Text>
        {editable && (
          <Button icon={<PlusOutlined />} onClick={() => setModal({ abierto: true, parte: null })}>
            {esSector ? "Agregar sector" : "Agregar escenario"}
          </Button>
        )}
      </div>
      <Table
        rowKey={idDe}
        columns={columnas}
        dataSource={filas}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: <Empty description={esSector ? "Sin sectores" : "Sin escenarios"} /> }}
      />
      {modal.abierto && (
        <ParteLugarModal
          tipo={tipo}
          idLugar={lugar.id_lugar}
          parte={modal.parte}
          onCerrar={() => setModal({ abierto: false, parte: null })}
          onGuardado={() => {
            setModal({ abierto: false, parte: null });
            onCambio();
          }}
        />
      )}
    </>
  );
}

function LugarDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lugar = useCarga(() => obtenerLugar(id), id, "No se pudo cargar el lugar");

  if (lugar.cargando) return <Cargando />;
  if (lugar.error) {
    return (
      <Result
        status="404"
        title="Lugar no encontrado"
        subTitle={lugar.error}
        extra={<Button type="primary" onClick={() => navigate(LISTADO)}>Volver a lugares</Button>}
      />
    );
  }

  const l = lugar.datos;
  const editable = l.origen === "plataforma";

  return (
    <div className="pila">
      <div>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(LISTADO)} style={{ paddingInline: 0 }}>
          Lugares
        </Button>
        <Typography.Title level={2} style={{ margin: "8px 0 8px" }}>{l.nombre}</Typography.Title>
        <Space wrap>
          <TagOrigen lugar={l} />
          <Tag>{etiquetaTipoLugar(l.tipo)}</Tag>
          {!l.activo && <Tag color="red">De baja</Tag>}
        </Space>
      </div>

      {!editable && (
        <Alert
          type="info"
          showIcon
          title={`Es un lugar propio de ${l.productora}`}
          description="Solo la productora lo puede modificar. Desde acá se ve en modo lectura."
        />
      )}

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, lg: 4 }}
          items={[
            { label: "Dirección", children: `${l.direccion}, ${l.ciudad}, ${l.provincia}` },
            { label: "Capacidad total", children: numero(l.capacidad_total) },
            { label: "Eventos", children: l.cantidad_eventos },
            { label: "Plano", children: l.tiene_plano ? `Sí (${l.plano_ancho} × ${l.plano_alto})` : "No" }
          ]}
        />
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: "espacios",
              label: `Sectores (${l.espacios.length})`,
              children: <PartesLugar tipo="espacios" lugar={l} editable={editable} onCambio={lugar.recargar} />
            },
            {
              key: "escenarios",
              label: `Escenarios (${l.escenarios.length})`,
              children: <PartesLugar tipo="escenarios" lugar={l} editable={editable} onCambio={lugar.recargar} />
            },
            {
              key: "datos",
              label: "Datos",
              children: <DatosLugar lugar={l} editable={editable} onGuardado={() => lugar.recargar()} />
            }
          ]}
        />
      </Card>
    </div>
  );
}

export default LugarDetalle;
