# Plan de despliegue paso a paso

Cómo llevar Backstage desde la PC de cada uno hasta el sitio público en Vercel, con la base de datos en un Postgres dockerizado propio.
Es el plan operativo: el porqué de cada decisión está en [infraestructura.md](infraestructura.md), y las fases del producto en [plan-desarrollo.md](../programacion-2/plan-desarrollo.md) §7.

Estado al 2026-10-22: el código de la app funciona contra Supabase. No hay ningún Dockerfile ni compose en `main`
(solo en la rama `docker-nginx`), y el sitio no está desplegado.

---

## 0. Principios para no romper nada

1. **Un cambio por vez, cada uno con su prueba.** Cada fase tiene un "listo cuando" y un plan de vuelta atrás. No se pasa a la siguiente sin cumplirlo.
2. **Supabase sigue siendo la base de la app hasta la fase 8.** Todo lo que se despliega antes de la migración usa Supabase. Así el sitio público puede estar arriba mientras se prepara la base propia.
3. **Ningún cambio de esquema en vivo.** Cada cambio es un script SQL nuevo y numerado (`13_…sql`, `20_…sql`…), se avisa en el grupo antes de correrlo y queda en el repo.
4. **Nunca `docker compose down -v` sobre la base de producción.** Ese comando borra el volumen con todos los datos. En producción solo se usa `docker compose down` (sin `-v`).
5. **Los secretos no van al repo.** `.env` está en `.gitignore`. En Vercel las variables se cargan en el panel. Los `JWT_SECRET` de producción y de desarrollo son distintos.
6. **Mismo código en todas partes.** Los cambios de código de este plan son mínimos y están listados en la fase 3. Ninguno cambia la lógica de negocio.
7. **Los commits van directo a `main`**, como acordó el grupo para este repo. Cada fase de código es un commit separado, para poder revertirlo solo.
8. **Antes de cada despliegue, la lista de humo** (sección 8): si algo de la lista falla, no se despliega.

---

## 1. Dónde corre cada cosa

| Pieza | Desarrollo (cada PC) | Demo de Sistemas Operativos | Sitio público |
| --- | --- | --- | --- |
| Front (`front-eventos`) | `npm run dev` en `localhost:5173` | Build dentro de la imagen de nginx | Vercel, proyecto `front` |
| API (`api-eventos`) | `npm run dev` en `localhost:3000` | Contenedores `api1`, `api2`, `api3` | Vercel, proyecto `api` |
| Base de datos | Postgres en Docker local, o Supabase mientras tanto | Postgres en Docker, PC de acceso | Supabase (fases 4-7), después Postgres propio (fase 8) |
| Balanceo | No aplica | nginx en la PC de acceso | No aplica: lo hace Vercel |

Qué cambia entre entornos, y solo eso, se controla con variables de entorno. El código es el mismo.

---

## 2. Herramientas

| Herramienta | Para qué | Cómo instalar |
| --- | --- | --- |
| **Windows 10 Pro con WSL 2** | Base del sistema (decidido: sin máquina virtual) | `wsl --install` en PowerShell como administrador |
| **Docker Desktop** | Correr los contenedores | docker.com, con la opción "Use WSL 2 based engine" |
| **DBeaver Community** | Ver y consultar la base (local, Supabase o la de producción) | dbeaver.io |
| **Node.js 22 LTS o superior** | Correr la API y el front (Vite 8 lo exige) | nodejs.org |
| **Git** | Commits y sincronización | git-scm.com |
| **Cuenta de Vercel** | Desplegar | vercel.com, entrando con la cuenta de GitHub del grupo |
| **Vercel CLI** (opcional) | Probar la función de la API en local con `vercel dev` | `npm install -g vercel` |

Antes de empezar, en la PC de cada uno:
- BIOS con virtualización habilitada (Administrador de tareas → Rendimiento → "Virtualización: Habilitada").
- Docker Desktop abierto, con el motor en estado *running*.

---

## 3. Fases

