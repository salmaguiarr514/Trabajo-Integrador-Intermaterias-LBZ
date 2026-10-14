import { useEffect, useState } from "react";
import { mensajeDeError } from "../services/api.js";

// Trae datos de la API al montar la pantalla y cada vez que cambia `clave`.
//   const { datos, cargando, error, recargar, setDatos } =
//     useCarga(() => obtenerLugares({ origen }), origen, "No se pudieron cargar los lugares");
// - cargando: solo es true la primera vez (después se muestran los datos anteriores mientras llegan los nuevos)
// - recargar(): vuelve a pedir los datos (por ejemplo, después de guardar)
// - setDatos(): para actualizar la lista en el momento sin volver a pedirla
export function useCarga(pedir, clave, mensaje) {
  const [estado, setEstado] = useState({ datos: null, error: "" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true; // si cambia la clave antes de que llegue la respuesta, se descarta
    pedir()
      .then(({ data }) => vigente && setEstado({ datos: data, error: "" }))
      .catch((error) => vigente && setEstado({ datos: null, error: mensajeDeError(error, mensaje) }));
    return () => {
      vigente = false;
    };
    // pedir y mensaje cambian en cada render; lo que importa es la clave
  }, [clave, version]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    datos: estado.datos,
    error: estado.error,
    cargando: estado.datos === null && !estado.error,
    recargar: () => setVersion((v) => v + 1),
    setDatos: (cambio) => setEstado((e) => ({ ...e, datos: typeof cambio === "function" ? cambio(e.datos) : cambio }))
  };
}
