# Sistemas Operativos — resumen y plan del grupo

**Qué evalúa:** el despliegue del sistema con la arquitectura de Programación 2, replicada en varios contenedores,
con **Nginx como balanceador de carga** en la máquina de acceso y **una única base de datos SQL dockerizada**.
Texto completo de la cátedra: [consigna.md](consigna.md).

## Qué hay que mostrar

- **Servicios en Docker:** todos los componentes y réplicas corriendo bien dentro de contenedores.
- **Docker Compose:** el `docker-compose.yml` con la infraestructura, las réplicas y la red.
- **Configuración de Nginx:** explicar el `nginx.conf` que balancea la carga entre los nodos.

## Cómo encaja con lo que ya existe

| Tema | Situación |
| --- | --- |
| Base de datos | Hoy solo usamos Supabase. Hay que sumar un PostgreSQL en un contenedor. [db.js](../../api-eventos/src/data/db.js) ya soporta las variables `DB_*`, y los scripts de `api-eventos/database/` se pueden cargar al iniciar el contenedor. |
| Réplicas de la API | La API no guarda estado en memoria (sesión con JWT, todo en la base), así que se puede replicar sin cambios. |
| Nginx | Sirve el build del front y reparte `/api` entre las réplicas. Al quedar todo en el mismo origen, no hace falta CORS. Para la demo conviene que cada réplica se identifique (por ejemplo, un header `X-Instancia`). |

Propuesta de servicios del `docker-compose.yml`: `nginx` (puerto 80, front + balanceo), `api` ×3 y `postgres` con volumen, todos en una red interna.

## Dudas para el profesor

- "Una única base de datos … dockerizada (la SQL) **y la otra vía web**": ¿la otra es una base en la web (Supabase)
  o se refiere a que la aplicación se accede por web?
