// Error con código HTTP. Se lanza desde cualquier controller o middleware y lo responde manejarErrores.
// Ej.: throw new ErrorHttp(404, "Empresa no encontrada");
export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
