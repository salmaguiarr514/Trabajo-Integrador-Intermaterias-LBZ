# Backstage – Trabajo práctico intermaterias

Un mismo sistema de gestión de eventos que se desarrolla y evalúa en **cuatro materias**.
Cada profesor pide algo distinto, así que la documentación está ordenada **por materia** en [docs/](docs/README.md).

| Materia | Qué evalúa | Entregable | Documentos |
| --- | --- | --- | --- |
| Programación 2 | El software: arquitectura, API, front | Código en este repo | [docs/programacion-2/](docs/programacion-2/plan-desarrollo.md) |
| Base de Datos | Modelo de datos y scripts SQL | DER + [api-eventos/database/](api-eventos/database/) | [docs/base-de-datos/](docs/base-de-datos/der.md) |
| Sistemas de Información | Relevamiento, análisis y diseño (DDD) | Avances en clase y un **documento formal escrito** | [docs/sistemas-de-informacion/](docs/sistemas-de-informacion/plan.md) |
| Sistemas Operativos | Despliegue con réplicas, Docker y Nginx, en Linux y 3 PCs | Demo + `docker-compose.app.yml` (front y back), `docker-compose.servidores.yml` (nginx y base) y `nginx/nginx.conf.template` | [docs/sistemas-operativos/](docs/sistemas-operativos/plan.md) |

> **Antes de seguir, ver [Alcance a resolver entre materias](docs/comun/alcance-entre-materias.md).**
> El alcance que fija Sistemas de Información no coincide con el del plan de desarrollo.

```
proyecto-eventos/
├── api-eventos/        → backend (Node + Express + PostgreSQL en Supabase) · puerto 3000
│   └── database/       → scripts SQL numerados
├── front-eventos/      → frontend (React + Vite; Ant Design en los paneles, Tailwind en el sitio público) · puerto 5173
└── docs/               → documentación por materia (índice en docs/README.md)
```

---

## El software

Plataforma para **productoras de recitales y festivales**. Cada productora es un *tenant* (empresa).
Hay tres perfiles: **superadmin** (nosotros, panel `/admin`), **empresa** (personal de una productora, panel `/panel`)
y **cliente** (el público que compra entradas).

El negocio está en [docs/comun/dominio.md](docs/comun/dominio.md); los roles, endpoints y fases, en
[docs/programacion-2/plan-desarrollo.md](docs/programacion-2/plan-desarrollo.md).

### Cómo correrlo

Se necesitan **dos terminales**, una para cada parte.

```bash
# Terminal 1
cd api-eventos
npm install
npm run dev        # http://localhost:3000

# Terminal 2
cd front-eventos
npm install
npm run dev        # http://localhost:5173  ← abrir esto en el navegador
```

#### Archivos `.env` (no se suben a GitHub)

**api-eventos/.env** (la `DATABASE_URL` se pide por privado al grupo)
```
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://...supabase...
JWT_SECRET=un-texto-largo-y-secreto
```

**front-eventos/.env**
```
VITE_API_URL=http://localhost:3000/api
```

Cada carpeta tiene un `.env.example` para copiar. Más detalle de la API en [api-eventos/README.md](api-eventos/README.md).

### Front

| Ruta | Quién | Pantalla |
| --- | --- | --- |
| `/` | todos | Cartelera: eventos publicados, con búsqueda (artista, género, lugar) y filtros por tipo y ciudad |
| `/eventos/:id` | todos | Detalle: grilla por jornada, abono, tarifas con lo que queda libre; se eligen entradas de varias tarifas |
| `/checkout/:id` | cliente | Resumen calculado por la API (subtotal + service charge) y pago simulado (una tarjeta terminada en 0000 se rechaza) |
| `/mis-entradas` | cliente | Entradas con su QR, agrupadas por evento, e historial de compras |
| `/login`, `/registro` | todos | Ingreso y alta de clientes. En desarrollo el login muestra los usuarios de prueba |
| `/admin` | superadmin | Inicio: recaudación por service charge (total, por mes y por productora), entradas vendidas, eventos por estado |
| `/admin/usuarios` | superadmin | Usuarios de todos los roles: alta y edición de superadmins y personal de productoras, activar/desactivar |
| `/admin/lugares`, `/admin/lugares/:id` | superadmin | Catálogo de lugares; en el detalle, pestañas de sectores (con capacidad), escenarios y datos. Los propios de cada productora se ven en solo lectura |
| `/admin/artistas` | superadmin | Artistas de todas las productoras (solo lectura) |
| `/admin/eventos` | superadmin | Eventos de todas las productoras, con despublicar y cancelar |
| `/admin/empresas` | superadmin | Listado de productoras (búsqueda, orden, filtro por estado, service charge, eliminar) |
| `/admin/empresas/nueva`, `/admin/empresas/:id/editar` | superadmin | Formulario de alta y edición (incluye % de service charge y activar/desactivar) |
| `/panel` | empresa | Inicio: eventos publicados y en borrador, entradas vendidas, lo recaudado (sin service charge), próximos eventos y últimas ventas |
| `/panel/lugares`, `/panel/lugares/:id` | empresa | Los lugares de la plataforma (solo lectura) y los propios (con sectores y escenarios). Son las mismas pantallas que usa el superadmin |
| `/panel/eventos` | empresa | Eventos de la productora, con su estado y qué le falta para publicarse |
| `/panel/eventos/:id/ventas` | empresa | Ventas del evento: totales, ocupación por día y sector, ventas por tarifa y por día, asistencia y últimas compras |
| `/panel/acceso` | empresa | Control de acceso en la puerta: se elige evento y día, se escanea o pega el código y dice ADELANTE o NO PASA |
| `/panel/eventos/nuevo`, `/panel/eventos/:id` | empresa | Asistente en 6 pasos: datos, jornadas, escenarios, line-up (grilla escenario × horario), tarifas y publicar |
| `/panel/artistas` | empresa | Alta, edición, baja y borrado de los artistas de la productora |
| `/panel/mi-productora` | empresa | Datos de contacto de la productora (el CUIT y el % los maneja el superadmin) |
| cualquier otra | todos | Página 404 |

Si alguien entra a una ruta que no es de su rol, va a la pantalla de inicio de su rol; sin sesión, al login.

```
front-eventos/src/
├── main.jsx                 → BrowserRouter + tema de Ant Design + AuthProvider
├── App.jsx                  → QUÉ pantallas existen y quién puede verlas
├── context/                 → AuthProvider.jsx (sesión) y auth.js (useAuth, inicioDeRol)
├── services/api.js          → axios con el token y cierre de sesión si la API responde 401
├── services/*Service.js     → llamadas a la API, uno por recurso
├── routes/RutaProtegida.jsx → <RutaProtegida roles={["superadmin"]} />
├── layouts/                 → PublicLayout, AdminLayout, PanelLayout (los dos últimos usan PanelBase)
├── pages/public/  pages/admin/  pages/panel/  pages/lugares/ (compartidas por admin y panel)
└── components/              → Logo, MenuUsuario, Cargando
```

### Trabajo en grupo

- Antes de empezar: `git pull`.
- Una rama por tarea: `git checkout -b nombre-tarea`, y al terminar Pull Request a `main`.
