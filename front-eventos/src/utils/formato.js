// Formatos en español de Argentina

export const pesos = (n) => `$ ${Math.round(n ?? 0).toLocaleString("es-AR")}`;

export const numero = (n) => (n ?? 0).toLocaleString("es-AR");

// Columnas DATE de la base ("2027-02-13"): se arma la fecha al mediodía
// para que el huso horario no la corra un día
const deFecha = (iso) => new Date(`${iso.slice(0, 10)}T12:00:00`);

export const fecha = (iso) => (iso ? deFecha(iso).toLocaleDateString("es-AR") : "—");

export const mesAnio = (iso) => deFecha(iso).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

export const rangoFechas = (inicio, fin) => (inicio === fin ? fecha(inicio) : `${fecha(inicio)} al ${fecha(fin)}`);

// Columnas TIMESTAMP (fecha_creacion)
export const fechaHora = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR") : "—");
