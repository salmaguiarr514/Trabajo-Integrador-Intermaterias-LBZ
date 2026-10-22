# Infraestructura — dónde corre cada cosa

Decidido el 2026-10-22. Reemplaza la idea de "desarrollar contra Supabase y dockerizar solo para la demo de Sistemas Operativos":
ahora **la base de producción es un Postgres dockerizado nuestro**, y el sitio público corre en **Vercel**.

## 1. Esquema final

```mermaid
flowchart LR
    U[Usuarios<br/>navegador] --> VF[Vercel: front-eventos<br/>React estático]
    VF -->|fetch /api| VA[Vercel: api-eventos<br/>Express como función serverless]
    VA -->|Postgres por internet<br/>SSL| EXP[Entrada pública<br/>port forwarding o túnel]
    subgraph PCS [PC servidor - Docker]
        EXP --> DB[(Postgres<br/>esquema public = OLTP<br/>esquema dw = data warehouse)]
    end
    SO[Demo de SO<br/>nginx + réplicas de la API] -->|LAN| DB
```

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Front (`front-eventos`) | Vercel, proyecto 1 | Build de Vite. `VITE_API_URL` apunta a la URL de la API en Vercel |
| API (`api-eventos`) | Vercel, proyecto 2 | Ya está lista: [index.js](../../api-eventos/src/index.js) no hace `listen` cuando existe `VERCEL` y exporta `app` |
| Base OLTP | Postgres en Docker, en la **PC servidor** | Los mismos scripts `01`–`12` de [database/](../../api-eventos/database/) |
| Data warehouse | **La misma base**, esquema `dw` | Ver [data-warehouse.md](../base-de-datos/data-warehouse.md) |
| Supabase | Sigue siendo la base de desarrollo **hasta que todo lo anterior ande** | Después se migran los datos y se deja de usar (sección 4) |
| Demo de Sistemas Operativos | Aparte, con nginx + réplicas | Usa **el mismo Postgres** dockerizado. Ver [plan de SO](../sistemas-operativos/plan.md) |

La API no cambia de código para pasar de Supabase al Postgres propio: [db.js](../../api-eventos/src/data/db.js) usa `DATABASE_URL` con SSL,
así que en Vercel solo se cambia esa variable.

## 2. Cómo llega Vercel al Postgres de la PC

Las funciones de Vercel corren en internet y no tienen IP fija. Necesitan una **dirección pública TCP** que llegue al puerto del Postgres.
Cloudflare Tunnel y Tailscale no sirven acá: necesitan un programa del lado del cliente, y en Vercel no lo podemos instalar.

**Recomendación, en este orden:**

1. **Ver si la conexión de la PC servidor tiene CGNAT.** Comparar la IP WAN que muestra el router con la de un sitio como *cualip.com*.
   Si son iguales, no hay CGNAT. Si son distintas (o la del router empieza con `100.64`–`100.127`), hay CGNAT y no se puede abrir el puerto.
2. **Sin CGNAT → port forwarding + DNS dinámico** (gratis y estable):
   - En el router, redirigir un puerto alto (por ejemplo `55432`) al `5432` de la PC servidor. Un puerto alto evita parte de los escaneos automáticos.
   - Un nombre gratuito en DuckDNS (`backstage-db.duckdns.org`) que siga a la IP de la casa, con su actualizador corriendo en la PC
     (también va en un contenedor).
3. **Con CGNAT → túnel TCP:** ngrok (`ngrok tcp 5432`) o playit.gg. Dan una dirección `host:puerto` pública.
   **A verificar antes de elegir:** si el plan gratuito pide tarjeta y si la dirección cambia cada vez que se reinicia el túnel.
   Si cambia, hay que actualizar `DATABASE_URL` en Vercel y redeployar cada vez.

**Lo que hay que hacer en cualquiera de los dos casos:**

| Tema | Qué hacer |
| --- | --- |
| Seguridad | Postgres expuesto a internet: **contraseña larga**, **SSL obligatorio** (`hostssl` en `pg_hba.conf`, certificado autofirmado alcanza porque `db.js` usa `rejectUnauthorized: false`) y un **usuario `backstage_app`** que no sea superusuario, dueño solo de las tablas de la app |
| Latencia | Por defecto Vercel corre las funciones en EE. UU. Configurar la región **`gru1` (São Paulo)**, la más cercana a la PC |
| Conexiones | Cada instancia serverless abre su propio pool. Bajar el pool a `max: 3` cuando corre en Vercel y poner `idleTimeoutMillis`, para no agotar las 100 conexiones de Postgres |
| Disponibilidad | **Si la PC servidor está apagada, el sitio no anda.** Para la presentación tiene que estar prendida, sin suspensión, con Docker arrancando solo (`restart: unless-stopped`) |
| Respaldo | `pg_dump` diario a un archivo fuera del volumen (otro contenedor o tarea programada). El volumen de Docker no es un backup |

## 3. Variables de entorno en Vercel

| Proyecto | Variable | Valor |
| --- | --- | --- |
| api-eventos | `DATABASE_URL` | Primero la de Supabase; después `postgresql://backstage_app:CLAVE@HOST_PUBLICO:PUERTO/backstage?sslmode=require` |
| api-eventos | `JWT_SECRET`, `JWT_EXPIRA` | Las mismas que en local |
| api-eventos | `FRONTEND_URL` | La URL de Vercel del front (para CORS) |
| api-eventos | `GMAIL_USUARIO`, `GMAIL_CLAVE_APP` | Opcionales |
| front-eventos | `VITE_API_URL` | La URL de Vercel de la API, terminada en `/api` |

El front necesita un `vercel.json` con un *rewrite* de todo a `index.html`, porque React Router maneja las rutas del lado del cliente
(sin eso, recargar `/empresa/eventos` da 404).

## 4. Migración de Supabase al Postgres propio

Se hace **una sola vez**, cuando el Postgres dockerizado ya está expuesto y probado:

1. Avisar en el grupo y no cargar nada en Supabase durante la migración.
2. Base vacía en Docker con los scripts `01`–`12` (**sin** los seeds `10` y `11`, porque los datos vienen de Supabase).
3. `pg_dump --data-only --schema=public` desde Supabase y cargarlo en el contenedor. Después, ajustar las secuencias (`setval`) de cada `SERIAL`.
4. Comparar cantidades de filas tabla por tabla entre las dos bases.
5. Cambiar `DATABASE_URL` en Vercel y en el `.env` de cada uno. Probar login, compra y control de acceso en el sitio público.
6. Dejar Supabase sin tocar dos semanas como respaldo, y después darlo de baja.

A partir de ahí, para desarrollar en local cada uno puede apuntar al Postgres de la PC servidor (el mismo de producción, con cuidado)
o levantar su propio Postgres en Docker con los seeds. Recomendado: **cada uno el suyo** con los seeds, y la base de la PC servidor solo para el sitio público.

## 5. Decisiones pendientes

1. **Cuál es la PC servidor.** Tiene que poder quedar prendida y tener una conexión sin CGNAT (o aceptar el túnel).
   El plan de SO proponía la PC de Salma con Linux como PC de acceso; puede ser la misma o no.
2. **Port forwarding o túnel:** depende del punto 1 y de la prueba de CGNAT.
3. **Cuándo se migra** (sección 4): después de que el sitio ande en Vercel contra Supabase y el Postgres propio esté expuesto.
