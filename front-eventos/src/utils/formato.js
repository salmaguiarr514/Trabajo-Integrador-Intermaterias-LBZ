// Formatos en español de Argentina

// Espacio que no se corta (\u00a0): el signo nunca queda en una línea y el número en otra
export const pesos = (n) => `$\u00a0${Math.round(n ?? 0).toLocaleString("es-AR")}`;

export const numero = (n) => (n ?? 0).toLocaleString("es-AR");

// Columnas DATE de la base ("2027-02-13"): se arma la fecha al mediodía
// para que el huso horario no la corra un día
const deFecha = (iso) => new Date(`${iso.slice(0, 10)}T12:00:00`);

export const fecha = (iso) => (iso ? deFecha(iso).toLocaleDateString("es-AR") : "—");

// "Agosto de 2026" (solo la primera letra en mayúscula)
export const mesAnio = (iso) => deFecha(iso).toLocaleDateString("es-AR", { month: "long", year: "numeric" }).replace(/^./, (l) => l.toUpperCase());

export const rangoFechas = (inicio, fin) => (inicio === fin ? fecha(inicio) : `${fecha(inicio)} al ${fecha(fin)}`);

// Columnas TIMESTAMP (fecha_creacion)
export const fechaHora = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR") : "—");

// "2027-02-13" → "sáb 13/2"
export const diaCorto = (iso) => {
  const f = deFecha(iso);
  return `${f.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")} ${f.getDate()}/${f.getMonth() + 1}`;
};

// "2027-02-13T22:30" → "22:30"
export const hora = (fechaHora) => (fechaHora ? fechaHora.slice(11, 16) : "—");

// Para el bloque de fecha de las tarjetas de la cartelera: { dia: 13, mes: "feb", semana: "sáb" }
export const diaMes = (iso) => {
  const f = deFecha(iso);
  return {
    dia: f.getDate(),
    mes: f.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
    semana: f.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")
  };
};

// "13 al 15 de febrero de 2027" o "21 de noviembre de 2026"
export const rangoLargo = (inicio, fin) => {
  const opciones = { day: "numeric", month: "long", year: "numeric" };
  if (inicio === fin) return deFecha(inicio).toLocaleDateString("es-AR", opciones);
  return `${deFecha(inicio).getDate()} al ${deFecha(fin).toLocaleDateString("es-AR", opciones)}`;
};
