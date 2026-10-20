// Arma INSERT y UPDATE solo con las columnas que vinieron en el body (ya validado con zod).
// Las que no vienen toman el DEFAULT de la base (INSERT) o quedan como están (UPDATE).
// Los nombres de columna salen de una lista fija del controller, nunca del body.

const presentes = (datos, columnas) => columnas.filter((c) => datos[c] !== undefined);

// insertar("lugares", { nombre, tipo }, ["nombre", "tipo", ...], { id_empresa: null })
// → { texto: "INSERT INTO lugares (nombre, tipo, id_empresa) VALUES ($1, $2, $3) RETURNING *", valores }
export const insertar = (tabla, datos, columnas, extra = {}) => {
  const todo = { ...datos, ...extra };
  const cols = [...presentes(datos, columnas), ...Object.keys(extra)];
  const marcadores = cols.map((_, i) => `$${i + 1}`);
  return {
    texto: `INSERT INTO ${tabla} (${cols.join(", ")}) VALUES (${marcadores.join(", ")}) RETURNING *`,
    valores: cols.map((c) => todo[c])
  };
};

// actualizar("lugares", body, COLUMNAS, { id_lugar: 5 })
// → { texto: "UPDATE lugares SET nombre = $1 WHERE id_lugar = $2 RETURNING *", valores }
// Devuelve null si no vino ninguna columna para cambiar.
export const actualizar = (tabla, datos, columnas, donde) => {
  const cols = presentes(datos, columnas);
  if (cols.length === 0) return null;
  const condiciones = Object.keys(donde).map((c, i) => `${c} = $${cols.length + i + 1}`);
  return {
    texto: `UPDATE ${tabla} SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(", ")}
            WHERE ${condiciones.join(" AND ")} RETURNING *`,
    valores: [...cols.map((c) => datos[c]), ...Object.values(donde)]
  };
};

// Los TIMESTAMP se devuelven como texto "2027-02-13T22:30": son horas de Argentina sin huso,
// y si viajaran como Date el navegador las correría.
export const hora = (col, alias = col.split(".").pop()) => `to_char(${col}, 'YYYY-MM-DD"T"HH24:MI') AS ${alias}`;

// "Ahora" y "hoy" en Argentina, para comparar con esos TIMESTAMP y DATE sin huso
// (el servidor de la base corre en UTC).
export const AHORA = "(NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')";
export const HOY = `${AHORA}::DATE`;