| # | Fase | Depende de | Qué se entrega | Estado |
| --- | --- | --- | --- | --- |
| F0 | Preparar el entorno | — | Herramientas de la sección 2 instaladas en cada PC | ⬜ |
| F1 | Postgres en Docker | F0 | `docker-compose.yml` solo con la base, scripts `01`–`12` cargados | ⬜ |
| F2 | App local contra la base local | F1 | API y front funcionando en la PC contra el Postgres del contenedor | ⬜ |
| F3 | Preparar el código para Vercel | F2 | Commits con los cambios de la sección 5 | ⬜ |
| F4 | Desplegar la API en Vercel | F3 | `/api/salud` responde desde internet, contra Supabase | ⬜ |
| F5 | Desplegar el front en Vercel | F4 | Front público que habla con la API pública | ⬜ |
| F6 | Verificación en producción | F5 | Lista de humo completa en el sitio público | ⬜ |
| F7 | Exponer el Postgres de la PC | F1 | Conexión externa a la base propia, con SSL y respaldo | ⬜ |
| F8 | Migrar de Supabase a la base propia | F6, F7 | Sitio público apuntando al Postgres propio | ⬜ |
| F9 | Demo de Sistemas Operativos | F1, F2 | Compose con nginx y réplicas, contra el mismo Postgres | ⬜ |
| F10 | Data warehouse | F1 | Esquema `dw` cargado en la base local (ver [data-warehouse.md](../base-de-datos/data-warehouse.md)) | ⬜ |

**Orden:** F0 → F1 → F2 → F3 → F4 → F5 → F6 primero. El sitio público queda online con Supabase, que ya anda, antes de tocar la base.
F7 puede empezar en paralelo con F4-F6, porque no cambia nada de lo que ya funciona. F8 es la única fase que corta algo, y se hace al final.
F9 y F10 son independientes del sitio público.

---

## 4. Fases de entorno local (F0 a F2)

### F0. Preparar el entorno

1. Instalar las herramientas de la sección 2.
2. Clonar o actualizar el repo: `git pull` en `main`.
3. Verificar Docker: `docker run --rm hello-world` debe imprimir "Hello from Docker!".
4. Verificar el puerto 5432 libre: `netstat -ano | findstr :5432`. Si hay un Postgres instalado en Windows, detenerlo desde `services.msc` o cambiar el puerto de la izquierda en el compose (`"127.0.0.1:5433:5432"`).

**Listo cuando:** Docker responde, DBeaver está instalado y el puerto 5432 está libre o el cambio está hecho.

### F1. Postgres en Docker

Crear `docker-compose.yml` en la **raíz del repo**. Este archivo se commitea: no tiene secretos reales (la contraseña de desarrollo es pública dentro del grupo).

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: eventos-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres        # solo desarrollo
      POSTGRES_DB: backstage
    ports:
      - "127.0.0.1:5432:5432"            # solo esta PC. La fase 7 lo cambia para la red
    volumes:
      - datos-db:/var/lib/postgresql/data
      # Solo corren la primera vez (volumen vacío), en orden. 00_reset.sql NO se monta
      - ./api-eventos/database/01_extensiones.sql:/docker-entrypoint-initdb.d/01_extensiones.sql:ro
      - ./api-eventos/database/02_empresas_usuarios.sql:/docker-entrypoint-initdb.d/02_empresas_usuarios.sql:ro
      - ./api-eventos/database/03_lugares.sql:/docker-entrypoint-initdb.d/03_lugares.sql:ro
      - ./api-eventos/database/04_artistas.sql:/docker-entrypoint-initdb.d/04_artistas.sql:ro
      - ./api-eventos/database/05_eventos.sql:/docker-entrypoint-initdb.d/05_eventos.sql:ro
      - ./api-eventos/database/06_ventas.sql:/docker-entrypoint-initdb.d/06_ventas.sql:ro
      - ./api-eventos/database/07_triggers.sql:/docker-entrypoint-initdb.d/07_triggers.sql:ro
      - ./api-eventos/database/08_vistas.sql:/docker-entrypoint-initdb.d/08_vistas.sql:ro
      - ./api-eventos/database/09_seguridad.sql:/docker-entrypoint-initdb.d/09_seguridad.sql:ro
      - ./api-eventos/database/10_seed_plataforma.sql:/docker-entrypoint-initdb.d/10_seed_plataforma.sql:ro
      - ./api-eventos/database/11_seed_demo.sql:/docker-entrypoint-initdb.d/11_seed_demo.sql:ro
      - ./api-eventos/database/12_verificacion_email.sql:/docker-entrypoint-initdb.d/12_verificacion_email.sql:ro

