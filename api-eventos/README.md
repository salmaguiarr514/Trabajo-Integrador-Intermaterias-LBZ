# API Eventos – CRUD de empresas

API del sistema de eventos **multitenant** (Node.js + Express + PostgreSQL).
Por ahora la API expone solo el CRUD de `empresas`; la base ya tiene el modelo completo.

## Puesta en marcha

1. Clonar el repo e instalar dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo `.env` (copiando `.env.example`) con la conexión a la base **compartida del grupo en Supabase**:
   ```
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   DATABASE_URL=postgresql://postgres.xxxx:CONTRASEÑA@aws-1-us-west-2.pooler.supabase.com:5432/postgres
   ```
   La `DATABASE_URL` se pide por privado al grupo (Supabase → Connect → URI → **Session pooler**).
   El `.env` **nunca** se sube a GitHub (ya está en `.gitignore`).
3. Levantar el servidor:
   ```bash
   npm run dev
   ```
   Queda en `http://localhost:3000`.

## Estructura

```
database/                             → scripts SQL numerados (ver "Base de datos")
src/index.js                           → crea el servidor y conecta todo
src/routes/empresas.routes.js          → QUÉ rutas existen
src/controllers/empresas.controller.js → QUÉ hace cada ruta
src/data/db.js                         → conexión a la base de datos
```

## Endpoints

| Método | Ruta                | Acción                   | Respuesta |
| ------ | ------------------- | ------------------------ | --------- |
| GET    | `/api/empresas`     | Listar todas las empresas | 200       |
| GET    | `/api/empresas/:id` | Obtener una empresa      | 200 / 404 |
| POST   | `/api/empresas`     | Crear una empresa        | 201 / 400 |
| PUT    | `/api/empresas/:id` | Editar una empresa       | 200 / 404 |
| DELETE | `/api/empresas/:id` | Eliminar una empresa     | 204 / 404 |

- Al crear, `nombre` y `cuit` son obligatorios (si faltan → 400). Un `cuit` repetido también responde 400.
- En el PUT se pueden mandar solo los campos a modificar; el resto queda igual. Un campo opcional enviado vacío (`""` o `null`) se borra.
- El `id` lo genera la base (SERIAL), nunca se toma del body.

Ejemplo de body para POST:
```json
{
  "nombre": "Mi Empresa",
  "cuit": "30-71111111-1",
  "email": "contacto@miempresa.com",
  "telefono": "351-4000000",
  "direccion": "Calle 123, Córdoba"
}
```

## Base de datos

Los scripts de [database/](database/) se corren **en orden** en Supabase (SQL Editor → pegar → Run):

| Script | Qué hace |
| --- | --- |
| `00_reset.sql` | Borra todo. **Solo desarrollo, y avisando al grupo** (la base es compartida) |
| `01` a `06` | Extensiones y tablas. `02` no pisa la tabla `empresas` existente: le agrega las columnas nuevas |
| `07_triggers.sql` | Reglas que no entran en FK ni CHECK |
| `08_vistas.sql` | `v_lugares`, `v_disponibilidad`, `v_cartelera`, `v_asistencia`, `v_recaudacion` |
| `10_seed_plataforma.sql` | Superadmin y 20 lugares de la plataforma |
| `11_seed_demo.sql` | 3 productoras, usuarios, artistas, 1 festival, 2 recitales y compras |

Usuarios de prueba: `admin@backstage.com` / `admin123` (superadmin); `staff@eventosdelcentro.com`,
`staff@fiestasnorte.com`, `staff@produccionessur.com` (empresa) y `lucia.gomez@mail.com`, `martin.diaz@mail.com`,
`sofia.perez@mail.com` (cliente), todos con `demo123`.

Los cambios de esquema posteriores van en un script nuevo (`12_agrega_x.sql`), nunca editando uno ya corrido.
El modelo está explicado en [docs/der/DER.md](../docs/der/DER.md).

- CORS solo acepta pedidos desde `FRONTEND_URL` (el front de Vite).
- Todo el grupo comparte **una sola base** en Supabase (la tabla `empresas` ya está creada ahí).
  Si uno crea o borra una empresa, los demás lo ven.
- [src/data/db.js](src/data/db.js) se conecta usando `DATABASE_URL` (con SSL).
- Si la URL trae `?sslmode=require` al final, sacarlo (el SSL ya lo configura `db.js`).

## Deploy (opcional)

Si se sube a Vercel, se carga `DATABASE_URL` en las variables de entorno del proyecto
(conviene la URL del **Transaction pooler**, puerto 6543).
