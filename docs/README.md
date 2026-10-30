# Documentación de Backstage

Cada carpeta corresponde a una materia. Lo que usan varias materias está en `comun/`.

| Carpeta | Documento | Qué tiene | Para |
| --- | --- | --- | --- |
| `comun/` | [dominio.md](comun/dominio.md) | El negocio: empresa, actores, modelo de negocio, procesos, estados, reglas RN-01…RN-30, casos de uso | Prog. 2 y Base de Datos |
| | [plan-despliegue.md](comun/plan-despliegue.md) | Plan paso a paso: Docker, base local, subida a Vercel, demo de SO y lista de humo | Todas |
| | [infraestructura.md](comun/infraestructura.md) | Dónde corre cada cosa: Vercel + Supabase para el sitio, Docker en Linux para la demo de SO | Todas |
| | [alcance-entre-materias.md](comun/alcance-entre-materias.md) | Qué hay que hacer en cada materia, quién se encarga y qué no mezclar | Todas |
| `programacion-2/` | [plan-desarrollo.md](programacion-2/plan-desarrollo.md) | Plan para construir el sitio: roles y permisos, endpoints, pantallas, fases y reparto | Programación 2 |
| `base-de-datos/` | [der.md](base-de-datos/der.md) | DER: entidades, cardinalidades, restricciones, triggers, borrado, 3FN | Base de Datos |
| | [backstage.dbml](base-de-datos/backstage.dbml) | El modelo para abrir en dbdiagram.io y exportar el diagrama | Base de Datos |
| | [data-warehouse.md](base-de-datos/data-warehouse.md) | Data warehouse: preguntas de negocio, modelo dimensional, ETL, consultas analíticas y fases | Base de Datos |
| `sistemas-de-informacion/` | [plan.md](sistemas-de-informacion/plan.md) | **Empezar acá:** qué hay que cumplir, estado, historia y plan de iteración | Sistemas de Información |
| | [consigna.md](sistemas-de-informacion/consigna.md) | Texto original de la cátedra | Sistemas de Información |
| | [relevamiento/](sistemas-de-informacion/relevamiento/) | Guía de preguntas, transcripciones de las entrevistas y preguntas de la próxima | Sistemas de Información |
| | [analisis/](sistemas-de-informacion/analisis/) | Versiones del análisis (v0: comparación con el alcance; v1: después de la entrevista 1) | Sistemas de Información |
| `sistemas-operativos/` | [plan.md](sistemas-operativos/plan.md) | Cómo entendemos la consigna, Linux en 3 PCs, Supabase vs. base dockerizada, archivos Docker, pasos, guion de la demo, dudas y riesgos | Sistemas Operativos |
| | [paso-a-paso.md](sistemas-operativos/paso-a-paso.md) | Guía detallada: VirtualBox en Windows, Ubuntu desde cero, Docker, IPs, levantar y verificar | Sistemas Operativos |
| | [consigna.md](sistemas-operativos/consigna.md) | Texto original de la cátedra | Sistemas Operativos |

Los scripts SQL no están acá sino junto al código, en [api-eventos/database/](../api-eventos/database/).
Cuando aparezca un documento nuevo, va en la carpeta de su materia y se agrega a esta tabla.
