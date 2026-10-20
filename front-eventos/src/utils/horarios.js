import dayjs from "dayjs";

// Un show empieza el día de su jornada o en la madrugada siguiente, antes de las 8 (RN-17).
export const MADRUGADA = 8;
const FORMATO = "YYYY-MM-DDTHH:mm";

// Arma inicio y fin a partir del día de la jornada y dos horas (dayjs de un TimePicker).
// Si termina a una hora "menor" que la de inicio, termina al día siguiente (show que cruza la medianoche).
export const calcularHorario = (fechaJornada, inicio, fin) => {
  if (!inicio || !fin) return null;
  let desde = dayjs(fechaJornada).hour(inicio.hour()).minute(inicio.minute());
  if (inicio.hour() < MADRUGADA) desde = desde.add(1, "day");
  let hasta = desde.hour(fin.hour()).minute(fin.minute());
  if (!hasta.isAfter(desde)) hasta = hasta.add(1, "day");
  return { inicio: desde.format(FORMATO), fin: hasta.format(FORMATO), desde, hasta };
};

// Minutos desde la medianoche del día de la jornada: "2027-02-14T00:30" con jornada 13/2 → 24*60 + 30
export const minutosDesde = (fechaJornada, fechaHora) => dayjs(fechaHora).diff(dayjs(fechaJornada), "minute");
