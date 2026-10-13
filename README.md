# Backstage – Trabajo práctico intermaterias

Un mismo sistema de gestión de eventos que se desarrolla y evalúa en **cuatro materias**.
Cada profesor pide algo distinto, así que la documentación está ordenada **por materia** en [docs/](docs/README.md).

| Materia | Qué evalúa | Entregable | Documentos |
| --- | --- | --- | --- |
| Programación 2 | El software: arquitectura, API, front | Código en este repo | [docs/programacion-2/](docs/programacion-2/plan-desarrollo.md) |
| Base de Datos | Modelo de datos y scripts SQL | DER + [api-eventos/database/](api-eventos/database/) | [docs/base-de-datos/](docs/base-de-datos/der.md) |
| Sistemas de Información | Relevamiento, análisis y diseño (DDD) | Avances en clase y un **documento formal escrito** | [docs/sistemas-de-informacion/](docs/sistemas-de-informacion/plan.md) |
| Sistemas Operativos | Despliegue con réplicas, Docker y Nginx | Demo + `docker-compose.yml` + `nginx.conf` | [docs/sistemas-operativos/](docs/sistemas-operativos/plan.md) |

> **Antes de seguir, ver [Alcance a resolver entre materias](docs/comun/alcance-entre-materias.md).**
> El alcance que fija Sistemas de Información no coincide con el del plan de desarrollo.

```
proyecto-eventos/
├── api-eventos/        → backend (Node + Express + PostgreSQL en Supabase) · puerto 3000
│   └── database/       → scripts SQL numerados
├── front-eventos/      → frontend (React + Vite + Ant Design) · puerto 5173
└── docs/               → documentación por materia (índice en docs/README.md)
```

---

## El software

Plataforma para **productoras de recitales y festivales**. Cada productora es un *tenant* (empresa)
y en el futuro gestionará sus propios eventos; este panel es para nosotros, los dueños de la
plataforma, y sirve para administrar las productoras registradas.

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
```

**front-eventos/.env**
```
VITE_API_URL=http://localhost:3000/api
```

Cada carpeta tiene un `.env.example` para copiar. Más detalle de la API en [api-eventos/README.md](api-eventos/README.md).

### Front

| Ruta | Pantalla |
| --- | --- |
| `/` | Listado de productoras (búsqueda, orden, filtro por estado, eliminar con confirmación) |
| `/empresas/nueva` | Formulario de alta |
| `/empresas/:id/editar` | Mismo formulario, precargado (incluye activar/desactivar) |
| cualquier otra | Página 404 |

```
front-eventos/src/
├── main.jsx                 → BrowserRouter + tema de Ant Design
├── App.jsx                  → QUÉ pantallas existen
├── services/empresasService.js → llamadas a la API (axios)
├── pages/                   → Empresas.jsx, EmpresaForm.jsx, NoEncontrada.jsx
└── components/Navbar.jsx
```

### Trabajo en grupo

- Antes de empezar: `git pull`.
- Una rama por tarea: `git checkout -b nombre-tarea`, y al terminar Pull Request a `main`.
