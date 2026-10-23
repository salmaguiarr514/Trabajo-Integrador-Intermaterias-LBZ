import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, App, Button, Card, Col, Empty, Input, Popconfirm, Row,
  Space, Statistic, Table, Tag, Tooltip, Typography
} from "antd";
import {
  CheckCircleOutlined, DeleteOutlined, EditOutlined,
  PauseCircleOutlined, PlusOutlined, SearchOutlined, TeamOutlined
} from "@ant-design/icons";
import { obtenerEmpresas, eliminarEmpresa } from "../../services/empresasService.js";
import { mensajeDeError } from "../../services/api.js";
import Cargando from "../../components/Cargando.jsx";

function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const response = await obtenerEmpresas();
        if (!Array.isArray(response.data)) throw new Error("Respuesta inesperada de la API");
        setEmpresas(response.data);
      } catch (err) {
        setError(mensajeDeError(err, "No se pudieron cargar las productoras"));
      } finally {
        setLoading(false);
      }
    };
    cargarEmpresas();
  }, []);

  const handleEliminar = async (id) => {
    try {
      await eliminarEmpresa(id);
      setEmpresas(empresas.filter((e) => e.id_empresa !== id));
      message.success("Productora eliminada");
    } catch (err) {
      // 409: tiene usuarios, lugares, artistas o eventos → se da de baja en vez de borrarla
      const conDatos = err.response?.status === 409;
      message.error(
        conDatos
          ? "La productora tiene datos asociados: desactivala desde Editar en lugar de eliminarla"
          : mensajeDeError(err, "No se pudo eliminar la productora")
      );
    }
  };

  if (loading) {
    return <Cargando texto="Cargando productoras…" />;
  }

  if (error) {
    return <Alert type="error" showIcon title={error} />;
  }

  const texto = busqueda.trim().toLowerCase();
  const filtradas = empresas.filter((e) =>
    [e.nombre, e.cuit, e.email].some((campo) => campo?.toLowerCase().includes(texto))
  );
  const activas = empresas.filter((e) => e.activo).length;

  const columnas = [
    {
      title: "Productora",
      dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (nombre, empresa) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{nombre}</Typography.Text>
          <Typography.Text type="secondary">{empresa.direccion ?? "Sin dirección"}</Typography.Text>
        </Space>
      )
    },
    { title: "CUIT", dataIndex: "cuit", render: (cuit) => <span style={{ whiteSpace: "nowrap" }}>{cuit}</span> },
    {
      title: "Cargo por servicio",
      dataIndex: "cargo_servicio_pct",
      responsive: ["md"],
      sorter: (a, b) => a.cargo_servicio_pct - b.cargo_servicio_pct,
      render: (pct) => `${pct} %`
    },
    {
      title: "Contacto",
      key: "contacto",
      responsive: ["md"],
      render: (_, empresa) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>{empresa.email ?? "—"}</Typography.Text>
          <Typography.Text type="secondary">{empresa.telefono ?? "—"}</Typography.Text>
        </Space>
      )
    },
    {
      title: "Estado",
      dataIndex: "activo",
      filters: [
        { text: "Activa", value: true },
        { text: "Inactiva", value: false }
      ],
      onFilter: (valor, empresa) => empresa.activo === valor,
      render: (activo) =>
        activo
          ? <Tag color="green" icon={<CheckCircleOutlined />}>Activa</Tag>
          : <Tag icon={<PauseCircleOutlined />}>Inactiva</Tag>
    },
    {
      title: "Alta",
      dataIndex: "fecha_creacion",
      responsive: ["lg"],
      sorter: (a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion),
      render: (fecha) => new Date(fecha).toLocaleDateString("es-AR")
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "right",
      render: (_, empresa) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/empresas/${empresa.id_empresa}/editar`)}
            />
          </Tooltip>
          <Popconfirm
            title={`¿Eliminar "${empresa.nombre}"?`}
            description="Se borra la productora y no se puede deshacer."
            okText="Eliminar productora"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleEliminar(empresa.id_empresa)}
          >
            <Tooltip title="Eliminar">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="pila">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Typography.Title level={1} style={{ marginBottom: 4, fontSize: 30 }}>Productoras</Typography.Title>
          <Typography.Text type="secondary">
            Empresas que organizan recitales y festivales en la plataforma.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/empresas/nueva")}>
          Nueva productora
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="Total" value={empresas.length} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card><Statistic title="Activas" value={activas} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic title="Inactivas" value={empresas.length - activas} prefix={<PauseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="Buscar por nombre, CUIT o email"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id_empresa"
          columns={columnas}
          dataSource={filtradas}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="No hay productoras para mostrar" /> }}
        />
      </Card>
    </div>
  );
}

export default Empresas;
