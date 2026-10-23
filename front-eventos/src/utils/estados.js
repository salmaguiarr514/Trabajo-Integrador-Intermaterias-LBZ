// Estados de eventos y compras: el texto que se muestra y el color del Tag de antd (ver components/TagEstado.jsx)
export const ESTADOS = {
  evento: {
    borrador: { texto: "Borrador", color: "default" },
    publicado: { texto: "Publicado", color: "green" },
    agotado: { texto: "Agotado", color: "gold" },
    cancelado: { texto: "Cancelado", color: "red" },
    finalizado: { texto: "Finalizado", color: "blue" }
  },
  compra: {
    pagada: { texto: "Pagada", color: "green" },
    rechazada: { texto: "Rechazada", color: "red" },
    pendiente: { texto: "Pendiente", color: "gold" },
    cancelada: { texto: "Cancelada", color: "default" }
  }
};

export const ESTADOS_EVENTO = Object.keys(ESTADOS.evento);

// Opciones para filtros y selects: [{ value: "publicado", label: "Publicado" }]
export const OPCIONES_ESTADO_EVENTO = ESTADOS_EVENTO.map((e) => ({ value: e, label: ESTADOS.evento[e].texto }));

export const TIPOS_LUGAR = [
  { value: "estadio", label: "Estadio" },
  { value: "arena", label: "Arena" },
  { value: "teatro", label: "Teatro" },
  { value: "predio", label: "Predio" },
  { value: "club", label: "Club" },
  { value: "otro", label: "Otro" }
];

export const etiquetaTipoLugar = (tipo) => TIPOS_LUGAR.find((t) => t.value === tipo)?.label ?? tipo;