volumes:
  datos-db:
```

Levantar y verificar:

```
docker compose up -d
docker compose ps
docker compose logs db
docker compose exec db psql -U postgres -d backstage -c "\dt"
docker compose exec db psql -U postgres -d backstage -c "\dv"
```

- En los logs, cada script aparece como `running /docker-entrypoint-initdb.d/…`, y al final `database system is ready to accept connections`.
- `\dt` lista **16 tablas** (`empresas`, `usuarios`, `lugares`, `escenarios`, `espacios`, `elementos_plano`, `artistas`, `eventos`, `jornadas`, `evento_escenarios`, `presentaciones`, `tarifas`, `compras`, `entradas`, `ingresos`, `codigos_verificacion`).
- `\dv` lista **5 vistas** (`v_lugares`, `v_disponibilidad`, `v_cartelera`, `v_asistencia`, `v_recaudacion`).
- En DBeaver: nueva conexión PostgreSQL, host `localhost`, puerto `5432`, base `backstage`, usuario `postgres`, contraseña `postgres`. Consulta de prueba: `SELECT count(*) FROM eventos;`.

Si un script falla: el log dice cuál y por qué. Se corrige el script, se borra el volumen **de la base de desarrollo** (`docker compose down -v`) y se vuelve a levantar. Esto solo vale en desarrollo.

Persistencia: `docker compose down` conserva los datos; `down -v` los borra. Probarlo una vez para entenderlo.

**Listo cuando:** los 12 scripts corren sin error, hay 16 tablas y 5 vistas, y DBeaver muestra los datos de demo.

### F2. App local contra la base local

1. En `api-eventos/.env`, **comentar `DATABASE_URL`**. Si queda definida, `db.js` la usa y la app sigue yendo a Supabase, porque tiene prioridad sobre las `DB_*`:
   ```
   # DATABASE_URL=postgresql://...
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=backstage
   JWT_SECRET=<el de desarrollo>
   JWT_EXPIRA=8h
   ```
2. En `front-eventos/.env`: `VITE_API_URL=http://localhost:3000/api`. El front llama a rutas como `/admin/usuarios`, así que la base tiene que terminar en `/api`.
3. Levantar: `npm run dev` en `api-eventos` y en `front-eventos`.
4. Lista de humo (sección 8) completa, en local.

**Listo cuando:** la lista de humo pasa contra la base de Docker. Eso confirma que el esquema y los seeds son los mismos que usa la app.

> **Supabase y Docker conviven:** para volver a apuntar a Supabase en local, se descomenta `DATABASE_URL` y se comenta el bloque `DB_*`. Nada más.

---

## 5. Preparar el código para Vercel (F3)

Son cuatro cambios chicos. Cada uno es un commit separado, en este orden. Después de cada uno: lista de humo en local.

### F3.1. Entrada serverless de la API

Vercel no ejecuta `app.listen`. `src/index.js` ya está preparado: no escucha cuando existe `process.env.VERCEL` (que Vercel define solo) y exporta `app`.
Falta un archivo que Vercel reconozca como función. Se crea `api-eventos/api/[...ruta].js`:

```js
// Entrada para Vercel: todas las rutas /api/* llegan a la app de Express de src/index.js
export { default } from "../src/index.js";
```

La carpeta `[...ruta]` es una ruta "catch-all": recibe cualquier path sin que Vercel lo reescriba, así que Express ve la URL original (`/api/salud`, `/api/admin/usuarios`…).

