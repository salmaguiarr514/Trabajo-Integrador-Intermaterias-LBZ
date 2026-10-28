# Qué hacemos en cada materia

Guía para consultar rápido **qué hay que entregar en cada materia, sobre qué se trabaja y dónde está cada cosa**.
Es un documento de uso interno del grupo: no reemplaza a las consignas (están en cada carpeta) ni a los planes de cada materia.

---

## 1. La regla que ordena todo

**Hay una sola aplicación, Backstage**, y cuatro materias que la miran distinto. Sistemas de Información es la única que trabaja con un caso aparte:

| | Sobre qué se trabaja | Quién manda |
| --- | --- | --- |
| **Programación 2, Base de Datos, Sistemas Operativos** | **Backstage completo**: plataforma de productoras con line-up, venta de entradas, service charge, control de acceso, multitenancy | [dominio.md](dominio.md), [plan de desarrollo](../programacion-2/plan-desarrollo.md), [DER](../base-de-datos/der.md) |
| **Sistemas de Información** | Una **instancia recortada de Backstage** que se presenta como un caso externo: una organizadora de conciertos por encargo, con propuestas, proveedores y tareas | Solo la [consigna de SI](../sistemas-de-informacion/consigna.md) |

La consigna de SI fija un alcance acotado y no representa lo que hace realmente la app. **El objetivo de SI es cumplir la consigna de la forma más simple y clara posible**,
no reflejar fielmente la aplicación. Por eso:

- Lo que sale del relevamiento de SI **no se implementa en la app** y no cambia el plan de desarrollo ni el DER.
- Lo que hace la app (entradas, service charge, multitenancy…) **no entra en el análisis de SI**: la consigna lo deja fuera, y el cliente de ChatGPT tampoco lo conoce.
- Ante la duda en SI, manda la consigna y lo que dijo el cliente, no cómo funciona nuestra app.

---

## 2. Resumen por materia

| Materia | Qué se entrega | Quién se encarga | Estado | Dónde mirar |
| --- | --- | --- | --- | --- |
| **Sistemas de Información** | Relevamiento (entrevistas con el cliente de ChatGPT), análisis en versiones y **documento formal** con gráficos | Todo el grupo | 🟡 Entrevista 2 sin cerrar (faltan 8 preguntas). Sin v2 ni informe | [plan.md](../sistemas-de-informacion/plan.md) |
| **Sistemas Operativos** | La app replicada en contenedores con **nginx** como balanceador, **una base SQL dockerizada**, 3 PCs con Linux. Se muestra: Docker, el compose y el `nginx.conf` | Salma | 🟡 Archivos Docker listos en `main`, **sin probar** | [plan.md](../sistemas-operativos/plan.md) |
| **Programación 2** | El sitio de Backstage (API + front) funcionando | Front: Bruno | ✅ Fases 1 a 7b hechas. Sitio público en Vercel contra Supabase. Falta verificar en producción compra, control de acceso y mails | [plan-desarrollo.md](../programacion-2/plan-desarrollo.md) y [plan-despliegue.md](plan-despliegue.md) |
| **Base de Datos** | DER y modelo, scripts SQL, y el **data warehouse** | — | DER y scripts hechos. **Data warehouse diferido al coloquio** | [der.md](../base-de-datos/der.md) y [data-warehouse.md](../base-de-datos/data-warehouse.md) |

**Prioridad actual:** Sistemas de Información y Sistemas Operativos. Lo demás se mantiene y no se abre.

---

## 3. Qué hay que hacer en cada una

### Sistemas de Información

Qué evalúa la cátedra: el **proceso** (relevamiento, análisis, diseño) más un documento formal. Todos tienen que poder explicar las decisiones.

1. Terminar la entrevista 2. Las preguntas que faltan, en orden, están en [preguntas-entrevista-2.md](../sistemas-de-informacion/relevamiento/preguntas-entrevista-2.md).
2. Escribir `analisis-v2.md` (cada versión nueva es un archivo nuevo; las anteriores no se editan).
3. Completar lo que la consigna exige y todavía no está: información por actor, flujos, controles, estados, escenarios y matriz de permisos.
4. Armar el informe final (artifact, con gráficos).

Reglas del trabajo: no asumir cómo funciona la empresa (hipótesis distintas de lo confirmado), no preguntarle al cliente términos de analista,
y limitarse a lo que interviene en la solución.

### Sistemas Operativos

La consigna pide mostrar tres cosas: **servicios en Docker**, el **docker-compose** y la **configuración de nginx**.
Pasos pendientes (en el [plan](../sistemas-operativos/plan.md), sección 5): probar en una sola VM que los scripts corren en un Postgres vacío,
ver el balanceo, pasar a las 3 PCs y ensayar el guion. Dos dudas para el profesor siguen abiertas (qué es "la otra base vía web"; un compose por PC o Swarm).

### Programación 2

El sitio ya funciona. Queda cerrar la verificación en producción (lista de humo del [plan de despliegue](plan-despliegue.md)), el README y el guion de la defensa.
Los cambios de esquema van como script SQL numerado y se avisan en el grupo antes de correrlos, porque la base es compartida.

### Base de Datos

El DER y los scripts están. **El data warehouse (esquema `dw`, ETL, consultas analíticas) se hace después, para el coloquio.**
Mientras tanto, el único cambio de esquema pensado para él es la fecha de nacimiento y la provincia en el registro de clientes (F3.5 del plan de despliegue):
sigue pendiente y no bloquea nada.

---

## 4. Qué no hay que mezclar

| No hacer | Por qué |
| --- | --- |
| Meter en el análisis de SI conceptos de la app (entradas, service charge, tenants) | La consigna los deja fuera y el cliente no los conoce |
| Cambiar la app o el DER por algo que salió del relevamiento de SI | Son alcances distintos a propósito |
| Usar a SI para justificar decisiones de las otras materias, o al revés | Cada materia se defiende con su propio material |
| Editar versiones anteriores del análisis o la transcripción de una entrevista | Son la evidencia de cómo cambió el trabajo |
| Correr `docker compose down -v` en una base con datos que importan | Borra el volumen. Solo en la base de desarrollo o de la demo |

---

## 5. Cómo se relacionan los documentos

```
docs/
├── comun/                   Lo que usan varias materias (dominio, despliegue, infraestructura, esta guía)
├── programacion-2/          Plan del sitio
├── base-de-datos/           DER, DBML y data warehouse
├── sistemas-operativos/     Consigna y plan de la demo
└── sistemas-de-informacion/ Consigna, plan, relevamiento (entrevistas) y análisis (versiones)
```

El índice completo está en [docs/README.md](../README.md).
