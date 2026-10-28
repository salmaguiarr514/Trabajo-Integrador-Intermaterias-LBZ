# Sistemas Operativos — resumen y plan del grupo

**Qué evalúa:** el despliegue de la app de Programación 2 **replicada en contenedores**, con **Nginx como balanceador de carga**
en la máquina de acceso y **una única base de datos SQL dockerizada**. Texto completo de la cátedra: [consigna.md](consigna.md).

## 1. Qué hay que mostrar

| Exigencia | Cómo lo mostramos |
| --- | --- |
| **Servicios en Docker:** todos los componentes y réplicas corriendo en contenedores | `docker compose ps` en cada máquina: nginx, las réplicas de la API y Postgres en estado `running` / `healthy` |
| **Docker Compose:** la infraestructura, las réplicas y la red | Recorrer [docker-compose.acceso.yml](../../docker-compose.acceso.yml) y [docker-compose.nodo.yml](../../docker-compose.nodo.yml): servicios, puertos, volumen de la base, variables |
| **Configuración de Nginx:** el balanceo entre nodos | Recorrer [default.conf.template](../../nginx/default.conf.template) (`upstream`, `proxy_pass`, reintento si un nodo cae) y mostrarlo funcionando (sección 6) |

## 2. Cómo lo armamos

Decidido por el grupo (2026-10-27): **todo corre en Linux**, en **3 computadoras distintas**, con todo dockerizado.

| Decisión | Detalle |
| --- | --- |
| **Linux en las 3 PCs** | Una **máquina virtual** con Ubuntu Server en cada PC (VirtualBox), con **Docker Engine** adentro |
| **Red de las VMs en "Adaptador puente"** | Con NAT (el valor por defecto) las VMs no se ven entre sí. Con puente, cada VM tiene una IP de la red local |
| **Qué se replica** | La **API** (el back): una réplica en cada PC. El front son archivos estáticos que sirve nginx; no se replica |
| **PC de acceso (PC 1)** | Corre **nginx** (único punto de entrada: sirve el front y reparte `/api`), **Postgres** (la base única) y la réplica **api1** |
| **PCs 2 y 3** | Corren solo una réplica de la API (api2 y api3), conectadas al Postgres de la PC 1 por la red local |
| **La base es un contenedor** | `postgres:17-alpine` dentro de la VM de la PC 1, no un Postgres instalado en el sistema |

```mermaid
flowchart LR
    N[Navegador] -->|http://IP-PC1| NG
    subgraph PC1 [PC 1 - acceso - VM Linux]
        NG[nginx :80<br/>front + balanceo]
        DB[(Postgres :5432<br/>base única)]
        A1[api1 :3000]
    end
    subgraph PC2 [PC 2 - VM Linux]
        A2[api2 :3000]
    end
    subgraph PC3 [PC 3 - VM Linux]
        A3[api3 :3000]
    end
    NG -->|/api round robin| A1
    NG --> A2
    NG --> A3
    A1 --> DB
    A2 -->|red local| DB
    A3 -->|red local| DB
```

## 3. Supabase y la base dockerizada

El sitio público en Vercel sigue usando **Supabase** (la base "vía web"). El Postgres dockerizado es **el de esta demo**
(y el del data warehouse en local). No se expone a internet ni se migra nada: eso se descartó por innecesario para la consigna.
Detalle en [infraestructura.md](../comun/infraestructura.md).

**¿Cómo se elige la base?** Sin tocar código. [db.js](../../api-eventos/src/data/db.js) usa `DATABASE_URL` si existe; si no, las `DB_*`.
Los compose de Docker **no pasan `DATABASE_URL`**, así que las réplicas usan siempre el Postgres del contenedor.

**¿Los scripts SQL corren en el contenedor?** Sí: son SQL estándar de PostgreSQL y las extensiones (`pgcrypto`, `btree_gist`) vienen en la imagen oficial.
El compose monta la carpeta [api-eventos/database/](../../api-eventos/database/) entera en `/docker-entrypoint-initdb.d`, y Postgres corre los `.sql`
**solo la primera vez** (volumen vacío), en orden alfabético. `00_reset.sql` también corre, pero en una base vacía no hace nada. Incluye los seeds `10` y `11`,
así que la demo arranca con lugares, productoras, eventos y ventas.

> **Pendiente de verificar:** ninguno probó todavía los scripts en un Postgres vacío. Es lo primero que hay que hacer (paso 3 de la sección 5).

**Regla:** todo cambio de esquema va en un **script nuevo numerado** (`13_…sql`), nunca editando la base a mano. Para que un script nuevo entre en la base de la demo
hay que recrear el volumen (`docker compose -f docker-compose.acceso.yml down -v`, **solo en la demo**).

## 4. Qué hay en el repo

| Archivo | Qué hace |
| --- | --- |
| `docker-compose.acceso.yml` | PC 1: `db` (Postgres con los scripts y healthcheck), `api` (api1) y `nginx` |
| `docker-compose.nodo.yml` | PC 2 y 3: solo `api`, con `DB_HOST` apuntando a la IP de la PC 1 |
| `nginx/default.conf.template` | `upstream` con las 3 IPs, `proxy_pass` de `/api/`, reintento si una réplica cae, log con el nodo que respondió, front de React |
| `nginx/Dockerfile` | Compila el front con `VITE_API_URL=/api` y lo copia a nginx junto con el template |
| `api-eventos/Dockerfile` | Imagen de la API (`node:24-alpine`) |
| `.env.example` | Variables: base, `JWT_SECRET`, IPs de las 3 PCs, nombre de la réplica |

