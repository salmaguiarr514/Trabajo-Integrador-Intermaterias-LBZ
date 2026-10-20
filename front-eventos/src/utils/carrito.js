// La selección de entradas de un evento se guarda en sessionStorage: si el cliente tiene que
// iniciar sesión (o crear la cuenta) antes de pagar, la recupera al volver.
const clave = (idEvento) => `backstage_carrito_${idEvento}`;

// carrito: { [id_tarifa]: cantidad }
export const leerCarrito = (idEvento) => {
  try {
    return JSON.parse(sessionStorage.getItem(clave(idEvento))) ?? {};
  } catch {
    return {};
  }
};

export const guardarCarrito = (idEvento, carrito) => {
  try {
    sessionStorage.setItem(clave(idEvento), JSON.stringify(carrito));
  } catch {
    // sin sessionStorage (modo privado estricto): la selección se pierde al recargar, nada más
  }
};

export const vaciarCarrito = (idEvento) => {
  try {
    sessionStorage.removeItem(clave(idEvento));
  } catch {
    // nada que hacer
  }
};

export const itemsDelCarrito = (carrito) =>
  Object.entries(carrito)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([id, cantidad]) => ({ id_tarifa: Number(id), cantidad }));
