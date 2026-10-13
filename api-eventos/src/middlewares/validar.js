// Valida req.body (o req.params) con un schema de zod y lo reemplaza por el resultado
// ya limpio: sin campos desconocidos y con los tipos convertidos.
// Si no pasa, zod lanza un ZodError y manejarErrores responde 400 con el detalle.
export const validar = (schema, origen = "body") => (req, res, next) => {
  const datos = schema.parse(req[origen] ?? {});
  if (origen === "body") {
    req.body = datos;
  } else {
    Object.assign(req[origen], datos);
  }
  next();
};