Las IPs no están escritas en el `nginx.conf`: la imagen oficial de nginx arma el archivo desde el template con las variables `IP_PC1`, `IP_PC2` e `IP_PC3` del `.env`.
Los archivos salen de la rama `docker-nginx` (Salma, 2026-10-08), que **no se mergea** porque tiene conflictos con `main` y un `index.js` viejo.

## 5. Plan de trabajo

| # | Paso | Quién | Estado |
| --- | --- | --- | --- |
| 1 | En cada PC: VirtualBox + VM Ubuntu Server (red en "Adaptador puente") + Docker Engine | Cada uno | 🟡 Salma instalando |
| 2 | Archivos Docker en `main` (compose de acceso y de nodo, nginx con template, `.env.example`) | | ✅ 2026-10-27 (sin probar) |
| 3 | **Una sola VM:** `docker compose -f docker-compose.acceso.yml up -d --build` con las tres IPs iguales a la de esa VM. Verificar que los scripts corren en el Postgres vacío y que la app funciona en `http://IP-VM` | | ⬜ |
| 4 | Ver el balanceo: varios pedidos a `/api/salud` y la respuesta alterna; apagar una réplica y ver que la app sigue | | ⬜ |
| 5 | **Tres PCs:** copiar el repo y el `.env` (mismo `JWT_SECRET`, IPs reales, `INSTANCIA`) a cada VM; levantar los nodos con `docker-compose.nodo.yml` y la PC 1 con el de acceso | Los 3 | ⬜ |
| 6 | Abrir los puertos 80, 3000 y 5432 si hay firewall (`ufw allow`) y probar `curl http://IP:3000/api/salud` desde otra PC | Los 3 | ⬜ |
| 7 | Ensayo completo con el guion de la sección 6 | Los 3 | ⬜ |
| 8 | Preparar la explicación del compose y del template de nginx para la defensa | Los 3 | ⬜ |

**Plan B (falla la red el día de la demo):** todo en una VM. En el `.env`, `IP_PC2` e `IP_PC3` apuntan a la IP de esa VM y se levantan otras dos réplicas
con `docker-compose.nodo.yml` usando otro nombre de proyecto y otro puerto. Muestra Docker, el compose y el balanceo, pero no las PCs distintas.

El desarrollo de la app sigue contra Supabase como hasta ahora.

## 6. Guion de la demo

1. `docker compose ps` en cada PC: todos los contenedores arriba.
2. Abrir la app desde el navegador apuntando a la PC de acceso y usarla normalmente (login, panel, cartelera).
3. Pedir varias veces `http://IP-PC1/api/salud`: responde una réplica distinta cada vez (`"instancia": "api1"`, `"api2"`, `"api3"`).
   En las herramientas del navegador se ve el header `X-Instancia`.
4. `docker compose -f docker-compose.acceso.yml logs nginx`: cada línea muestra a qué nodo mandó nginx el pedido (`-> 192.168.x.x:3000`).
5. **Tolerancia a fallas:** apagar una réplica (`docker compose -f docker-compose.nodo.yml stop` en la PC 2) y mostrar que la app sigue funcionando:
   nginx reintenta en otra (`proxy_next_upstream`).
6. Mostrar que la sesión sigue aunque cambie de réplica: el login vive en el token (JWT), no en la memoria de una réplica.
7. Mostrar que hay **una sola base**: un dato que se carga desde una réplica lo ven todas.

## 7. Dudas para el profesor

Ya decidido: Linux en las 3 PCs (VMs), réplicas en PCs físicas distintas, base y nginx en la PC de acceso.

1. **"Una única base de datos … dockerizada (la SQL) y la otra vía web":** ¿"la otra" es una segunda base en la web (Supabase),
   o se refiere a que la aplicación se accede vía web? Hoy lo resolvemos así: la dockerizada es la de la demo y Supabase es la del sitio en Vercel.
2. Docker Compose maneja los contenedores de **una** PC. Con réplicas en PCs distintas, ¿alcanza con **un compose por PC**
   (acceso: nginx + base + api; nodos: api), o espera **Docker Swarm** (`docker stack deploy`)? Hoy hacemos un compose por PC.

## 8. Riesgos y cómo prevenirlos

| Riesgo | Prevención |
| --- | --- |
| La red de la facultad **aísla a los dispositivos** y las VMs no se ven entre sí | Llevar un router o usar el **hotspot de un celular** para las 3 PCs. Ensayar antes |
| La VM está en NAT y las otras PCs no la alcanzan | Adaptador puente en la configuración de red de VirtualBox. Comprobar con `ping` y `curl` entre PCs |
| El **firewall** (`ufw`) bloquea los puertos 80, 3000 o 5432 | `sudo ufw allow 80,3000,5432/tcp` y probar con `curl http://IP:3000/api/salud` desde otra PC |
| Las IPs de las PCs cambian de un día para otro | Están en el `.env`, no en el nginx: revisarlas y recrear nginx (`up -d`) antes de la demo. Mejor, IP fija en el router |
| Una réplica con otro `JWT_SECRET` rechaza las sesiones de las demás | El mismo `.env` en las 3 PCs (pasado por privado) |
| Los scripts fallan en el Postgres vacío | Probarlo en el paso 3, bastante antes de la demo |
| Falla la red el día de la demo | Plan B de la sección 5 |
