import { useEffect, useId, useRef, useState } from "react";
import { Alert, App, Button, Card, Dropdown, Empty, Input, InputNumber, Popconfirm, Segmented, Select, Space, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined, UndoOutlined } from "@ant-design/icons";
import { mensajeDeError } from "../../services/api.js";
import { numero } from "../../utils/formato.js";
import { adentro, agregarPunto, ajustar, aPoligono, aRect, caja, estirar, formaNueva, mover, PASO, TIPOS_ELEMENTO, trazo } from "./geometria.js";
import { Lienzo, Rotulo } from "./VisorPlano.jsx";

// Editor del plano de un lugar (panel): se dibujan los sectores y escenarios del lugar y los elementos de referencia.
// Con el mouse o el dedo: arrastrar para mover, las esquinas o los puntos para cambiar la forma.
// Con el teclado: Tab elige una forma, las flechas la mueven (Mayús: de a 1) y Supr la quita del plano.
// Guarda todo junto (PUT /lugares/:id/plano). onGuardado: para recargar el lugar.

const ORDEN = { espacio: 0, escenario: 1, elemento: 2 }; // los elementos (chicos, suelen ir adentro de un sector) quedan arriba
const TAMAÑOS = { espacio: [240, 160], escenario: [240, 60], elemento: [100, 50] };

const desdeLugar = (l) =>
  l.plano_ancho
    ? {
        ancho: l.plano_ancho,
        alto: l.plano_alto,
        formas: [
          ...l.espacios.filter((e) => e.geometria).map((e) => ({ clave: `espacio-${e.id_espacio}`, clase: "espacio", id: e.id_espacio, geometria: e.geometria })),
          ...l.escenarios.filter((e) => e.geometria).map((e) => ({ clave: `escenario-${e.id_escenario}`, clase: "escenario", id: e.id_escenario, geometria: e.geometria })),
          ...(l.elementos ?? []).map((el) => ({ clave: `elemento-${el.id_elemento}`, clase: "elemento", tipo: el.tipo, etiqueta: el.etiqueta ?? "", geometria: el.geometria }))
        ]
      }
    : null;

const redondear = (g) => (g.tipo === "rect" ? { ...g, x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.w), h: Math.round(g.h) } : { ...g, puntos: g.puntos.map(([x, y]) => [Math.round(x), Math.round(y)]) });