**Verificación:** con `npx vercel dev` dentro de `api-eventos` (detener antes `npm run dev`, porque ambos usan el puerto 3000), `curl http://localhost:3000/api/salud` debe responder `{"ok":true,...}`.
Si `/api/salud` responde 404, la URL llega cambiada a la función: revisar la documentación de Vercel para Express antes de seguir. No se pasa a F4 con un 404.

### F3.2. Límite de conexiones del pool

Cada instancia serverless abre su propio pool. El default de `pg` es 10 conexiones por instancia, y con muchas instancias se agota el límite de Supabase o del Postgres propio.
Cambio en [db.js](../../api-eventos/src/data/db.js): agregar `max` en las dos ramas del `new pg.Pool(...)`:

```js
max: Number(process.env.DB_POOL_MAX) || 10,
```

El default `10` mantiene el comportamiento actual en local. En Vercel se configura `DB_POOL_MAX=3`.

### F3.3. Rutas del front (SPA)

El front usa `BrowserRouter`. Sin una regla, abrir directamente una ruta interna (o recargarla) devuelve 404 en Vercel.
Se crea `front-eventos/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Los archivos que existen (`/assets/...`, `/favicon…`) se siguen sirviendo tal cual: la regla solo aplica a lo que no es archivo.

### F3.4. Región de la función

Solo después de la migración (F8), cuando la base esté en la PC de Argentina, se agrega a `api-eventos/vercel.json`:

```json
{
  "regions": ["gru1"]
}
```

Antes de F8, Supabase está en EE. UU. (según `.env.example`, `aws-1-us-west-2`; confirmar la región real en el panel de Supabase). Ahí conviene una región de EE. UU. como `sfo1`, para que la función esté cerca de la base. Cambiar la región no rompe nada, pero sí hay que medir la latencia después.

**Listo cuando:** los cuatro commits están en `main`, `npm run build` del front pasa, y la lista de humo pasa en local.

---

## 6. Desplegar en Vercel (F4 y F5)

Hay dos proyectos de Vercel, uno por carpeta. Los dos se conectan al mismo repo de GitHub.

### F4. API

1. En Vercel: **Add New → Project**, elegir el repo, y en **Root Directory** poner `api-eventos`.
2. **Framework Preset:** Other. **Build Command** y **Output Directory:** vacíos (no hay build).
3. Antes de desplegar, cargar las variables de entorno (Settings → Environment Variables):

| Variable | Valor | Notas |
| --- | --- | --- |
| `DATABASE_URL` | URL de **sesión** de Supabase (puerto 5432 del pooler) | Hasta F8. Ver nota sobre la URL de transacción abajo |
| `JWT_SECRET` | Texto largo y aleatorio, **distinto** del de desarrollo | Generar con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRA` | `8h` | |
| `DB_POOL_MAX` | `3` | Por F3.2 |
| `FRONTEND_URL` | Dejar `https://pendiente.invalid` por ahora | Se completa en F5. Hasta entonces el CORS no deja pasar nada, que es lo esperado |
| `GMAIL_USUARIO`, `GMAIL_CLAVE_APP` | Opcionales | Sin ellas, el código de verificación aparece en los logs de Vercel |

> **URL de Supabase:** usar la de sesión (puerto 5432 del pooler), no la de transacción (6543). El driver `pg` mantiene estado por conexión, y el pooler de transacción no lo garantiza: con la de sesión el comportamiento es el mismo que en local.

4. **Deploy.**
5. Verificar: `https://<api>.vercel.app/api/salud` responde `{"ok":true,"instancia":"…"}`, y la respuesta trae el header `X-Instancia`.

**Plan de vuelta atrás:** en Vercel, la versión anterior se puede promover de nuevo con un clic (**Deployments → … → Promote to Production**). Si la API nunca estuvo bien, se borra el proyecto: no afecta a nadie porque el front todavía no existe.

### F5. Front

1. Nuevo proyecto en Vercel, mismo repo, **Root Directory** `front-eventos`.
2. **Framework Preset:** Vite (lo detecta solo). **Build Command:** `npm run build`. **Output Directory:** `dist`.
3. Variable de entorno: `VITE_API_URL=https://<api>.vercel.app/api`.
   > Vite graba las variables `VITE_*` **en el build**. Si `VITE_API_URL` cambia, hay que volver a desplegar el front: no alcanza con cambiar la variable.
