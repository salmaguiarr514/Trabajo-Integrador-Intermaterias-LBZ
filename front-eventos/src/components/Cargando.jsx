// Ruedita de carga sin antd: la usan los paneles y las rutas protegidas del sitio público
function Cargando({ texto }) {
  return (
    <div role="status" style={{ display: "grid", justifyItems: "center", gap: 12, padding: 80 }}>
      <span className="ruedita" aria-hidden="true" />
      <span style={{ opacity: 0.75 }}>{texto ?? "Cargando…"}</span>
    </div>
  );
}

export default Cargando;