function EditorPlano({ lugar, servicio, onGuardado }) {
  const { message } = App.useApp();
  const [base, setBase] = useState(() => desdeLugar(lugar)); // lo guardado
  const [plano, setPlano] = useState(base); // lo que se está editando
  const [elegida, setElegida] = useState(null); // clave de la forma elegida
  const [punto, setPunto] = useState(null); // vértice elegido de un polígono
  const [guardando, setGuardando] = useState(false);
  const [escala, setEscala] = useState(1); // unidades del lienzo por píxel de pantalla (para que las manijas tengan siempre el mismo tamaño)
  const svg = useRef(null);
  const arrastre = useRef(null);
  const nuevos = useRef(0); // para la clave de los elementos agregados
  const idGrilla = `grilla-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!svg.current) return;
    const medir = () => setEscala(plano.ancho / Math.max(1, svg.current.getBoundingClientRect().width));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(svg.current);
    return () => obs.disconnect();
  }, [plano?.ancho]);

  const nombres = {
    espacio: Object.fromEntries(lugar.espacios.map((e) => [e.id_espacio, e])),
    escenario: Object.fromEntries(lugar.escenarios.map((e) => [e.id_escenario, e]))
  };
  const titulo = (f) => (f.clase === "elemento" ? f.etiqueta || TIPOS_ELEMENTO[f.tipo].texto : nombres[f.clase][f.id]?.nombre ?? "—");
  const cambios = JSON.stringify(plano) !== JSON.stringify(base);

  if (!plano) {
    return (
      <Empty description="Este lugar todavía no tiene plano. Dibujarlo es opcional: sin plano, los sectores se eligen de una lista.">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setPlano({ ancho: 1000, alto: 700, formas: [] })}>
          Crear plano
        </Button>
      </Empty>
    );
  }

  const formas = [...plano.formas].sort((a, b) => ORDEN[a.clase] - ORDEN[b.clase]);
  const actual = plano.formas.find((f) => f.clave === elegida);
  const fuera = plano.formas.filter((f) => !adentro(f.geometria, plano.ancho, plano.alto));
  const sinDibujar = {
    espacio: lugar.espacios.filter((e) => !plano.formas.some((f) => f.clase === "espacio" && f.id === e.id_espacio)),
    escenario: lugar.escenarios.filter((e) => !plano.formas.some((f) => f.clase === "escenario" && f.id === e.id_escenario))
  };

  const cambiar = (clave, cambio) =>
    setPlano((p) => ({ ...p, formas: p.formas.map((f) => (f.clave === clave ? { ...f, ...(typeof cambio === "function" ? cambio(f) : cambio) } : f)) }));
  const ponerGeometria = (clave, geometria) => cambiar(clave, { geometria });

  const agregar = (clase, datos) => {
    const [w, h] = TAMAÑOS[clase];
    const clave = clase === "elemento" ? `elemento-nuevo-${++nuevos.current}` : `${clase}-${datos.id}`;
    setPlano((p) => ({ ...p, formas: [...p.formas, { clave, clase, ...datos, geometria: formaNueva(p.ancho, p.alto, w, h) }] }));
    setElegida(clave);
    setPunto(null);
  };
  const quitar = (clave) => {
    setPlano((p) => ({ ...p, formas: p.formas.filter((f) => f.clave !== clave) }));
    setElegida(null);
  };

  // ─── Mouse y dedo ──────────────────────────────────────────────────────────
  const aLienzo = (ev) => {
    const pt = svg.current.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.current.getScreenCTM().inverse());
  };
  const empezar = (ev, f, modo, indice) => {
    ev.stopPropagation();
    if (ev.button !== undefined && ev.button !== 0) return;
    svg.current.setPointerCapture(ev.pointerId);
    arrastre.current = { clave: f.clave, modo, indice, inicio: aLienzo(ev), original: f.geometria };
    setElegida(f.clave);
    setPunto(modo === "punto" ? indice : null);
  };
  const seguir = (ev) => {
    const a = arrastre.current;
    if (!a) return;
    const p = aLienzo(ev);
    const { ancho, alto } = plano;
    if (a.modo === "mover") {
      ponerGeometria(a.clave, mover(a.original, ajustar(p.x - a.inicio.x), ajustar(p.y - a.inicio.y), ancho, alto));
    } else if (a.modo === "esquina") {
      ponerGeometria(a.clave, estirar(a.original, a.indice, ajustar(p.x), ajustar(p.y), ancho, alto));
    } else {
      const nuevo = [Math.min(Math.max(ajustar(p.x), 0), ancho), Math.min(Math.max(ajustar(p.y), 0), alto)];
      ponerGeometria(a.clave, { ...a.original, puntos: a.original.puntos.map((q, i) => (i === a.indice ? nuevo : q)) });
    }
  };
  const soltar = () => {
    arrastre.current = null;
  };

  // ─── Teclado ───────────────────────────────────────────────────────────────
  const tecla = (ev, f) => {
    const paso = ev.shiftKey ? 1 : PASO;
    const d = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[ev.key];
    if (d) {
      ev.preventDefault();
      setElegida(f.clave); // por si se había soltado con Escape sin sacarle el foco
      ponerGeometria(f.clave, mover(f.geometria, d[0], d[1], plano.ancho, plano.alto));
    } else if (ev.key === "Delete" || ev.key === "Backspace") {
      ev.preventDefault();
      quitar(f.clave);
    } else if (ev.key === "Escape") {
      setElegida(null);
    }
  };

  // ─── Guardar ───────────────────────────────────────────────────────────────
  const enviar = async (datos, aviso) => {
    setGuardando(true);
    try {
      await servicio.guardarPlano(lugar.id_lugar, datos);
      message.success(aviso);
      return true;
    } catch (error) {
      message.error(mensajeDeError(error, "No se pudo guardar el plano"));
      return false;
    } finally {
      setGuardando(false);
    }
  };
  const guardar = async () => {
    const de = (clase) => plano.formas.filter((f) => f.clase === clase);
    const ok = await enviar(
      {
        ancho: plano.ancho,
        alto: plano.alto,
        espacios: de("espacio").map((f) => ({ id_espacio: f.id, geometria: redondear(f.geometria) })),
        escenarios: de("escenario").map((f) => ({ id_escenario: f.id, geometria: redondear(f.geometria) })),
        elementos: de("elemento").map((f) => ({ tipo: f.tipo, etiqueta: f.etiqueta || null, geometria: redondear(f.geometria) }))
      },
      "Plano guardado"
    );
    if (ok) {
      setBase(plano);
      onGuardado();
    }
  };
  const quitarPlano = async () => {
    if (base && !(await enviar({ ancho: null, alto: null }, "Plano quitado"))) return;
    setBase(null);
    setPlano(null);
    setElegida(null);
    if (base) onGuardado();
  };

  const r = 9 * escala; // radio de las manijas: ~9 px en pantalla
  const menuAgregar = {
    items: [
      ...(sinDibujar.espacio.length
        ? [{ type: "group", label: "Sectores sin dibujar", children: sinDibujar.espacio.map((e) => ({ key: `espacio-${e.id_espacio}`, label: e.nombre })) }]
        : []),
      ...(sinDibujar.escenario.length
        ? [{ type: "group", label: "Escenarios sin dibujar", children: sinDibujar.escenario.map((e) => ({ key: `escenario-${e.id_escenario}`, label: e.nombre })) }]
        : []),
      { type: "group", label: "Elementos de referencia", children: Object.entries(TIPOS_ELEMENTO).map(([tipo, t]) => ({ key: `elemento-${tipo}`, label: t.texto })) }
    ],
    onClick: ({ key }) => {
      const [clase, valor] = key.split("-");
      if (clase === "elemento") agregar("elemento", { tipo: valor, etiqueta: "" });
      else agregar(clase, { id: Number(valor) });
    }
  };

  return (
    <div className="pila">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <Space wrap>
          <Typography.Text type="secondary">Lienzo</Typography.Text>
          <InputNumber aria-label="Ancho del lienzo" min={200} max={4000} step={50} value={plano.ancho} onChange={(v) => v && setPlano((p) => ({ ...p, ancho: v }))} style={{ width: 96 }} />
          <span aria-hidden="true">×</span>
          <InputNumber aria-label="Alto del lienzo" min={200} max={4000} step={50} value={plano.alto} onChange={(v) => v && setPlano((p) => ({ ...p, alto: v }))} style={{ width: 96 }} />
          <Dropdown menu={menuAgregar} trigger={["click"]}>
            <Button icon={<PlusOutlined />}>Agregar al plano</Button>
          </Dropdown>
        </Space>
        <Space wrap>
          {cambios && <Tag color="gold">Cambios sin guardar</Tag>}
          <Button icon={<UndoOutlined />} disabled={!cambios || guardando} onClick={() => { setPlano(base); setElegida(null); }}>
            Descartar cambios
          </Button>
          <Popconfirm title="¿Quitar el plano de este lugar?" description="Se borra todo lo dibujado. Los sectores y escenarios no se tocan." okText="Quitar plano" cancelText="Cancelar" okButtonProps={{ danger: true }} onConfirm={quitarPlano}>
            <Button danger disabled={guardando}>Quitar plano</Button>
          </Popconfirm>
          <Button type="primary" icon={<SaveOutlined />} loading={guardando} disabled={!cambios || fuera.length > 0} onClick={guardar}>
            Guardar plano
          </Button>
        </Space>
      </div>

      {fuera.length > 0 && (
        <Alert type="warning" showIcon title={`${fuera.length === 1 ? "Una forma se sale" : `${fuera.length} formas se salen`} del lienzo: ${fuera.map(titulo).join(", ")}. Agrandá el lienzo o movelas para poder guardar.`} />
      )}
      {sinDibujar.espacio.length > 0 && (
        <Space wrap size={8}>
          <Typography.Text type="secondary">Sectores sin dibujar (se venden igual, desde la lista):</Typography.Text>
          {sinDibujar.espacio.map((e) => (
            <Button key={e.id_espacio} size="small" type="dashed" icon={<PlusOutlined />} aria-label={`Dibujar el sector ${e.nombre}`} onClick={() => agregar("espacio", { id: e.id_espacio })}>
              {e.nombre}
            </Button>
          ))}
        </Space>
      )}

      <div className="editor-plano">
        <figure className="plano plano--panel">
          <svg
            ref={svg}
            viewBox={`0 0 ${plano.ancho} ${plano.alto}`}
            role="group"
            aria-label="Plano del lugar: elegí una forma con Tab y movela con las flechas"
            onPointerMove={seguir}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            onPointerDown={() => setElegida(null)}
          >
            <Lienzo ancho={plano.ancho} alto={plano.alto} idGrilla={idGrilla} />
            {formas.map((f) => {
              const color = f.clase === "espacio" ? nombres.espacio[f.id]?.color || "#9e9e9e" : undefined;
              const elegidaAhora = f.clave === elegida;
              const fueraAhora = !adentro(f.geometria, plano.ancho, plano.alto);
              return (
                <g
                  key={f.clave}
                  className={`${f.clase === "espacio" ? "plano-sector" : `plano-${f.clase}`} editable ${elegidaAhora ? "elegido" : ""} ${fueraAhora ? "fuera" : ""}`}
                  style={color && { "--c": color }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={elegidaAhora}
                  aria-label={`${f.clase === "espacio" ? "Sector" : f.clase === "escenario" ? "Escenario" : TIPOS_ELEMENTO[f.tipo].texto} ${titulo(f)}`}
                  onPointerDown={(ev) => empezar(ev, f, "mover")}
                  onKeyDown={(ev) => tecla(ev, f)}
                  onFocus={() => setElegida(f.clave)}
                >
                  <path d={trazo(f.geometria)} className="plano-forma" />
                  <Rotulo g={f.geometria} texto={f.clase === "elemento" ? TIPOS_ELEMENTO[f.tipo].corto || f.etiqueta : titulo(f).toUpperCase()} max={f.clase === "espacio" ? 34 : 22} />
                </g>
              );
            })}
            {/* Manijas de la forma elegida: esquinas del rectángulo o puntos del polígono */}
            {actual &&
              (actual.geometria.tipo === "rect"
                ? [0, 1, 2, 3].map((i) => {
                    const g = actual.geometria;
                    const [x, y] = [[g.x, g.y], [g.x + g.w, g.y], [g.x + g.w, g.y + g.h], [g.x, g.y + g.h]][i];
                    return <rect key={i} x={x - r} y={y - r} width={r * 2} height={r * 2} className={`plano-manija esquina-${i}`} onPointerDown={(ev) => empezar(ev, actual, "esquina", i)} />;
                  })
                : actual.geometria.puntos.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={r} className={`plano-manija ${punto === i ? "activa" : ""}`} onPointerDown={(ev) => empezar(ev, actual, "punto", i)} />
                  )))}
          </svg>
        </figure>

        <Card size="small" title={actual ? titulo(actual) : "Forma"} className="editor-plano-panel">
          {actual ? (
            <Inspector
              forma={actual}
              plano={plano}
              datos={actual.clase === "espacio" ? nombres.espacio[actual.id] : null}
              punto={punto}
              onCambio={(cambio) => cambiar(actual.clave, cambio)}
              onPunto={setPunto}
              onQuitar={() => quitar(actual.clave)}
            />
          ) : (
            <Typography.Text type="secondary">
              Elegí una forma para moverla o cambiarle el tamaño. Arrastrá las esquinas (o los puntos de un polígono).
              Con el teclado: Tab para elegir, flechas para mover (con Mayús, de a 1) y Supr para quitarla del plano.
            </Typography.Text>
          )}
        </Card>
      </div>
    </div>
  );
}

// Panel lateral: los datos y la medida exacta de la forma elegida
function Inspector({ forma, plano, datos, punto, onCambio, onPunto, onQuitar }) {
  const g = forma.geometria;
  const c = caja(g);
  const medida = (campo, max) => (
    <label className="editor-plano-campo">
      <span>{{ x: "X", y: "Y", w: "Ancho", h: "Alto" }[campo]}</span>
      <InputNumber
        size="small"
        min={campo === "w" || campo === "h" ? PASO : 0}
        max={max}
        value={Math.round(g[campo])}
        onChange={(v) => v != null && onCambio({ geometria: { ...g, [campo]: v } })}
        style={{ width: "100%" }}
      />
    </label>
  );
  return (
    <div className="pila" style={{ gap: 12 }}>
      {forma.clase === "espacio" && datos && (
        <Typography.Text type="secondary">Sector · capacidad {numero(datos.capacidad)}</Typography.Text>
      )}
      {forma.clase === "escenario" && <Typography.Text type="secondary">Escenario</Typography.Text>}
      {forma.clase === "elemento" && (
        <>
          <label className="editor-plano-campo">
            <span>Tipo</span>
            <Select size="small" value={forma.tipo} options={Object.entries(TIPOS_ELEMENTO).map(([value, t]) => ({ value, label: t.texto }))} onChange={(tipo) => onCambio({ tipo })} />
          </label>
          <label className="editor-plano-campo">
            <span>Etiqueta</span>
            <Input size="small" maxLength={60} value={forma.etiqueta} placeholder={TIPOS_ELEMENTO[forma.tipo].texto} onChange={(ev) => onCambio({ etiqueta: ev.target.value })} />
          </label>
        </>
      )}
      <Segmented
        block
        size="small"
        value={g.tipo}
        options={[{ value: "rect", label: "Rectángulo" }, { value: "poligono", label: "Polígono" }]}
        onChange={(tipo) => onCambio({ geometria: tipo === "rect" ? aRect(g) : aPoligono(g) })}
      />
      {g.tipo === "rect" ? (
        <div className="editor-plano-medidas">
          {medida("x", plano.ancho - c.w)}
          {medida("y", plano.alto - c.h)}
          {medida("w", plano.ancho - g.x)}
          {medida("h", plano.alto - g.y)}
        </div>
      ) : (
        <>
          <Typography.Text type="secondary">
            {g.puntos.length} puntos. Arrastrá cada punto para darle forma{punto != null ? ` (elegido: el ${punto + 1})` : ""}.
          </Typography.Text>
          <Space wrap>
            <Button size="small" onClick={() => onCambio({ geometria: agregarPunto(g) })} disabled={g.puntos.length >= 40}>
              Agregar punto
            </Button>
            <Button
              size="small"
              disabled={g.puntos.length <= 3}
              onClick={() => {
                const i = punto ?? g.puntos.length - 1;
                onCambio({ geometria: { ...g, puntos: g.puntos.filter((_, j) => j !== i) } });
                onPunto(null);
              }}
            >
              Quitar punto
            </Button>
          </Space>
        </>
      )}
      <Button danger size="small" icon={<DeleteOutlined />} onClick={onQuitar}>
        Quitar del plano
      </Button>
    </div>
  );
}

export default EditorPlano;
