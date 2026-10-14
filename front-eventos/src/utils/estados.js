// Color del Tag de antd para cada estado de un evento
export const COLOR_ESTADO = {
  borrador: "default",
  publicado: "green",
  agotado: "gold",
  cancelado: "red",
  finalizado: "blue"
};

export const ESTADOS_EVENTO = Object.keys(COLOR_ESTADO);

export const TIPOS_LUGAR = [
  { value: "estadio", label: "Estadio" },
  { value: "arena", label: "Arena" },
  { value: "teatro", label: "Teatro" },
  { value: "predio", label: "Predio" },
  { value: "club", label: "Club" },
  { value: "otro", label: "Otro" }
];

export const etiquetaTipoLugar = (tipo) => TIPOS_LUGAR.find((t) => t.value === tipo)?.label ?? tipo;
