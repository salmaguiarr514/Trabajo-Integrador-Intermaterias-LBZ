import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Empty, Space, Tabs, Tag, Tooltip, Typography } from "antd";
import { CrownOutlined, PlusOutlined } from "@ant-design/icons";
import { obtenerArtistas } from "../../../services/panelService.js";
import { useCarga } from "../../../hooks/useCarga.js";
import { diaCorto, hora } from "../../../utils/formato.js";
import { minutosDesde } from "../../../utils/horarios.js";
import Cargando from "../../../components/Cargando.jsx";
import PresentacionModal from "./PresentacionModal.jsx";
import { PANEL } from "../../../tema.js";

const PX_POR_MINUTO = 1; // 60 px por hora
const ANCHO_HORAS = 56;
const ANCHO_COLUMNA = 180;
const COLOR = PANEL.violeta;

const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const etiquetaHora = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:00`;

// Grilla de una jornada: una columna por escenario habilitado y el horario hacia abajo.
// Cada show es un bloque ubicado según su hora; si dos se pisaran se verían encimados (la API no lo permite).
function Grilla({ jornada, escenarios, shows, soloLectura, onNuevo, onEditar }) {
  // Rango visible: de la apertura (o las 16) hasta el último show (o las 02), redondeado a horas
  const inicios = shows.map((p) => minutosDesde(jornada.fecha, p.inicio));
  const fines = shows.map((p) => minutosDesde(jornada.fecha, p.fin));
  const desde = Math.floor(Math.min(jornada.hora_apertura ? aMinutos(jornada.hora_apertura) : 16 * 60, 16 * 60, ...inicios) / 60) * 60;
  const hasta = Math.ceil(Math.max(26 * 60, ...fines) / 60) * 60;
  const alto = (hasta - desde) * PX_POR_MINUTO;
  const horas = Array.from({ length: (hasta - desde) / 60 + 1 }, (_, i) => desde + i * 60);
  const lineas = `repeating-linear-gradient(to bottom, rgba(255,255,255,0.07) 0 1px, transparent 1px ${60 * PX_POR_MINUTO}px)`;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${ANCHO_HORAS}px repeat(${escenarios.length}, minmax(${ANCHO_COLUMNA}px, 1fr))`,
          minWidth: ANCHO_HORAS + escenarios.length * ANCHO_COLUMNA
        }}
      >
        {/* Encabezado: nombre de cada escenario */}
        <div />
        {escenarios.map((s) => (
          <div
            key={s.id_escenario}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px 8px", gap: 8 }}
          >
            <Typography.Text strong ellipsis>{s.nombre}</Typography.Text>
            {!soloLectura && (
              <Tooltip title={`Agregar un show en ${s.nombre}`}>
                <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => onNuevo(s.id_escenario)} />
              </Tooltip>
            )}
          </div>
        ))}

        {/* Columna de horas */}
        <div style={{ position: "relative", height: alto }}>
          {horas.map((m) => (
            <Typography.Text
              key={m}
              type="secondary"
              style={{ position: "absolute", top: (m - desde) * PX_POR_MINUTO - 9, right: 8, fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            >
              {etiquetaHora(m)}
            </Typography.Text>
          ))}
        </div>

        {/* Una columna por escenario, con sus shows */}
        {escenarios.map((s) => (
          <div
            key={s.id_escenario}
            style={{ position: "relative", height: alto, background: lineas, borderLeft: "1px solid rgba(255,255,255,0.08)" }}
          >
            {shows
              .filter((p) => p.id_escenario === s.id_escenario)
              .map((p) => {
                const ini = minutosDesde(jornada.fecha, p.inicio);
                const dur = minutosDesde(jornada.fecha, p.fin) - ini;
                return (
                  <div
                    key={p.id_presentacion}
                    role="button"
                    tabIndex={0}
                    onClick={() => onEditar(p)}
                    onKeyDown={(e) => e.key === "Enter" && onEditar(p)}
                    title={`${p.artista} · ${hora(p.inicio)} a ${hora(p.fin)}`}
                    style={{
                      position: "absolute",
                      top: (ini - desde) * PX_POR_MINUTO + 1,
                      height: Math.max(dur * PX_POR_MINUTO - 2, 22),
                      left: 4,
                      right: 4,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: p.headliner ? "rgba(168,85,247,0.38)" : "rgba(168,85,247,0.18)",
                      borderLeft: `3px solid ${COLOR}`,
                      overflow: "hidden",
                      cursor: soloLectura ? "default" : "pointer"
                    }}
                  >
                    <Typography.Text strong ellipsis style={{ display: "block", lineHeight: 1.3 }}>
                      {p.headliner && <CrownOutlined style={{ color: PANEL.destacado, marginRight: 4 }} />}
                      {p.artista}
                    </Typography.Text>
                    {dur >= 40 && (
                      <Typography.Text type="secondary" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                        {hora(p.inicio)} a {hora(p.fin)}
                      </Typography.Text>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasoLineup({ evento, soloLectura, onCambio, irA }) {
  const artistas = useCarga(obtenerArtistas, "artistas", "No se pudieron cargar tus artistas");
  const [idJornada, setIdJornada] = useState(evento.jornadas[0]?.id_jornada);
  const [modal, setModal] = useState(null); // { presentacion, escenarioInicial }

  const escenarios = evento.escenarios.filter((s) => s.habilitado);
  if (evento.jornadas.length === 0) {
    return <Alert type="info" showIcon title="Primero cargá las jornadas" action={<Button onClick={() => irA(1)}>Ir a Jornadas</Button>} />;
  }
  if (escenarios.length === 0) {
    return <Alert type="info" showIcon title="Primero elegí qué escenarios usa el evento" action={<Button onClick={() => irA(2)}>Ir a Escenarios</Button>} />;
  }
  if (artistas.cargando) return <Cargando />;

  const jornada = evento.jornadas.find((j) => j.id_jornada === idJornada) ?? evento.jornadas[0];
  const shows = evento.presentaciones.filter((p) => p.id_jornada === jornada.id_jornada);
  const sinArtistas = (artistas.datos ?? []).filter((a) => a.activo).length === 0;

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      {sinArtistas && (
        <Alert type="warning" showIcon title={<>No tenés artistas activos. Cargalos en <Link to="/panel/artistas">Artistas</Link>.</>} />
      )}
      <Tabs
        activeKey={String(jornada.id_jornada)}
        onChange={(k) => setIdJornada(Number(k))}
        items={evento.jornadas.map((j) => {
          const cantidad = evento.presentaciones.filter((p) => p.id_jornada === j.id_jornada).length;
          return {
            key: String(j.id_jornada),
            label: (
              <span style={{ textTransform: "capitalize" }}>
                {diaCorto(j.fecha)} {cantidad > 0 && <Tag style={{ marginInlineStart: 6 }}>{cantidad}</Tag>}
              </span>
            )
          };
        })}
        tabBarExtraContent={
          !soloLectura && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ presentacion: null })} disabled={sinArtistas}>
              Agregar show
            </Button>
          )
        }
      />

      <Grilla
        jornada={jornada}
        escenarios={escenarios}
        shows={shows}
        soloLectura={soloLectura || sinArtistas}
        onNuevo={(idEscenario) => setModal({ presentacion: null, escenarioInicial: idEscenario })}
        onEditar={(p) => !soloLectura && setModal({ presentacion: p })}
      />

      {/* El mismo line-up como lista, en orden: más cómodo en el celular */}
      <div>
        <Typography.Text strong>Orden del día</Typography.Text>
        {shows.length === 0 ? (
          <Empty description="Todavía no hay shows en esta jornada" />
        ) : (
          <ol style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
            {shows.map((p) => (
              <li
                key={p.id_presentacion}
                onClick={() => !soloLectura && setModal({ presentacion: p })}
                style={{ padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.08)", cursor: soloLectura ? "default" : "pointer" }}
              >
                <Space wrap>
                  <Typography.Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {hora(p.inicio)} a {hora(p.fin)}
                  </Typography.Text>
                  <Typography.Text strong>{p.artista}</Typography.Text>
                  <Typography.Text type="secondary">{p.escenario}</Typography.Text>
                  {p.headliner && <Tag color="gold" icon={<CrownOutlined />}>Cierre</Tag>}
                </Space>
              </li>
            ))}
          </ol>
        )}
      </div>

      {modal && (
        <PresentacionModal
          evento={evento}
          jornada={jornada}
          presentacion={modal.presentacion}
          escenarioInicial={modal.escenarioInicial}
          artistas={artistas.datos ?? []}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            onCambio();
          }}
        />
      )}
    </Space>
  );
}

export default PasoLineup;