4. **Deploy.**
5. Volver al proyecto de la API, cambiar `FRONTEND_URL` a la URL del front (`https://<front>.vercel.app`, sin barra final) y **redeployar la API**. El CORS usa esa URL exacta.

**Limitación a tener en cuenta:** `FRONTEND_URL` acepta una sola URL. Cada despliegue de preview de Vercel tiene una URL distinta y el CORS las bloquea.
Por eso se prueba siempre en la URL de producción. Si hace falta probar previews, hay que cambiar `cors` para aceptar una lista (decisión pendiente, sección 11).

**Listo cuando:** la lista de humo de la sección 8 pasa en la URL de producción.

---

## 7. Verificación en producción (F6)

Corre la lista de humo completa (sección 8) sobre la URL pública. Como el sitio está contra Supabase, la base es la de siempre: lo que se ve es lo que ya funciona en local.

Después de F6, el grupo comparte la URL y el procedimiento para reportar fallas: el error, la URL, y el header `X-Instancia` si aparece.

---

## 8. Lista de humo

Se corre en local (F2) y en producción (F6), y antes de cada despliegue. Si un ítem falla, no se despliega.

| # | Prueba | Esperado |
| --- | --- | --- |
| 1 | `GET /api/salud` | `{"ok":true}` con el header `X-Instancia` |
| 2 | Abrir el front en la raíz | Carga la cartelera sin errores en la consola del navegador |
| 3 | Entrar a una ruta interna directamente (ej. `/login`) y recargar | No da 404 |
| 4 | Login con un usuario de cada rol: superadmin, empresa, cliente | Entra y ve su panel |
| 5 | Como superadmin: abrir productoras, usuarios y lugares | Las listas cargan |
| 6 | Como empresa: abrir eventos y ventas | Cargan, y las métricas no dan error |
| 7 | Como cliente: comprar entradas (pago simulado) | Se crea la compra y aparece en "Mis entradas" con el QR |
| 8 | Control de acceso: escanear una entrada válida y repetirla | La primera entra; la segunda se rechaza |
| 9 | Consola del navegador | Sin errores de CORS |
| 10 | Vencer la sesión (token viejo o borrar el token) y pedir algo | Vuelve al login |

Los usuarios y contraseñas de demo están en los seeds `10_seed_plataforma.sql` y `11_seed_demo.sql`. No se escriben en este documento.

> El proyecto no tiene tests automáticos. Esta lista es la red de seguridad: si se agregan tests más adelante, reemplazan los ítems que se pueden automatizar.

---

## 9. Exponer el Postgres de la PC y migrar (F7 y F8)

Esta parte es la que más puede romper algo. Se hace solo cuando F6 está estable.

### F7. Exponer la base

1. **Ver si hay CGNAT.** Comparar la IP pública que muestra el router con la que muestra un sitio como cualip.com. Si son distintas, o si la IP del router empieza con `100.64`–`100.127`, hay CGNAT: no se puede abrir un puerto y se usa túnel (paso 3).
2. **Sin CGNAT:**
   - En el router, redirigir un puerto alto (por ejemplo `55432`) al `5432` de la PC servidor.
   - Registrar un nombre gratuito en DuckDNS que siga la IP de la casa, con su actualizador corriendo en la PC.
3. **Con CGNAT (o como alternativa):** un túnel TCP, por ejemplo `ngrok tcp 5432` o playit.gg. Confirmar antes si el plan gratuito cambia la dirección en cada reinicio: si la cambia, cada cambio exige actualizar `DATABASE_URL` en Vercel y redeployar.
4. **SSL obligatorio.** La imagen oficial de Postgres no lo activa. Hay que:
   - Generar un certificado autofirmado con `openssl` y montarlo en el contenedor, con permisos que Postgres acepte (dueño `postgres`, modo 600).
   - Activar `ssl=on` y las rutas del certificado en el comando del servicio.
   - En `pg_hba.conf`, aceptar conexiones externas solo como `hostssl`.
   - La app ya acepta certificados autofirmados (`rejectUnauthorized: false` en `db.js`).
