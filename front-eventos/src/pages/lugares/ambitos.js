import { lugaresService } from "../../services/lugaresService.js";

// Las pantallas de lugares las usan el superadmin (/admin/lugares) y la productora (/panel/lugares).
// Acá está todo lo que cambia entre uno y otro (RN-06 y RN-07 de docs/comun/dominio.md).
export const AMBITOS = {
  admin: {
    servicio: lugaresService("admin"),
    ruta: "/admin/lugares",
    descripcion: "El catálogo de la plataforma lo pueden usar todas las productoras. Los propios los carga cada una y acá solo se ven.",
    filtros: [
      { value: "plataforma", label: "De la plataforma" },
      { value: "propio", label: "Propios de productoras" },
      { value: "", label: "Todos" }
    ],
    filtroInicial: "plataforma",
    tituloNuevo: "Nuevo lugar de la plataforma",
    puedeEditar: (lugar) => lugar.origen === "plataforma",
    avisoSoloLectura: (lugar) => ({
      title: `Es un lugar propio de ${lugar.productora}`,
      description: "Solo la productora lo puede modificar. Desde acá se ve en modo lectura."
    })
  },
  panel: {
    servicio: lugaresService("panel"),
    ruta: "/panel/lugares",
    descripcion: "En tus eventos podés usar los lugares de la plataforma y los tuyos. Solo los tuyos se pueden modificar.",
    filtros: [
      { value: "", label: "Todos" },
      { value: "propio", label: "Mis lugares" },
      { value: "plataforma", label: "De la plataforma" }
    ],
    filtroInicial: "",
    tituloNuevo: "Nuevo lugar propio",
    puedeEditar: (lugar) => lugar.origen === "propio",
    avisoSoloLectura: () => ({
      title: "Es un lugar de la plataforma",
      description: "Lo podés usar en tus eventos, pero sus datos, sectores y escenarios los mantiene el equipo de Backstage."
    })
  }
};
