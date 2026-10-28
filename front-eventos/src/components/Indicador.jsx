import { useEffect, useRef } from "react";
import { Statistic } from "antd";
import { numero } from "../utils/formato.js";
import { contar, sinMovimiento } from "../utils/movimiento.js";

// Número que cuenta desde 0 al aparecer (y desde lo que muestra si el valor cambia).
// Lleva la cuenta de lo que está a la vista, así un efecto cortado (StrictMode) no saltea la animación.
function NumeroAnimado({ valor, formato }) {
  const ref = useRef(null);
  const mostrado = useRef(0);
  useEffect(() => {
    return contar(ref.current, mostrado.current, Number(valor) || 0, (n) => formato(Math.round((mostrado.current = n))), 900);
  }, [valor]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {/* arranca en 0 (si hay movimiento): así no se ve el valor final un instante antes de contar */}
      {formato(sinMovimiento() ? valor : 0)}
    </span>
  );
}

// Statistic de antd para los tableros de los paneles: el número cuenta hasta su valor.
//   <Indicador title="Recaudado" value={r.recaudado} formatter={pesos} prefix={<DollarOutlined />} />
function Indicador({ formatter = numero, ...props }) {
  return <Statistic {...props} formatter={(valor) => <NumeroAnimado valor={valor} formato={formatter} />} />;
}

export default Indicador;
