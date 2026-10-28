import pg from "pg";

// NUMERIC (precios, %) llega como número y no como texto.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat);
// DATE llega tal cual ("2027-02-13"). Si se convierte a Date de JS, el huso horario
// la corre y en Argentina se ve un día antes.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

// En local se usan las variables DB_*. Si existe DATABASE_URL (ej. deploy en Vercel
// con una base en la nube como Neon o Supabase), se usa esa con SSL.
// Abrir una conexión con la base en la nube tarda ~2 s (TLS + pooler): las conexiones quedan abiertas
// 5 minutos sin uso (por defecto pg las cierra a los 10 s y cada pausa costaba esos 2 s).
// DB_POOL_MAX: conexiones por instancia. En Vercel cada instancia abre su propio pool, así que va baja (3)
// para no agotar el límite de la base (docs/comun/plan-despliegue.md, F3.2).
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: Number(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 5 * 60_000,
      keepAlive: true
    })
  : new pg.Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: Number(process.env.DB_POOL_MAX) || 10
    });

// Si la base corta una conexión ociosa, se descarta y la próxima consulta abre otra (sin tirar el servidor)
pool.on("error", (error) => console.error("Conexión con la base cerrada:", error.message));

// Deja una conexión lista al arrancar, así el primer pedido no espera el saludo con la base
if (!process.env.VERCEL) pool.query("SELECT 1").catch(() => {});

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
