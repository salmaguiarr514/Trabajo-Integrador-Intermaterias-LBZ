import { erroresPorCampo, mensajeDeError } from "../services/api.js";

// Después de un error de la API al guardar un formulario de antd:
// los errores de validación van debajo de cada campo; cualquier otro, al cartel de arriba.
export const mostrarErrores = (form, error, setErrorApi, porDefecto) => {
  const campos = erroresPorCampo(error);
  const nombres = form ? Object.keys(form.getFieldsValue(true)) : [];
  const conCampo = Object.entries(campos).filter(([campo]) => nombres.includes(campo));
  if (conCampo.length > 0) {
    form.setFields(conCampo.map(([name, msg]) => ({ name, errors: [msg] })));
  } else {
    setErrorApi(Object.values(campos)[0] ?? mensajeDeError(error, porDefecto));
  }
};
