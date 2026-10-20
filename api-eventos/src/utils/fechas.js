// Las fechas y horas de la base (shows, períodos de venta) están en hora de Argentina, sin huso.
// "Ahora" se compara en la misma hora: NOW() de Supabase está en UTC.
export const AHORA = "(NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')";

// Los TIMESTAMP se devuelven como texto "2027-02-13T22:30" para que el navegador no los corra
export const hora = (col, alias = col.split(".").pop()) => `to_char(${col}, 'YYYY-MM-DD"T"HH24:MI') AS ${alias}`;
