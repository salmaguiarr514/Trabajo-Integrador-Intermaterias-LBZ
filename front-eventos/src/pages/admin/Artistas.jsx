import { useState } from "react";
import { Alert, Card, Empty, Input, Select, Table, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { obtenerArtistas } from "../../services/adminService.js";
import { obtenerEmpresas } from "../../services/empresasService.js";
import { useCarga } from "../../hooks/useCarga.js";
import Cargando from "../../components/Cargando.jsx";
import Encabezado from "../../components/Encabezado.jsx";

// Solo lectura: cada productora carga sus artistas desde su panel
function Artistas() {
  const [idEmpresa, setIdEmpresa] = useState();
  const [busqueda, setBusqueda] = useState("");
  const artistas = useCarga(() => obtenerArtistas({ id_empresa: idEmpresa }), idEmpresa, "No se pudieron cargar los artistas");
  const empresas = useCarga(obtenerEmpresas, "empresas", "No se pudieron cargar las productoras");

  if (artistas.cargando) return <Cargando texto="Cargando artistas..." />;
  if (artistas.error) return <Alert type="error" showIcon title={artistas.error} />;

  const texto = busqueda.trim().toLowerCase();
  const filtrados = artistas.datos.filter((a) =>
    [a.nombre, a.genero, a.pais].some((c) => c?.toLowerCase().includes(texto))
  );
  const generos = [...new Set(artistas.datos.map((a) => a.genero).filter(Boolean))].sort();

  const columnas = [
    {
      title: "Artista",
      dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (nombre) => <Typography.Text strong>{nombre}</Typography.Text>
    },
    {
      title: "Género",
      dataIndex: "genero",
      filters: generos.map((g) => ({ text: g, value: g })),
      onFilter: (valor, a) => a.genero === valor,
      render: (g) => g ?? "—"
    },
    { title: "País", dataIndex: "pais", responsive: ["md"], render: (p) => p ?? "—" },
    { title: "Productora", dataIndex: "productora", sorter: (a, b) => a.productora.localeCompare(b.productora) },
    {
      title: "Shows",
      dataIndex: "cantidad_presentaciones",
      align: "right",
      sorter: (a, b) => a.cantidad_presentaciones - b.cantidad_presentaciones
    },
    {
      title: "Estado",
      dataIndex: "activo",
      responsive: ["md"],
      render: (activo) => (activo ? <Tag color="green">Activo</Tag> : <Tag>De baja</Tag>)
    }
  ];

  return (
    <div className="pila">
      <Encabezado
        titulo="Artistas"
        descripcion="Los artistas que cargó cada productora. Solo se pueden ver: los edita cada una desde su panel."
      />
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Todas las productoras"
            value={idEmpresa}
            onChange={setIdEmpresa}
            options={(empresas.datos ?? []).map((e) => ({ value: e.id_empresa, label: e.nombre }))}
            style={{ minWidth: 220 }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por nombre, género o país"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: "1 1 260px" }}
          />
        </div>
        <Table
          rowKey="id_artista"
          columns={columnas}
          dataSource={filtrados}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="No hay artistas para mostrar" /> }}
        />
      </Card>
    </div>
  );
}

export default Artistas;
