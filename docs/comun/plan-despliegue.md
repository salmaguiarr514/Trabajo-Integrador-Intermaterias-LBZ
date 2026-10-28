# Plan de despliegue paso a paso

Cómo llevar Backstage desde la PC de cada uno hasta el sitio público en Vercel (con Supabase) y cómo armar la demo de Sistemas Operativos con Docker en Linux.
Es el plan operativo: el porqué de cada decisión está en [infraestructura.md](infraestructura.md), y las fases del producto en [plan-desarrollo.md](../programacion-2/plan-desarrollo.md) §7.

Estado al 2026-10-28: el sitio está publicado en Vercel contra Supabase y se actualiza solo con cada push a `main` (ver [§6.1](#61-cómo-quedó-el-despliegue)).
**Sitio: https://backstage-ebon.vercel.app** · API: https://backstage-api-sage.vercel.app/api
Los archivos Docker de la demo de SO ya están en `main` (sin probar). El Postgres propio expuesto a internet y la migración desde Supabase se **descartaron** (ver [infraestructura.md](infraestructura.md)).

---

## 0. Principios para no romper nada

1. **Un cambio por vez, cada uno con su prueba.** Cada fase tiene un "listo cuando" y un plan de vuelta atrás. No se pasa a la siguiente sin cumplirlo.
2. **Supabase es la base del sitio público.** El Postgres dockerizado es solo para la demo de SO y el data warehouse.
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
| Front (`front-eventos`) | `npm run dev` en `localhost:5173` | Build dentro de la imagen de nginx | Vercel, proyecto `backstage` |
| API (`api-eventos`) | `npm run dev` en `localhost:3000` | Contenedores `api1`, `api2`, `api3` | Vercel, proyecto `backstage-api` |
| Base de datos | Postgres en Docker local, o Supabase | Postgres en Docker, PC de acceso | Supabase |
| Balanceo | No aplica | nginx en la PC de acceso | No aplica: lo hace Vercel |
| Sistema | Windows o Linux | **Linux** (VM en cada una de las 3 PCs) | — |

Qué cambia entre entornos, y solo eso, se controla con variables de entorno. El código es el mismo.

---

## 2. Herramientas

| Herramienta | Para qué | Cómo instalar |
| --- | --- | --- |
| **VirtualBox + Ubuntu Server** | La demo de SO corre en Linux: una VM por PC, con la red en **"Adaptador puente"** | virtualbox.org y ubuntu.com/download/server |
| **Docker Engine** (dentro de la VM) | Correr los contenedores de la demo de SO | docs.docker.com/engine/install/ubuntu |
| **Docker Desktop** (opcional, en Windows) | Probar la base en local sin la VM | docker.com |
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
| F1 | Postgres en Docker | F0 | `docker-compose.acceso.yml` (o solo su servicio `db`), scripts `01`–`12` cargados | 🟡 archivos listos, sin probar |
| F2 | App local contra la base local | F1 | API y front funcionando en la PC contra el Postgres del contenedor | ⬜ |
| F3 | Preparar el código para Vercel | F2 | Commits con los cambios de la sección 5 | ✅ 2026-10-26 (probado en local simulando la función; F2 no hizo falta porque el sitio público usa Supabase) |
| F4 | Desplegar la API en Vercel | F3 | `/api/salud` responde desde internet, contra Supabase | ✅ 2026-10-27 |
| F5 | Desplegar el front en Vercel | F4 | Front público que habla con la API pública | ✅ 2026-10-27 |
| F6 | Verificación en producción | F5 | Lista de humo completa en el sitio público | 🟡 probados 1, 2, 3, 9 y login de superadmin; faltan compra, control de acceso y mails |
| F9 | Demo de Sistemas Operativos | F1 | En 3 PCs con Linux: nginx y base en la PC de acceso, una réplica de la API en cada PC | 🟡 archivos listos, sin probar |
| F10 | Data warehouse | F1 | Esquema `dw` cargado en la base local (ver [data-warehouse.md](../base-de-datos/data-warehouse.md)) | ⬜ |

**Orden:** F0 → F1 → F2 → F3 → F4 → F5 → F6 primero. El sitio público queda online con Supabase, que ya anda, antes de tocar la base.
F9 y F10 son independientes del sitio público y pueden ir en paralelo. (Las fases F7 y F8, exponer el Postgres propio y migrar desde Supabase, se descartaron el 2026-10-27.)

---

## 4. Fases de entorno local (F0 a F2)

### F0. Preparar el entorno

1. Instalar las herramientas de la sección 2.
2. Clonar o actualizar el repo: `git pull` en `main`.
3. Verificar Docker: `docker run --rm hello-world` debe imprimir "Hello from Docker!".
4. Verificar el puerto 5432 libre: `netstat -ano | findstr :5432`. Si hay un Postgres instalado en Windows, detenerlo desde `services.msc` o cambiar el puerto de la izquierda en el compose (`"127.0.0.1:5433:5432"`).

**Listo cuando:** Docker responde, DBeaver está instalado y el puerto 5432 está libre o el cambio está hecho.

### F1. Postgres en Docker

El Postgres está en [docker-compose.acceso.yml](../../docker-compose.acceso.yml), en la **raíz del repo** (se commitea: no tiene secretos, las claves salen del `.env`).
Monta la carpeta `api-eventos/database/` entera en `/docker-entrypoint-initdb.d`: Postgres corre los `.sql` solo la primera vez (volumen vacío), en orden alfabético.
Para probar solo la base en la PC de cada uno: copiar `.env.example` a `.env` y correr `docker compose -f docker-compose.acceso.yml up -d db`.

Levantar y verificar:

```
docker compose -f docker-compose.acceso.yml up -d db
docker compose -f docker-compose.acceso.yml ps
docker compose -f docker-compose.acceso.yml logs db
docker compose -f docker-compose.acceso.yml exec db psql -U postgres -d backstage -c "\dt"
docker compose -f docker-compose.acceso.yml exec db psql -U postgres -d backstage -c "\dv"
```

- En los logs, cada script aparece como `running /docker-entrypoint-initdb.d/…`, y al final `database system is ready to accept connections`.
- `\dt` lista **16 tablas** (`empresas`, `usuarios`, `lugares`, `escenarios`, `espacios`, `elementos_plano`, `artistas`, `eventos`, `jornadas`, `evento_escenarios`, `presentaciones`, `tarifas`, `compras`, `entradas`, `ingresos`, `codigos_verificacion`).
- `\dv` lista **5 vistas** (`v_lugares`, `v_disponibilidad`, `v_cartelera`, `v_asistencia`, `v_recaudacion`).
- En DBeaver: nueva conexión PostgreSQL, host `localhost`, puerto `5432`, base `backstage`, usuario y contraseña del `.env`. Consulta de prueba: `SELECT count(*) FROM eventos;`.

Si un script falla: el log dice cuál y por qué. Se corrige el script, se borra el volumen **de la base de desarrollo** (`docker compose -f docker-compose.acceso.yml down -v`) y se vuelve a levantar. Esto solo vale en desarrollo.

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
   DB_PASSWORD=<la del .env de Docker>
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
Falta un archivo que Vercel reconozca como función: `api-eventos/api/index.js`, que reexporta la app.

```js
export { default } from "../src/index.js";
```

Y en `api-eventos/vercel.json`, una regla que manda todas las rutas `/api/*` a esa función.
Con un *rewrite*, la función recibe la URL original, así que Express ve `/api/salud`, `/api/admin/usuarios`…:

```json
{ "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }] }
```

> Se eligió esto en lugar de un archivo `api/[...ruta].js` (la idea original) porque las rutas *catch-all* con corchetes son propias de Next.js; con la regla de `vercel.json` no hay dudas.

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

Supabase está en EE. UU. (`aws-1-us-west-2`, Oregón), por eso `api-eventos/vercel.json` ya trae `"regions": ["pdx1"]` (Portland): la función queda al lado de la base. No se cambia.

### F3.5. Fecha de nacimiento y provincia en el registro

Decidido el 2026-10-22. Cada cliente que se registra carga su fecha de nacimiento y su provincia. Sirve para el análisis de clientes del data warehouse
([data-warehouse.md](../base-de-datos/data-warehouse.md)). Es un cambio de esquema, así que va como script numerado y se avisa en el grupo antes de correrlo.

1. **Script nuevo** `api-eventos/database/13_usuarios_nacimiento_provincia.sql`:
   ```sql
   ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
   ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS provincia VARCHAR(100);
   ```
   Las columnas son **nullable** en la base: los usuarios que ya existen (los de los seeds y los de Supabase) no tienen esos datos, y no se les pide nada después.
   Quien se registra desde ahora **sí** los tiene que cargar: la obligatoriedad se controla en la API, no en la base.
2. **Montaje en Docker:** el compose de acceso monta la carpeta `database/` entera, así que `13_…` se carga solo en bases nuevas. Como el volumen de desarrollo ya existe, en las bases que ya están creadas se corre a mano con `psql -f`, en orden. Nunca con `down -v`.
3. **Supabase:** el script se corre también ahí, **avisando antes en el grupo**, porque la base es compartida.
4. **Lista cerrada de provincias:** las 24 jurisdicciones argentinas, en una constante compartida entre API y front. Una lista cerrada evita textos libres que después no se pueden agrupar en el DW.
5. **API:** en la validación del registro de clientes (`POST` de registro, con zod), `fecha_nacimiento` es obligatoria, tiene que ser una fecha pasada y no puede ser de hace más de 120 años; `provincia` tiene que estar en la lista.
6. **Front:** el formulario de `/registro` suma los dos campos, con mensajes de error por campo (ya existen para el resto del formulario).
7. **Aviso legal:** el formulario explica para qué se usan los datos (análisis estadístico interno) y pide el consentimiento, según la Ley 25.326 de protección de datos personales. El texto lo revisa el grupo antes de publicarlo.
8. **Prueba:** lista de humo, ítem 11. Además, `SELECT fecha_nacimiento, provincia FROM usuarios WHERE rol = 'cliente' ORDER BY id_usuario DESC LIMIT 1;` muestra los datos del cliente recién creado.

**Listo cuando:** el registro exige los dos datos, la base los guarda, los usuarios viejos siguen entrando sin cambios, y la lista de humo pasa.

**Listo cuando:** los cuatro commits de F3 (y F3.5) están en `main`, `npm run build` del front pasa, y la lista de humo pasa en local.

---

## 6. Desplegar en Vercel (F4 y F5)

Hay dos proyectos de Vercel, uno por carpeta. Los dos se conectan al mismo repo de GitHub.

### F4. API

1. En Vercel: **Add New → Project**, elegir el repo, y en **Root Directory** poner `api-eventos`.
2. **Framework Preset:** Other. **Build Command** y **Output Directory:** vacíos (no hay build).
3. Antes de desplegar, cargar las variables de entorno (Settings → Environment Variables):

| Variable | Valor | Notas |
| --- | --- | --- |
| `DATABASE_URL` | URL de **sesión** de Supabase (puerto 5432 del pooler) | Ver nota sobre la URL de transacción abajo |
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

### 6.1. Cómo quedó el despliegue

| Proyecto de Vercel | Carpeta (Root Directory) | URL de producción |
| --- | --- | --- |
| `backstage` | `front-eventos` | https://backstage-ebon.vercel.app |
| `backstage-api` | `api-eventos` | https://backstage-api-sage.vercel.app/api |

Los dos están en la cuenta de Vercel de Salma (equipo `banco5`). Las variables de la API son las de F4, con Gmail ya cargado (`Backstage.entradas@gmail.com`).
`ENTRADAS_SECRET` y `VERIFICACION_SECRET` no están cargadas: se usa `JWT_SECRET`.

**Cómo se actualiza.** Vercel solo puede conectarse a repos de la cuenta de GitHub de quien lo administra, así que hay un fork en el medio:

1. Se hace push a `main` de este repo (`urendadiego/Trabajo-Integrador-Intermaterias-LBZ`), como siempre.
2. El fork `salmaguiarr514/Trabajo-Integrador-Intermaterias-LBZ` trae esos cambios cada 15 minutos con una GitHub Action (`.github/workflows/sincronizar-fork.yml`, solo existe en el fork).
3. Vercel ve el cambio en el fork y despliega el front y la API.

Reglas para que no se trabe:
- **Nunca hacer push al fork.** Todo va a este repo. Si el fork tiene cambios propios que chocan, la sincronización falla y el sitio deja de actualizarse.
- **No agregar archivos en `.github/workflows/` de este repo.** La Action del fork no tiene permiso para copiar workflows y la sincronización fallaría.
- Si se necesita una variable de entorno nueva en producción, avisar a Salma: se carga en el panel de Vercel, no en el repo.
- Si un cambio no aparece en el sitio después de 15 minutos, revisar la pestaña **Actions** del fork (una cruz roja indica que la sincronización falló).

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
| 11 | Registrar un cliente nuevo (con fecha de nacimiento y provincia) | Se crea y los dos datos quedan guardados; sin ellos, el registro se rechaza |

Los usuarios y contraseñas de demo están en los seeds `10_seed_plataforma.sql` y `11_seed_demo.sql`. No se escriben en este documento.

> El proyecto no tiene tests automáticos. Esta lista es la red de seguridad: si se agregan tests más adelante, reemplazan los ítems que se pueden automatizar.

---

## 9. Exponer el Postgres y migrar (F7 y F8): descartado

Se había planeado abrir el Postgres de una PC a internet (CGNAT, port forwarding o túnel, SSL, usuario `backstage_app`, respaldo) y migrar los datos desde Supabase.
Se descartó el 2026-10-27: la consigna de SO no lo pide y era lo más riesgoso. El sitio público queda con Supabase.

---

## 10. Demo de Sistemas Operativos (F9), en paralelo

Independiente del sitio público. Todo en **Linux** (una VM por PC, red en "Adaptador puente"). Detalle, guion y riesgos en el [plan de SO](../sistemas-operativos/plan.md).

1. En cada VM: instalar Docker Engine, clonar el repo y copiar `.env.example` a `.env`. Mismo `JWT_SECRET` en las 3; `IP_PC1`, `IP_PC2` e `IP_PC3` con las IPs de las VMs; `INSTANCIA=api2` en la PC 2 y `api3` en la PC 3.
2. **PC 1 (acceso):** `docker compose -f docker-compose.acceso.yml up -d --build` levanta Postgres (con los scripts `01`–`12`), api1 y nginx.
3. **PC 2 y PC 3:** `docker compose -f docker-compose.nodo.yml up -d --build`.
4. Probar el balanceo: `curl http://IP_PC1/api/salud` repetido seis veces alterna `api1`, `api2`, `api3`.
5. Probar tolerancia: `docker compose -f docker-compose.nodo.yml stop` en la PC 2, repetir el `curl`, y verificar que la app sigue andando. Después `start`.
6. Correr la lista de humo (sección 8) en `http://IP_PC1`.

**Listo cuando:** el balanceo se ve, la app anda con una réplica caída, y la lista de humo pasa.

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
| Se borra el volumen de la base de la demo | No usar `down -v` salvo para recrear la demo; los datos de la demo salen de los seeds | Volver a levantar: los seeds la recrean |
| Se filtra el `JWT_SECRET` o la contraseña de la base | Secretos solo en `.env` y en Vercel; rotar si se exponen | Cambiar el secreto y redeployar; las sesiones se invalidan |

---

## 13. Consigna de Sistemas Operativos: qué muestra cada paso

| Requisito | Dónde se muestra |
| --- | --- |
| Servicios en Docker, todos corriendo | F9 (todos los contenedores en las 3 PCs), `docker compose ps` |
| Réplicas en contenedores | F9, paso 2 y `docker compose ps` |
| Docker Compose con la infraestructura, las réplicas y la red | F9: `docker-compose.acceso.yml` y `docker-compose.nodo.yml` |
| Nginx como balanceador | F9, pasos 4 y 5, y `nginx/default.conf.template` |
| Una única base dockerizada | F1; en F9 un dato cargado desde una réplica se ve desde todas |

---

## 14. Decisiones pendientes

1. **Cuál PC es la de acceso** (nginx + base + api1) en la demo de SO.
2. **IPs fijas** para las 3 VMs, o revisarlas antes de cada ensayo.
3. **Preview de Vercel:** ¿se acepta una lista de orígenes en el CORS (cambio de código) o se prueba solo en producción?
4. **Registro de clientes:** ¿se agregan fecha de nacimiento y provincia para análisis demográfico? Es un script nuevo y un cambio en el front.
5. **Cuenta de Vercel:** ¿la del grupo o la de una persona? Debe quedar en la cuenta que vaya a administrar los dos proyectos.