5. **Usuario de la aplicación.** Crear `backstage_app` sin superusuario, dueño solo de las tablas de la app. La API se conecta con ese usuario, no con `postgres`. Es el único cambio de permisos del plan.
6. **Respaldo diario.** Una tarea programada de Windows que corra:
   ```
   docker exec eventos-db pg_dump -U postgres backstage > C:\respaldos\backstage-AAAA-MM-DD.sql
   ```
   Guardar al menos una semana. El volumen de Docker no es un respaldo.
7. **Docker al arrancar:** Docker Desktop → Settings → "Start Docker Desktop when you sign in". La PC servidor no debe suspenderse (Configuración de energía).
8. **Prueba:** desde otra red (datos del celular), conectar con DBeaver usando la dirección pública y `sslmode=require`.

**Listo cuando:** la conexión externa funciona con SSL, el usuario `backstage_app` se conecta, existe un respaldo diario y la PC no se suspende.

### F8. Migrar de Supabase al Postgres propio

Es un corte. Se avisa en el grupo con anticipación, se elige un horario con poco uso y se muestra un aviso de mantenimiento en el front durante el corte.

1. **Base vacía:** levantar el contenedor de producción con los scripts `01`–`09` y **sin** los seeds `10` y `11`, porque los datos vienen de Supabase. (Los seeds `10` y `11` no se borran de la carpeta: solo se montan en desarrollo.)
2. **Exportar desde Supabase** solo los datos, con la URL de sesión:
   ```
   pg_dump --data-only --schema=public --no-owner "<URL-de-sesion-de-Supabase>" > datos.sql
   ```
   `pg_dump` tiene que ser de la misma versión mayor o mayor que la base (cliente 17).
3. **Importar** `datos.sql` en el contenedor. Después, ajustar las secuencias de cada `SERIAL` para que el próximo id no choque. Son las tablas con `id_*` autoincrementales; un `SELECT setval(...)` por cada una.
4. **Comparar filas tabla por tabla** entre Supabase y el contenedor (`SELECT count(*)` en cada una). Tienen que coincidir antes de seguir.
5. **Cambiar `DATABASE_URL` en Vercel** a la base propia (con el usuario `backstage_app`, `sslmode=require`) y redeployar la API.
6. **Probar la lista de humo** completa (sección 8) contra el sitio.
7. **Dejar Supabase intacto dos semanas.** Después se pausa y, más tarde, se da de baja.

**Plan de vuelta atrás:** volver `DATABASE_URL` a Supabase en Vercel y redeployar. **Ojo:** las compras hechas en la base nueva después del corte no existen en Supabase. Por eso el corte tiene que ser corto y anunciado, y no se vuelve atrás pasado un tiempo de uso.

**Listo cuando:** la lista de humo pasa contra el sitio con la base propia, y las cantidades de filas coinciden.

---

## 10. Demo de Sistemas Operativos (F9), en paralelo

Es independiente del sitio público. Usa el mismo Postgres de la PC de acceso, con nginx y tres réplicas de la API.

1. Traer a `main` los archivos de la rama `docker-nginx`: `nginx/nginx.conf`, `nginx/Dockerfile`, `api-eventos/Dockerfile`, `.dockerignore`. **No** mergear la rama: tiene conflictos con `main` y un `index.js` viejo.
2. En el `docker-compose.yml` de la raíz, agregar `nginx`, `api1`, `api2`, `api3` según la rama, con estos cambios:
   - Las réplicas toman `DB_*` del `.env` y **no** `DATABASE_URL`, para usar la base del contenedor.
   - Cada réplica tiene `JWT_SECRET` (el mismo en las tres) y `INSTANCIA` (`api1`, `api2`, `api3`).
   - El servicio `db` sigue con el puerto solo en `127.0.0.1` para desarrollo. Para las demás PCs, ver el plan de SO.
   - Los scripts `01`–`12` montados como en F1: la lista no cambia.
