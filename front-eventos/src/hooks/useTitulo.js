import { useEffect } from "react";

// Título de la pestaña del navegador para la pantalla actual: "Cartelera · Backstage"
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Backstage` : "Backstage · Entradas para recitales y festivales";
  }, [titulo]);
}
