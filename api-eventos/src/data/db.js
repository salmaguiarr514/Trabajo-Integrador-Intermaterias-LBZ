import pg from "pg";

// NUMERIC (precios, %) llega como número y no como texto.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat);
// DATE llega tal cual ("2027-02-13"). Si se convierte a Date de JS, el huso horario
// la corre y en Argentina se ve un día antes.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

// En local se usan las variables DB_*. Si existe DATABASE_URL (ej. deploy en Vercel
// con una base en la nube como Neon o Supabase), se usa esa con SSL.
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new pg.Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

export default pool;

// Corre fn(cliente) en una transacción: COMMIT si termina bien, ROLLBACK si lanza un error.
export const enTransaccion = async (fn) => {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
};