3. Levantar: `docker compose up -d --build`.
4. Probar el balanceo: `curl http://localhost/api/salud` repetido seis veces alterna `api1`, `api2`, `api3`.
5. Probar tolerancia: `docker compose stop api2`, repetir el `curl`, y verificar que la app sigue andando. Después `docker compose start api2`.
6. Correr la lista de humo (sección 8) en `http://localhost`.

**Listo cuando:** el balanceo se ve, la app anda con una réplica caída, y la lista de humo pasa.

Detalle de la demo y del reparto entre PCs: [plan de SO](../sistemas-operativos/plan.md).

---

## 11. Data warehouse (F10)

No afecta al sitio público. Se trabaja sobre el Postgres local, siguiendo [data-warehouse.md](../base-de-datos/data-warehouse.md).

**Regla importante:** los scripts del DW (`20`, `21`, `22`, `23`) **no se agregan al `docker-compose.yml`** para correrse solos. Un volumen que ya existe no vuelve a correr los scripts de inicio, y el compose de producción no debe cambiar por el DW.
Se cargan a mano con `psql`, en orden, y solo en bases de desarrollo. En producción se evalúan por separado, después de que el sitio público esté estable.

---

## 12. Riesgos y vuelta atrás

| Riesgo | Cómo se previene | Vuelta atrás |
| --- | --- | --- |
| La API nueva rompe el login | Lista de humo en local antes de desplegar | Promover el deployment anterior en Vercel |
| El front no ve la API por CORS | `FRONTEND_URL` exacto a la URL de producción; sin barra final | Corregir la variable y redeployar la API |
| Cambiar `VITE_API_URL` y no ver efecto | Recordar que se graba en el build | Redeployar el front |
| Vercel agota las conexiones | `DB_POOL_MAX=3` | Bajar más el valor |
| La PC servidor se apaga | Sin suspensión, Docker al arrancar, `restart: unless-stopped` | Mientras esté apagada, el sitio no anda: avisar en el grupo |
| La IP pública cambia | DuckDNS o túnel con nombre fijo | Actualizar `DATABASE_URL` en Vercel |
| Un script de migración rompe datos | Scripts numerados, probados en local, Supabase intacta dos semanas | Volver `DATABASE_URL` a Supabase (ver F8) |
| Se borra el volumen de producción | Nunca `down -v` en producción; respaldo diario | Restaurar el último `pg_dump` |
| Se filtra el `JWT_SECRET` o la contraseña de la base | Secretos solo en `.env` y en Vercel; rotar si se exponen | Cambiar el secreto y redeployar; las sesiones se invalidan |

---

## 13. Consigna de Sistemas Operativos: qué muestra cada paso

| Requisito | Dónde se muestra |
| --- | --- |
| Servicios en Docker, todos corriendo | F1 (base), F9 (todos los contenedores), `docker compose ps` |
| Réplicas en contenedores | F9, paso 2 y `docker compose ps` |
| `docker-compose.yml` con la infraestructura, las réplicas y la red | F1 y F9 |
| Nginx como balanceador | F9, pasos 4 y 5, y el `nginx.conf` |
| Una única base dockerizada | F1; en F9 un dato cargado desde una réplica se ve desde todas |

---

## 14. Decisiones pendientes

1. **Cuál PC es el servidor** (la base y la PC de acceso). Tiene que quedar prendida y, idealmente, sin CGNAT.
2. **Port forwarding o túnel**, según el resultado de la prueba de CGNAT (F7).
3. **Preview de Vercel:** ¿se acepta una lista de orígenes en el CORS (cambio de código) o se prueba solo en producción?
4. **Registro de clientes:** ¿se agregan fecha de nacimiento y provincia para análisis demográfico? Es un script nuevo y un cambio en el front.
5. **Fecha de la migración (F8)** y quién la ejecuta.
6. **Cuenta de Vercel:** ¿la del grupo o la de una persona? Debe quedar en la cuenta que vaya a administrar los dos proyectos.
