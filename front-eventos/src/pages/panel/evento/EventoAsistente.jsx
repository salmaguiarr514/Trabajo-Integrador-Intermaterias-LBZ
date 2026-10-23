import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Grid, Result, Steps } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { obtenerEvento } from "../../../services/panelService.js";
import { useCarga } from "../../../hooks/useCarga.js";
import Encabezado from "../../../components/Encabezado.jsx";
import Cargando from "../../../components/Cargando.jsx";
import PasoDatos from "./PasoDatos.jsx";
import PasoJornadas from "./PasoJornadas.jsx";
import PasoEscenarios from "./PasoEscenarios.jsx";
import PasoLineup from "./PasoLineup.jsx";
import PasoTarifas from "./PasoTarifas.jsx";
import PasoRevisar from "./PasoRevisar.jsx";

const LISTADO = "/panel/eventos";

// Los 6 pasos del plan (docs/programacion-2/plan-desarrollo.md, 6.3). Cada paso guarda por su cuenta,
// así que se puede ir y volver entre pasos sin perder nada. "hecho" marca el paso con un tilde.
const PASOS = [
  { titulo: "Datos", componente: PasoDatos, hecho: () => true },
  { titulo: "Jornadas", componente: PasoJornadas, hecho: (e) => e.jornadas.length > 0 },
  { titulo: "Escenarios", componente: PasoEscenarios, hecho: (e) => e.escenarios.some((s) => s.habilitado) },
  { titulo: "Line-up", componente: PasoLineup, hecho: (e) => e.presentaciones.length > 0 },
  { titulo: "Tarifas", componente: PasoTarifas, hecho: (e) => e.tarifas.some((t) => t.activa) },
  { titulo: "Revisar y publicar", componente: PasoRevisar, hecho: (e) => e.estado !== "borrador" }
];

const VOLVER = { a: LISTADO, texto: "Eventos" };

// Los 6 pasos entran en una fila solo en pantallas anchas; si no, van uno debajo del otro
// (en una fila angosta los títulos se partían por la mitad)
function Pasos(props) {
  const anchas = Grid.useBreakpoint().xl;
  return <Steps {...props} orientation={anchas ? "horizontal" : "vertical"} size={anchas ? "default" : "small"} />;
}

// Evento nuevo: solo el paso de datos. Al guardarlo, se pasa al asistente completo.
function NuevoEvento() {
  return (
    <div className="pila">
      <Encabezado volver={VOLVER} titulo="Nuevo evento" />
      <Pasos current={0} items={PASOS.map((p, i) => ({ title: p.titulo, disabled: i > 0 }))} />
      <Card>
        <PasoDatos evento={null} />
      </Card>
    </div>
  );
}

function EventoExistente({ id }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const evento = useCarga(() => obtenerEvento(id), id, "No se pudo cargar el evento");
  const paso = Math.min(Math.max(Number(params.get("paso")) || 0, 0), PASOS.length - 1);
  const irA = (n) => setParams({ paso: String(n) }, { replace: true });

  if (evento.cargando) return <Cargando texto="Cargando evento…" />;
  if (evento.error) {
    return (
      <Result
        status="404"
        title="Evento no encontrado"
        subTitle={evento.error}
        extra={[
          <Button key="reintentar" onClick={evento.recargar}>Reintentar</Button>,
          <Button key="volver" type="primary" onClick={() => navigate(LISTADO)}>Volver a eventos</Button>
        ]}
      />
    );
  }

  const e = evento.datos;
  const Paso = PASOS[paso].componente;
  const cerrado = ["cancelado", "finalizado"].includes(e.estado);

  return (
    <div className="pila">
      <Encabezado volver={VOLVER} titulo={e.nombre} estado={e.estado} />
      {cerrado && <Alert type="warning" showIcon title={`El evento está ${e.estado}: se puede ver, pero ya no se modifica`} />}
      <Pasos
        current={paso}
        onChange={irA}
        items={PASOS.map((p, i) => ({ title: p.titulo, status: i === paso ? "process" : p.hecho(e) ? "finish" : "wait" }))}
      />
      <Card>
        <Paso evento={e} soloLectura={cerrado} onCambio={evento.recargar} irA={irA} />
      </Card>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button icon={<ArrowLeftOutlined />} disabled={paso === 0} onClick={() => irA(paso - 1)}>
          Anterior
        </Button>
        {paso < PASOS.length - 1 && (
          <Button type="primary" onClick={() => irA(paso + 1)}>
            Siguiente: {PASOS[paso + 1].titulo} <ArrowRightOutlined />
          </Button>
        )}
      </div>
    </div>
  );
}

function EventoAsistente() {
  const { id } = useParams();
  // key: al pasar de un evento a otro, el asistente arranca de cero
  return id ? <EventoExistente key={id} id={id} /> : <NuevoEvento />;
}

export default EventoAsistente;
